/**
 * String utility functions
 */

/**
 * Converts camelCase to kebab-case (optimized for performance)
 * @example camelToKebab('backgroundColor') => 'background-color'
 */
export function camelToKebab(str: string): string {
  let result = '';
  let prevWasUpper = false;

  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    const code = str.charCodeAt(i);

    // A-Z is 65-90
    if (code >= 65 && code <= 90) {
      if (i > 0 && !prevWasUpper) {
        result += '-';
      }
      result += char.toLowerCase();
      prevWasUpper = true;
    } else {
      result += char;
      prevWasUpper = false;
    }
  }

  return result;
}

/**
 * Escapes HTML special characters to prevent XSS
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, char => map[char] || char);
}
