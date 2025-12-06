/**
 * String utility functions
 */

/**
 * Converts camelCase to kebab-case (optimized for performance)
 * Uses direct character code manipulation for maximum speed
 * @example camelToKebab('backgroundColor') => 'background-color'
 */
export function camelToKebab(str: string): string {
  let result = '';
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    // A-Z is 65-90, a-z is 97-122 (difference of 32)
    if (code >= 65 && code <= 90) {
      if (i > 0) result += '-';
      result += String.fromCharCode(code + 32);
    } else {
      result += str[i];
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
