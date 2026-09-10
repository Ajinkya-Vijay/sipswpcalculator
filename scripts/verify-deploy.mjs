/**
 * Post-deploy smoke check against a live origin.
 *
 * Exists because `vite preview` does not read staticwebapp.config.json, so a
 * hosting-config mistake is invisible locally and only shows up in production.
 * A `trailingSlash: "always"` setting once 301'd every /assets/*.js request to
 * a path with a trailing slash; the browser then resolved the bundle's relative
 * imports against it as a directory, 404'd, and React never mounted — while
 * every local check passed.
 *
 * Usage: npm run verify:deploy [origin]
 *
 * Assets must return 200 with no redirect. A redirect on a JS module is the
 * specific failure this guards against, so it is treated as an error even
 * though the file is still reachable through it.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { SITE, PAGES } from './site-data.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DIST = join(ROOT, 'dist')
const origin = (process.argv[2] || SITE.origin).replace(/\/$/, '')

const htmlFiles = []
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p)
    else if (name.endsWith('.html')) htmlFiles.push(p)
  }
}

try {
  walk(DIST)
} catch {
  console.error('No dist/ found. Run `npm run build` first.')
  process.exit(1)
}

// Every hashed asset the built pages actually reference.
const assets = new Set()
for (const file of htmlFiles) {
  const html = readFileSync(file, 'utf8')
  for (const m of html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)) assets.add(m[1])
}

const pageUrls = PAGES.map((p) => p.path)
const extras = ['/robots.txt', '/sitemap.xml', '/ads.txt', '/favicon.svg', '/site.webmanifest', '/og-image.png']

let failures = 0

const check = async (path, { noRedirect = false, expect = 200 } = {}) => {
  const url = origin + path
  let res
  try {
    res = await fetch(url, { redirect: 'manual' })
  } catch (error) {
    console.log(`  FAIL ${path}  network error: ${error.message}`)
    failures++
    return
  }
  const location = res.headers.get('location')
  const type = (res.headers.get('content-type') || '').split(';')[0]

  if (noRedirect && res.status >= 300 && res.status < 400) {
    console.log(`  FAIL ${path}  ${res.status} -> ${location}`)
    console.log('       An asset must be served directly; a redirect here breaks module imports.')
    failures++
    return
  }
  if (res.status !== expect) {
    console.log(`  FAIL ${path}  expected ${expect}, got ${res.status}${location ? ' -> ' + location : ''}`)
    failures++
    return
  }
  console.log(`  ok   ${path}  ${res.status} ${type}`)
}

console.log(`Verifying ${origin}\n`)

console.log(`Assets referenced by built pages (${assets.size}) — must be 200, no redirect:`)
for (const path of [...assets].sort()) await check(path, { noRedirect: true })

console.log(`\nPages (${pageUrls.length}):`)
for (const path of pageUrls) await check(path)

console.log(`\nCrawler and icon files:`)
for (const path of extras) await check(path)

console.log(`\nCalculator mount points:`)
for (const entry of PAGES.filter((p) => p.app)) {
  const html = await fetch(origin + entry.path).then((r) => r.text())
  const hasRoot = /<div id="root"[^>]*>/.test(html)
  const hasModule = /<script type="module"[^>]*src="\/assets\//.test(html)
  if (hasRoot && hasModule) {
    console.log(`  ok   ${entry.path}  #root + module script present`)
  } else {
    console.log(`  FAIL ${entry.path}  root=${hasRoot} moduleScript=${hasModule}`)
    failures++
  }
}

console.log(failures ? `\n${failures} FAILURE(S)` : '\nAll checks passed.')
process.exit(failures ? 1 : 0)
