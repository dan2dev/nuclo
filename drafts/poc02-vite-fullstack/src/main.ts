import './style.css'
import { renderPage } from './render.ts'

const url = window.location.href

const params = Object.fromEntries(
  new URLSearchParams(window.location.search).entries()
)

const cookies = Object.fromEntries(
  (document.cookie || '')
    .split(';')
    .map(c => c.trim())
    .filter(Boolean)
    .map(c => {
      const [k, ...rest] = c.split('=')
      return [k.trim(), decodeURIComponent(rest.join('='))]
    })
)

document.querySelector<HTMLDivElement>('#app')!.innerHTML = renderPage(url, params, cookies)