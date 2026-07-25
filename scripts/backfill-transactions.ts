#!/usr/bin/env -S deno run --allow-read --allow-net --allow-env

declare let Deno:
  | {
      args: string[]
      readFileSync(path: string): Uint8Array
      exit(code: number): never
    }
  | undefined

/**
 * Backfill transactions from a Google Sheets CSV export into the production DB
 * via the create-transaction edge function.
 *
 * Deno:
 *   deno run --allow-read --allow-net --allow-env scripts/backfill-transactions.ts \
 *     --url https://<project-ref>.supabase.co/functions/v1/create-transaction \
 *     --api-key <key>
 *
 * Node (20+):
 *   npx tsx scripts/backfill-transactions.ts \
 *     --url https://<project-ref>.supabase.co/functions/v1/create-transaction \
 *     --api-key <key>
 */

interface CliArgs {
  csv: string
  url: string
  apiKey: string
  dryRun: boolean
  startRow: number
  endRow: number | undefined
  dateCol: string
  descriptionCol: string
  categoryCol: string
  amountCol: string
  paymentModeCol: string
  createdAtCol: string | undefined
  dateFormat: 'auto' | 'iso' | 'dd/mm/yyyy' | 'mm/dd/yyyy' | 'dd-mm-yyyy'
  anonKey?: string
  concurrency: number
}

interface ParsedRow {
  rowIndex: number
  date: string
  description: string
  transactionTypeName: string
  amount: number
  paymentMode?: string
  createdAt: string
}

interface Failure {
  rowIndex: number
  reason: string
}

const CATEGORY_NAME_MAP: Record<string, string> = {
  Wants: 'Want',
  Want: 'Want',
  Needs: 'Need',
  Need: 'Need',
  Investment: 'Investment',
  Income: 'Income',
  Lending: 'Lending',
}

function parseArgs(): CliArgs {
  const rawArgs = typeof Deno !== 'undefined' ? Deno.args : process.argv.slice(2)
  const args = new Map<string, string | boolean>()

  for (let i = 0; i < rawArgs.length; i++) {
    const arg = rawArgs[i]
    if (arg.startsWith('--')) {
      const key = arg.slice(2)
      const next = rawArgs[i + 1]
      if (next !== undefined && !next.startsWith('--')) {
        args.set(key, next)
        i++
      } else {
        args.set(key, true)
      }
    }
  }

  const csv = (args.get('csv') as string | undefined) || 'sujay_financial_transactions.csv'
  const url = args.get('url') as string | undefined
  const apiKey = args.get('api-key') as string | undefined

  if (!url) {
    throw new Error('--url is required')
  }
  if (!apiKey) {
    throw new Error('--api-key is required')
  }

  return {
    csv,
    url,
    apiKey,
    dryRun: args.has('dry-run'),
    startRow: Math.max(1, parseInt((args.get('start-row') as string | undefined) || '1', 10)),
    endRow: args.has('end-row')
      ? parseInt(args.get('end-row') as string, 10)
      : undefined,
    dateCol: (args.get('date-col') as string | undefined) || 'Date',
    descriptionCol: (args.get('description-col') as string | undefined) || 'Description',
    categoryCol: (args.get('category-col') as string | undefined) || 'Category',
    amountCol: (args.get('amount-col') as string | undefined) || 'Amount',
    paymentModeCol: (args.get('payment-mode-col') as string | undefined) || 'Payment Mode',
    createdAtCol: args.get('created-at-col') as string | undefined,
    dateFormat: (args.get('date-format') as CliArgs['dateFormat'] | undefined) || 'auto',
    anonKey: args.get('anon-key') as string | undefined,
    concurrency: Math.max(1, parseInt((args.get('concurrency') as string | undefined) || '5', 10)),
  }
}

