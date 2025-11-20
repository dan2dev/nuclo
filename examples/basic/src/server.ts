import { Hono } from 'hono'
// Use Deno's built-in Worker for request isolation instead of Node's worker_threads.
import { serveStatic } from 'hono/deno'

// Use a URL for the worker module so it works with both Deno and Node (when using wasm/compat)
const workerModuleUrl = new URL('./worker1.ts', import.meta.url).href

const app = new Hono()

// Type for data returned by the worker; extend as needed for your SSR payload
type WorkerResult = { html?: string;[key: string]: unknown }

// Serve static files (for production builds)
app.use('/assets/*', serveStatic({ root: './dist' }))
app.use('/vite.svg', serveStatic({ path: './vite.svg' }))

app.get('/', (c) => {
  return new Promise<WorkerResult>((resolve, reject) => {
    // Deno/Browser-style Worker
    const worker = new Worker(workerModuleUrl, {
      type: 'module',
    } as WorkerOptions)

    // Listen for messages from the worker
    worker.onmessage = (e: MessageEvent) => {
      // Received result from worker
      const result = e.data as WorkerResult
      resolve(result)
      // Terminate worker to free resources once we've got a result
      worker.terminate()
    }

    // Listen for errors from the worker
    worker.onerror = (err) => {
      reject(err)
      worker.terminate()
    }

    // Send a simple serializable payload to the worker
    worker.postMessage({
      requestPath: c.req.path,
      timestamp: Date.now(),
    })
  }).then(
    (result) => {
      // console.log("-----------");
      // console.log("-----------", result);
      // Return full HTML document with SSR content and client-side hydration script
      if (result && result.html) {
        // In development, use Vite dev server (default port 5173)
        // In production, use built assets from /assets
        const isDev = Deno.env.get('NODE_ENV') !== 'production'
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
    ${result.html}
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

app.get('/health2', (c) => {
  console.log('Health2 check at', new Date().toISOString())

  return c.json({ status: 'ok', timestamp: Date.now() })
});

const port = Number(Deno.env.get('PORT') ?? 8787)

console.log(`Hono server listening on http://localhost:${port}`)

Deno.serve({
  port,
}, app.fetch)
