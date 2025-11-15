import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { Worker } from 'worker_threads'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = new Hono()

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
    (result) => c.json(result),
    (error) => c.json({ error: error.message }, 500),
  )
})

app.get('/health', (c) => c.text('ok'))

const port = Number(process.env.PORT ?? 8787)

console.log(`Hono server listening on http://localhost:${port}`)

serve({
  fetch: app.fetch,
  port,
})