async function readCsvFile(path: string): Promise<string> {
  if (typeof Deno !== 'undefined') {
    return new TextDecoder().decode(Deno.readFileSync(path))
  }
  // Node fallback
  const fs = await import('node:fs')
  return fs.readFileSync(path, 'utf-8')
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          current += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        current += char
      }
    } else {
      if (char === '"') {
        inQuotes = true
      } else if (char === ',') {
        fields.push(current)
        current = ''
      } else {
        current += char
      }
    }
  }

  fields.push(current)
  return fields
}

function hasUnclosedQuote(text: string): boolean {
  let inQuote = false
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '"') {
      if (text[i + 1] === '"') {
        i++
      } else {
        inQuote = !inQuote
      }
    }
  }
  return inQuote
}

function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/)
  const rows: string[][] = []
  let headers: string[] | undefined
  let buffer = ''

  for (let i = 0; i < lines.length; i++) {
    if (buffer.length > 0) {
      buffer += '\n'
    }
    buffer += lines[i]

    if (hasUnclosedQuote(buffer)) {
      continue
    }

    if (buffer.trim().length === 0) {
      buffer = ''
      continue
    }

    if (headers === undefined) {
      headers = parseCsvLine(buffer).map((h) => h.trim())
    } else {
      rows.push(parseCsvLine(buffer))
    }
    buffer = ''
  }

  if (headers === undefined) {
    throw new Error('CSV file is empty')
  }

  if (buffer.trim().length > 0) {
    rows.push(parseCsvLine(buffer))
  }

  return { headers, rows }
}

function findColumnIndex(headers: string[], name: string, required: boolean): number {
  const index = headers.findIndex((h) => h.toLowerCase() === name.toLowerCase())
  if (index === -1 && required) {
    throw new Error(`Required column "${name}" not found in CSV headers: [${headers.join(', ')}]`)
  }
  return index
}

function cleanAmount(value: string): number {
  const cleaned = value
    .replace(/[₹$€£¥]/g, '')
    .replace(/,/g, '')
    .replace(/"/g, '')
    .trim()

  const parsed = parseFloat(cleaned)
  if (Number.isNaN(parsed) || parsed < 0) {
    throw new Error(`Cannot parse amount: "${value}"`)
  }
  return parsed
}

function parseDate(value: string, format: CliArgs['dateFormat']): Date {
  const trimmed = value.trim()

  if (format === 'iso') {
    const parsed = new Date(trimmed)
    if (Number.isNaN(parsed.getTime())) {
      throw new Error(`Cannot parse ISO date: "${value}"`)
    }
    return parsed
  }

  if (format === 'dd/mm/yyyy') {
    const [day, month, year] = trimmed.split('/').map(Number)
    if (!day || !month || !year) {
      throw new Error(`Cannot parse dd/mm/yyyy date: "${value}"`)
    }
    const parsed = new Date(Date.UTC(year, month - 1, day))
    if (Number.isNaN(parsed.getTime())) {
      throw new Error(`Cannot parse dd/mm/yyyy date: "${value}"`)
    }
    return parsed
  }

  if (format === 'mm/dd/yyyy') {
    const [month, day, year] = trimmed.split('/').map(Number)
    if (!month || !day || !year) {
      throw new Error(`Cannot parse mm/dd/yyyy date: "${value}"`)
    }
    const parsed = new Date(Date.UTC(year, month - 1, day))
    if (Number.isNaN(parsed.getTime())) {
      throw new Error(`Cannot parse mm/dd/yyyy date: "${value}"`)
    }
    return parsed
  }

  if (format === 'dd-mm-yyyy') {
    const [datePart, timePart] = trimmed.split(' ')
    const [day, month, year] = datePart.split('-').map(Number)
    if (!day || !month || !year) {
      throw new Error(`Cannot parse dd-mm-yyyy date: "${value}"`)
    }
    let hours = 0
    let minutes = 0
    let seconds = 0
    if (timePart) {
      const timeParts = timePart.split(':').map(Number)
      if (timeParts.length === 3) {
        hours = timeParts[0]
        minutes = timeParts[1]
        seconds = timeParts[2]
      }
    }
    const parsed = new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds))
    // CSV timestamps are in IST (UTC+5:30); treat them as UTC then shift back.
    parsed.setUTCMinutes(parsed.getUTCMinutes() - 330)
    if (Number.isNaN(parsed.getTime())) {
      throw new Error(`Cannot parse dd-mm-yyyy date: "${value}"`)
    }
    return parsed
  }

  // auto: try ISO first, then dd/mm/yyyy, then dd-mm-yyyy, then mm/dd/yyyy
  const iso = new Date(trimmed)
  if (!Number.isNaN(iso.getTime())) {
    return iso
  }

  const slashParts = trimmed.split('/')
  if (slashParts.length === 3) {
    const [a, b, year] = slashParts.map(Number)
    if (a && b && year) {
      // Prefer dd/mm/yyyy unless first part > 12
      const day = a > 12 ? a : b
      const month = a > 12 ? b : a
      const parsed = new Date(Date.UTC(year, month - 1, day))
      if (!Number.isNaN(parsed.getTime())) {
        return parsed
      }
    }
  }

  const hyphenParts = trimmed.split('-')
  if (hyphenParts.length === 3) {
    const [dayStr, monthStr, yearAndTime] = hyphenParts
    const [yearStr, ...timeParts] = yearAndTime.split(' ')
    const day = Number(dayStr)
    const month = Number(monthStr)
    const year = Number(yearStr)
    if (day && month && year) {
      let hours = 0
      let minutes = 0
      let seconds = 0
      if (timeParts.length > 0 && timeParts[0]) {
        const t = timeParts[0].split(':').map(Number)
        if (t.length === 3) {
          hours = t[0]
          minutes = t[1]
          seconds = t[2]
        }
      }
      const parsed = new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds))
      // CSV timestamps are in IST (UTC+5:30); treat them as UTC then shift back.
      parsed.setUTCMinutes(parsed.getUTCMinutes() - 330)
      if (!Number.isNaN(parsed.getTime())) {
        return parsed
      }
    }
  }

  throw new Error(`Cannot parse date: "${value}"`)
}

