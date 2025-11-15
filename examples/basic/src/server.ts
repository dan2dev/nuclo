import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { Worker } from 'worker_threads'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { serveStatic } from '@hono/node-server/serve-static'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = new Hono()

// Serve static files (for production builds)
app.use('/assets/*', serveStatic({ root: './dist' }))
app.use('/vite.svg', serveStatic({ path: './vite.svg' }))

app.get('/', async (c) => {
  return new Promise((resolve, reject) => {
    const worker = new Worker(join(__dirname, 'worker.ts'), {
      workerData: {
        requestPath: c.req.path,
        timestamp: Date.now(),
      },
      execArgv: ['--import', 'tsx'],
    })

    worker.on('message', (result) => {
      resolve(result)
    })

    worker.on('error', (error) => {
      reject(error)
    })

    worker.on('exit', (code) => {
      if (code !== 0) {
        reject(new Error(`Worker stopped with exit code ${code}`))
      }
    })
  }).then(
    (result) => {
      // Return full HTML document with SSR content and client-side hydration script
      if (result.html) {
        // In development, use Vite dev server (default port 5173)
        // In production, use built assets from /assets
        const isDev = process.env.NODE_ENV !== 'production'
        const viteScript = isDev
          ? `<script type="module" src="http://localhost:5173/@vite/client"></script>
<script type="module" src="http://localhost:5173/src/main.ts"></script>`
          : `<script type="module" src="/assets/main.js"></script>`

        const fullHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>My Tasks - Nuclo Example</title>
    <meta name="description" content="A beautiful task manager built with Nuclo and styled with utility functions" />
  </head>
  <body>
    <div id="app">${result.html}</div>
    ${viteScript}
  </body>
</html>`
        return c.html(fullHtml)
      }
      return c.json(result)
    },
    (error) => c.html(`<h1>Error</h1><pre>${error.message}</pre>`, 500),
  )
})

app.get('/health', (c) => c.text('ok'))

const port = Number(process.env.PORT ?? 8787)

console.log(`Hono server listening on http://localhost:${port}`)

serve({
  fetch: app.fetch,
  port,
})
