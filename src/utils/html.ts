/**
 * Strips HTML tags from a string and returns plain text.
 * Also decodes common HTML entities and normalizes whitespace.
 *
 * @param html - The HTML string to strip (can be null or undefined)
 * @returns The plain text without HTML tags
 */
export function stripHtml(html: string | null | undefined): string {
  if (!html) {
    return ''
  }

  // Create a temporary DOM element to parse HTML
  const temp = document.createElement('div')
  temp.innerHTML = html

  // Get text content (this automatically decodes HTML entities)
  let text = temp.textContent || temp.innerText || ''

  // Normalize whitespace: collapse multiple spaces/newlines into single spaces
  // and trim leading/trailing whitespace
  text = text.replace(/\s+/g, ' ').trim()

  return text
}
