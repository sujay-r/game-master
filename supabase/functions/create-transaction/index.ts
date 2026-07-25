import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}

function parseIsoDate(value: unknown, fieldName: string): string | Response {
  if (typeof value !== 'string') {
    return jsonResponse({ error: `${fieldName} must be a valid ISO 8601 string` }, 400)
  }
  const parsedDate = new Date(value)
  if (Number.isNaN(parsedDate.getTime())) {
    return jsonResponse({ error: `${fieldName} must be a valid ISO 8601 string` }, 400)
  }
  return parsedDate.toISOString()
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  const apiKey = req.headers.get('x-api-key')
  const expectedApiKey = Deno.env.get('API_KEY')
  if (!apiKey || !expectedApiKey || apiKey !== expectedApiKey) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400)
  }

  if ('source' in body) {
    return jsonResponse({ error: "The 'source' field is not allowed" }, 400)
  }

  const { amount, transactionTypeId, transactionTypeName, description, date, createdAt, paymentMode } = body

  if (typeof amount !== 'number' || Number.isNaN(amount) || amount <= 0) {
    return jsonResponse({ error: 'Amount must be a positive number' }, 400)
  }

  if (typeof description !== 'string' || description.trim().length === 0) {
    return jsonResponse({ error: 'Description must be a non-empty string' }, 400)
  }

  let finalDate: string
  if (date === undefined || date === null) {
    finalDate = new Date().toISOString()
  } else {
    const parsed = parseIsoDate(date, 'Date')
    if (parsed instanceof Response) {
      return parsed
    }
    finalDate = parsed
  }

  let finalCreatedAt: string | undefined
  if (createdAt !== undefined && createdAt !== null) {
    const parsed = parseIsoDate(createdAt, 'createdAt')
    if (parsed instanceof Response) {
      return parsed
    }
    finalCreatedAt = parsed
  }

  let finalPaymentMode: string | undefined
  if (paymentMode !== undefined && paymentMode !== null) {
    if (typeof paymentMode !== 'string') {
      return jsonResponse({ error: 'paymentMode must be a string' }, 400)
    }
    finalPaymentMode = paymentMode.trim()
  }

  const hasTransactionTypeId = transactionTypeId !== undefined && transactionTypeId !== null
  const hasTransactionTypeName = transactionTypeName !== undefined && transactionTypeName !== null

  if (hasTransactionTypeId && hasTransactionTypeName) {
    return jsonResponse(
      { error: 'Provide either transactionTypeId or transactionTypeName, not both' },
      400,
    )
  }

  if (!hasTransactionTypeId && !hasTransactionTypeName) {
    return jsonResponse(
      { error: 'Either transactionTypeId or transactionTypeName is required' },
      400,
    )
  }

  if (
    hasTransactionTypeId &&
    (typeof transactionTypeId !== 'number' ||
      !Number.isInteger(transactionTypeId) ||
      transactionTypeId <= 0)
  ) {
    return jsonResponse({ error: 'transactionTypeId must be a positive integer' }, 400)
  }

  if (hasTransactionTypeName && (typeof transactionTypeName !== 'string' || transactionTypeName.trim().length === 0)) {
    return jsonResponse({ error: 'transactionTypeName must be a non-empty string' }, 400)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

  let resolvedTransactionTypeId: number

  if (hasTransactionTypeId) {
    const { data: typeData, error: typeError } = await supabase
      .from('TransactionType')
      .select('id')
      .eq('id', transactionTypeId as number)
      .maybeSingle()

    if (typeError) {
      console.error('Error validating TransactionType:', typeError)
      return jsonResponse({ error: 'Failed to validate transaction type' }, 500)
    }

    if (!typeData) {
      return jsonResponse(
        { error: 'transactionTypeId does not reference an existing TransactionType' },
        400,
      )
    }

    resolvedTransactionTypeId = typeData.id
  } else {
    const { data: typeData, error: typeError } = await supabase
      .from('TransactionType')
      .select('id')
      .eq('name', (transactionTypeName as string).trim())
      .maybeSingle()

    if (typeError) {
      console.error('Error resolving TransactionType by name:', typeError)
      return jsonResponse({ error: 'Failed to validate transaction type' }, 500)
    }

    if (!typeData) {
      return jsonResponse(
        { error: 'transactionTypeName does not reference an existing TransactionType' },
        400,
      )
    }

    resolvedTransactionTypeId = typeData.id
  }

  const insertPayload: Record<string, unknown> = {
    amount,
    transaction_type_id: resolvedTransactionTypeId,
    description: description.trim(),
    date: finalDate,
    source: 'api',
  }

  if (finalCreatedAt !== undefined) {
    insertPayload.created_at = finalCreatedAt
  }
  if (finalPaymentMode !== undefined) {
    insertPayload.payment_mode = finalPaymentMode
  }

  const { data, error } = await supabase
    .from('Transaction')
    .insert(insertPayload)
    .select()
    .single()

  if (error) {
    console.error('Error creating transaction:', error)
    return jsonResponse({ error: 'Failed to create transaction' }, 500)
  }

  const response: Record<string, unknown> = {
    id: data.id,
    amount: data.amount,
    transactionTypeId: data.transaction_type_id,
    description: data.description,
    date: data.date,
    source: data.source,
    createdAt: data.created_at,
  }

  if (data.payment_mode !== undefined && data.payment_mode !== null) {
    response.paymentMode = data.payment_mode
  }

  return jsonResponse(response, 201)
})
