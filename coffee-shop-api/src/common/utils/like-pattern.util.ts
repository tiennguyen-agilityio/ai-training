/**
 * Escapes the LIKE special characters (`%`, `_` and the `\` escape character)
 * so the text is matched literally. One pass, so added backslashes are not
 * escaped again.
 */
export function escapeLikePattern(text: string): string {
  return text.replace(/[\\%_]/g, '\\$&');
}
