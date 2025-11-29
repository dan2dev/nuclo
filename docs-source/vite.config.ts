import { defineConfig } from 'vite'

export default defineConfig({
  base: '/',
  build: {
    outDir: '../docs',
    emptyOutDir: true,
    modulePreload: false,
    rollupOptions: {
      output: {
        format: 'iife',
        inlineDynamicImports: true,
        entryFileNames: 'assets/main.js',
      }
    }
  },
  plugins: [
    {
      name: 'sync-script',
      transformIndexHtml(html) {
        // Extract script src from head
        const scriptMatch = html.match(/<script type="module" crossorigin src="([^"]+)"><\/script>/);
        if (!scriptMatch) return html;

        const scriptSrc = scriptMatch[1];

        // Remove the script from head
        let result = html.replace(
          /<script type="module" crossorigin src="([^"]+)"><\/script>/,
          ''
        );

        // Add synchronous script at the end of body
        result = result.replace(
          /<\/body>/,
          `    <script src="${scriptSrc}"></script>\n  </body>`
        );

        return result;
      }
    }
  ]
})
