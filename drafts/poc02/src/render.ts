function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function renderTable(data: Record<string, string>): string {
  const entries = Object.entries(data)
  if (entries.length === 0) {
    return `<p class="empty">— none —</p>`
  }
  return `
    <table>
      <thead>
        <tr><th>Key</th><th>Value</th></tr>
      </thead>
      <tbody>
        ${entries.map(([k, v]) => `<tr><td>${escapeHtml(k)}</td><td>${escapeHtml(v)}</td></tr>`).join('')}
      </tbody>
    </table>
  `
}

export function renderPage(
  url: string,
  params: Record<string, string>,
  cookies: Record<string, string>,
): string {
  return `
    <div class="debug-container">
      <h1>Request Inspector</h1>

      <section class="debug-section">
        <h2>URL</h2>
        <div class="url-box">${escapeHtml(url)}</div>
      </section>

      <section class="debug-section">
        <h2>Query Params</h2>
        ${renderTable(params)}
      </section>

      <section class="debug-section">
        <h2>Cookies</h2>
        ${renderTable(cookies)}
      </section>
    </div>
  `
}