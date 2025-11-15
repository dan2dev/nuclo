import { parentPort, workerData } from 'worker_threads'
import { Window } from 'happy-dom'

// This worker runs in an isolated context with its own DOM
// Each request gets a fresh DOM environment

// Setup a virtual DOM for server-side rendering using Happy DOM
// Happy DOM has better CSSOM support than linkedom
const window = new Window()
const document = window.document

// Make DOM globals available for Nuclo
// IMPORTANT: Set these BEFORE importing Nuclo to avoid "document is not defined" errors
Object.assign(global, {
  window: window as any,
  document: document as any,
  HTMLElement: window.HTMLElement as any,
  Element: window.Element as any,
  Node: window.Node as any,
  Text: window.Text as any,
  Comment: window.Comment as any,
  CustomEvent: window.CustomEvent as any,
  Event: window.Event as any,
  EventTarget: window.EventTarget as any,
  // CSS-related globals (Happy DOM provides these)
  CSSStyleRule: window.CSSStyleRule as any,
  CSSMediaRule: window.CSSMediaRule as any,
  CSSRule: window.CSSRule as any,
  CSSStyleSheet: window.CSSStyleSheet as any,
  CSSStyleDeclaration: window.CSSStyleDeclaration as any,
  StyleSheet: window.StyleSheet as any,
})

// Use dynamic imports to ensure globals are set first
async function renderApp() {
  try {
    // Now import Nuclo and your app - each worker gets fresh instances
    const { render } = await import('nuclo')
    const { app } = await import('./app.ts')

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
  } catch (error) {
    // Send error back to main thread
    parentPort?.postMessage({
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
  }
}

renderApp()