function mapCategory(value: string): string {
  const normalized = value.trim()
  const mapped = CATEGORY_NAME_MAP[normalized]
  if (!mapped) {
    throw new Error(`Unmapped category: "${value}"`)
  }
  return mapped
}

function buildRequestBody(row: ParsedRow): Record<string, unknown> {
  const body: Record<string, unknown> = {
    amount: row.amount,
    transactionTypeName: row.transactionTypeName,
    description: row.description,
    date: row.date,
    createdAt: row.createdAt,
  }
  if (row.paymentMode !== undefined && row.paymentMode.length > 0) {
    body.paymentMode = row.paymentMode
  }
  return body
}

async function postTransaction(
  url: string,
  apiKey: string,
  body: Record<string, unknown>,
  anonKey: string | undefined,
): Promise<void> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
  }
  if (anonKey) {
    headers['apikey'] = anonKey
  }
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`HTTP ${response.status}: ${text}`)
  }
}

async function processInParallel<T, R>(
  items: T[],
  concurrency: number,
  processor: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = []
  let index = 0

  async function worker(): Promise<void> {
    while (index < items.length) {
      const currentIndex = index++
      results[currentIndex] = await processor(items[currentIndex])
    }
  }

  const workers = Array.from({ length: concurrency }, () => worker())
  await Promise.all(workers)
  return results
}

