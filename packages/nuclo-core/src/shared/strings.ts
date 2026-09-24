/**
 * camelCase → kebab-case for CSS property (and attribute) names. A leading
 * capital becomes a leading dash, as vendor prefixes need
 * (WebkitTransition → -webkit-transition). Char-code loop with a
 * no-uppercase fast path: SSR runs this per style declaration.
 */
export function camelToKebab(str: string): string {
  let firstUpper = 0;
  for (; firstUpper < str.length; firstUpper++) {
    const code = str.charCodeAt(firstUpper);
    if (code >= 65 && code <= 90) break;
  }
  if (firstUpper === str.length) return str;

  let result = str.slice(0, firstUpper);
  for (let i = firstUpper; i < str.length; i++) {
    const code = str.charCodeAt(i);
    // A-Z is 65-90, a-z is 97-122 (difference of 32)
    result += code >= 65 && code <= 90 ? '-' + String.fromCharCode(code + 32) : str[i];
  }
  return result;
}

const ATTR_ESCAPE_RE = /[&<>"']/;
const TEXT_ESCAPE_RE = /[&<>]/;

/**
 * Escapes HTML special characters in attribute values (includes " and ')
 */
export function escapeHtml(text: string): string {
  // Fast path: most strings contain no special characters at all.
  const first = ATTR_ESCAPE_RE.exec(text);
  if (!first) return text;

  let result = '';
  let last = 0;
  for (let i = first.index; i < text.length; i++) {
    let escaped: string;
    switch (text.charCodeAt(i)) {
      case 38: escaped = '&amp;'; break;   // &
      case 60: escaped = '&lt;'; break;    // <
      case 62: escaped = '&gt;'; break;    // >
      case 34: escaped = '&quot;'; break;  // "
      case 39: escaped = '&#039;'; break;  // '
      default: continue;
    }
    result += text.slice(last, i) + escaped;
    last = i + 1;
  }
  return result + text.slice(last);
}

/**
 * Escapes HTML special characters in text node content.
 * Only &, < and > need escaping — quotes are safe inside text nodes.
 */
export function escapeText(text: string): string {
  const first = TEXT_ESCAPE_RE.exec(text);
  if (!first) return text;

  let result = '';
  let last = 0;
  for (let i = first.index; i < text.length; i++) {
    let escaped: string;
    switch (text.charCodeAt(i)) {
      case 38: escaped = '&amp;'; break;  // &
      case 60: escaped = '&lt;'; break;   // <
      case 62: escaped = '&gt;'; break;   // >
      default: continue;
    }
    result += text.slice(last, i) + escaped;
    last = i + 1;
  }
  return result + text.slice(last);
}
