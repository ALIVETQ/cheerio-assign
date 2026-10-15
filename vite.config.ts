/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'
import type { Connect } from 'vite'
import type { IncomingMessage, ServerResponse } from 'http'

// ─── Load .env.local for dev API middleware ───────────────────────────────────
function loadEnvLocal(): Record<string, string> {
  const envPath = resolve(process.cwd(), '.env.local')
  if (!existsSync(envPath)) return {}
  const lines = readFileSync(envPath, 'utf8').split(/\r?\n/)
  const vars: Record<string, string> = {}
  for (const line of lines) {
    const match = line.match(/^([^#=]+)=(.*)$/)
    if (!match) continue
    const key = match[1].trim()
    let value = match[2].trim()
    // Strip surrounding quotes if present
    if ((value.startsWith('"') && value.endsWith('"')) || 
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    vars[key] = value
  }
  return vars
}

// ─── Dev middleware: forward /api/* to Vercel-style handlers ─────────────────
function apiMiddleware(): Connect.NextHandleFunction {
  return async (req: IncomingMessage, res: ServerResponse, next) => {
    if (!req.url?.startsWith('/api/')) return next()

    // Inject .env.local vars into process.env so handlers can read them
    const envVars = loadEnvLocal()
    for (const [k, v] of Object.entries(envVars)) {
      if (!process.env[k]) process.env[k] = v
    }

    // Parse the route path
    const urlPath = req.url.split('?')[0] // e.g. /api/route
    const handlerPath = resolve(process.cwd(), urlPath.slice(1) + '.ts') // api/route.ts

    if (!existsSync(handlerPath)) return next()

    // Collect body
    let rawBody = ''
    await new Promise<void>((resolve) => {
      req.on('data', (chunk) => { rawBody += chunk })
      req.on('end', resolve)
    })

    let parsedBody: unknown = undefined
    if (rawBody) {
      try { parsedBody = JSON.parse(rawBody) } catch { /* leave undefined */ }
    }

    // Build minimal VercelRequest / VercelResponse shims
    const vercelReq = {
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: parsedBody,
      query: Object.fromEntries(new URLSearchParams(req.url.split('?')[1] ?? '')),
    } as import('@vercel/node').VercelRequest

    let statusCode = 200
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    let body = ''

    const vercelRes = {
      status(code: number) { statusCode = code; return vercelRes },
      json(data: unknown) { body = JSON.stringify(data); return vercelRes },
      setHeader(k: string, v: string) { headers[k] = v; return vercelRes },
      end(data?: string) { body = data ?? body; return vercelRes },
    } as unknown as import('@vercel/node').VercelResponse

    try {
      // Use ssrLoadModule so Vite resolves TypeScript imports properly
      const viteServer = (req as any).__viteServer
      if (viteServer && typeof viteServer.ssrLoadModule === 'function') {
        const mod = await viteServer.ssrLoadModule(handlerPath)
        await mod.default(vercelReq, vercelRes)
      } else {
        // Fallback for non-Vite context (shouldn't happen in dev)
        const { pathToFileURL } = await import('url')
        const fileUrl = pathToFileURL(handlerPath).href
        const mod = await import(/* @vite-ignore */ fileUrl + `?t=${Date.now()}`)
        await mod.default(vercelReq, vercelRes)
      }
    } catch (err) {
      console.error('[api-dev]', err)
      statusCode = 500
      body = JSON.stringify({ error: 'Internal server error' })
    }

    for (const [k, v] of Object.entries(headers)) res.setHeader(k, v)
    res.statusCode = statusCode
    res.end(body)
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Add API middleware in dev only
    ...(process.env.NODE_ENV !== 'production' ? [{
      name: 'api-dev-middleware',
      configureServer(server: any) {
        // Inject Vite server into request for ssrLoadModule access
        server.middlewares.use((req: any, _res: any, next: any) => {
          (req as any).__viteServer = server
          next()
        })
        server.middlewares.use(apiMiddleware())
      },
    }] : []),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    include: ['src/**/*.test.{ts,tsx}', 'api/**/*.test.ts'],
    css: true,
  },
  server: {
    middlewareMode: false,
  },
})