async function main(): Promise<void> {
  const args = parseArgs()
  console.log(`Reading CSV: ${args.csv}`)

  const text = await readCsvFile(args.csv)
  const { headers, rows } = parseCsv(text)

  console.log(`Found columns: [${headers.join(', ')}]`)

  const colIndex = {
    date: findColumnIndex(headers, args.dateCol, true),
    description: findColumnIndex(headers, args.descriptionCol, true),
    category: findColumnIndex(headers, args.categoryCol, true),
    amount: findColumnIndex(headers, args.amountCol, true),
    paymentMode: findColumnIndex(headers, args.paymentModeCol, false),
    createdAt: args.createdAtCol
      ? findColumnIndex(headers, args.createdAtCol, true)
      : undefined,
  }

  const startIndex = Math.max(0, args.startRow - 1)
  const endIndex = args.endRow !== undefined ? Math.min(args.endRow, rows.length) : rows.length
  const selectedRows = rows.slice(startIndex, endIndex)

  console.log(`Processing rows ${startIndex + 1} to ${endIndex} of ${rows.length}`)

  const parsedRows: ParsedRow[] = []
  const parseFailures: Failure[] = []

  for (let i = 0; i < selectedRows.length; i++) {
    const rowIndex = startIndex + i + 1
    const row = selectedRows[i]

    try {
      const dateValue = row[colIndex.date]
      const description = row[colIndex.description]?.trim()
      const category = row[colIndex.category]
      const amountValue = row[colIndex.amount]
      const paymentModeValue =
        colIndex.paymentMode >= 0 ? row[colIndex.paymentMode]?.trim() : undefined
      const createdAtValue =
        colIndex.createdAt !== undefined ? row[colIndex.createdAt] : undefined

      if (!description) {
        throw new Error('Description is empty')
      }

      const date = parseDate(dateValue, args.dateFormat)
      const createdAt = createdAtValue
        ? parseDate(createdAtValue, args.dateFormat)
        : date

      parsedRows.push({
        rowIndex,
        date: date.toISOString(),
        description,
        transactionTypeName: mapCategory(category),
        amount: cleanAmount(amountValue),
        paymentMode: paymentModeValue,
        createdAt: createdAt.toISOString(),
      })
    } catch (err) {
      parseFailures.push({
        rowIndex,
        reason: err instanceof Error ? err.message : String(err),
      })
    }
  }

  console.log(`Parsed ${parsedRows.length} rows; ${parseFailures.length} parse failures`)

  if (args.dryRun) {
    console.log('\nDry run — no rows will be posted.')
    for (const row of parsedRows.slice(0, 5)) {
      console.log(`Row ${row.rowIndex}: ${JSON.stringify(buildRequestBody(row))}`)
    }
    if (parsedRows.length > 5) {
      console.log(`... and ${parsedRows.length - 5} more`)
    }
    if (parseFailures.length > 0) {
      console.log('\nParse failures:')
      for (const failure of parseFailures) {
        console.log(`  Row ${failure.rowIndex}: ${failure.reason}`)
      }
    }
    return
  }

  let successCount = 0
  const postFailures: Failure[] = []

  await processInParallel(parsedRows, args.concurrency, async (row) => {
    const body = buildRequestBody(row)
    try {
      await postTransaction(args.url, args.apiKey, body, args.anonKey)
      successCount++
      if (successCount % 10 === 0) {
        console.log(`  ... ${successCount} rows ingested`)
      }
    } catch (err) {
      postFailures.push({
        rowIndex: row.rowIndex,
        reason: err instanceof Error ? err.message : String(err),
      })
    }
  })

  console.log(`\nBackfill complete.`)
  console.log(`  Success: ${successCount}`)
  console.log(`  Parse failures: ${parseFailures.length}`)
  console.log(`  POST failures: ${postFailures.length}`)

  const allFailures = [...parseFailures, ...postFailures]
  if (allFailures.length > 0) {
    console.log('\nFailures:')
    for (const failure of allFailures.slice(0, 20)) {
      console.log(`  Row ${failure.rowIndex}: ${failure.reason}`)
    }
    if (allFailures.length > 20) {
      console.log(`  ... and ${allFailures.length - 20} more`)
    }
    exit(1)
  }
}

function exit(code: number): never {
  if (typeof Deno !== 'undefined') {
    Deno.exit(code)
  }
  process.exit(code)
}

main().catch((err) => {
  console.error('Backfill failed:', err)
  exit(1)
})
