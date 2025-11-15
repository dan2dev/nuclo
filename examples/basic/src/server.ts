import { serve } from '@hono/node-server'
import { Hono } from 'hono'

const app = new Hono()

app.get('/', (c) =>
  c.json({
    message: 'Hello from Nuclo + Hono!',
  }),
)

app.get('/health', (c) => c.text('ok'))

const port = Number(process.env.PORT ?? 8787)

console.log(`Hono server listening on http://localhost:${port}`)

serve({
  fetch: app.fetch,
  port,
})
