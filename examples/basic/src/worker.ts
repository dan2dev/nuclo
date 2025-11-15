import { parentPort, workerData } from 'worker_threads'
import { parseHTML } from 'linkedom'

// This worker runs in an isolated context with its own DOM
// Each request gets a fresh DOM environment

// Setup a virtual DOM for server-side rendering
const { window, document } = parseHTML('<!DOCTYPE html><html><head></head><body></body></html>')

// Make DOM globals available for Nuclo
global.window = window as any
global.document = document as any
global.HTMLElement = window.HTMLElement as any
global.Element = window.Element as any
global.Node = window.Node as any
global.Text = window.Text as any
global.Comment = window.Comment as any

// Now import Nuclo and your app - each worker gets fresh instances
import { render } from 'nuclo'
import { app } from './app.ts'

// Render the app to the virtual DOM
render(app, document.body)

// Extract the HTML
const html = document.body.innerHTML

const result = {
  html,
  timestamp: new Date().toISOString(),
  workerData,
}

// Send result back to main thread
parentPort?.postMessage(result)
