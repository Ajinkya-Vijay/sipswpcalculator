/**
 * Generates one real HTML file per URL, each carrying its own <head>, its own
 * copy, and its own JSON-LD, before Vite runs. The point is that a crawler gets
 * the full page from the first byte of the response instead of an empty <div>
 * waiting on a JavaScript bundle.
 *
 * Run by `npm run build` and `npm run dev`; the files it writes are gitignored.
 */
import { mkdir, writeFile, rm, readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PAGES, NOT_FOUND, NAV, SITE } from './site-data.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const ADSENSE_CLIENT = 'ca-pub-2077951614010210'
const BUILD_DATE = new Date().toISOString().slice(0, 10)

const abs = (path) => (path === '/' ? `${SITE.origin}/` : `${SITE.origin}${path}`)

// Strips tags and entities so copy written for HTML can be reused inside JSON-LD.
const plain = (html) =>
  html
    .replace(/<[^>]+>/g, '')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&minus;/g, '−')
    .replace(/&times;/g, '×')
    .replace(/&divide;/g, '÷')
    .replace(/&rarr;/g, '→')
    .replace(/&rsquo;/g, '’')
    .replace(/&lsquo;/g, '‘')
    .replace(/&ldquo;/g, '“')
    .replace(/&rdquo;/g, '”')
    .replace(/&#8377;/g, '₹')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()

const escapeAttr = (value) =>
  String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/* --------------------------------------------------------------- schema ---- */

const organization = {
  '@type': 'Organization',
  '@id': `${SITE.origin}/#organization`,
  name: SITE.name,
  url: `${SITE.origin}/`,
  logo: { '@type': 'ImageObject', url: `${SITE.origin}/icon-512.png`, width: 512, height: 512 },
}

const website = {
  '@type': 'WebSite',
  '@id': `${SITE.origin}/#website`,
  url: `${SITE.origin}/`,
  name: SITE.name,
  inLanguage: SITE.lang,
  publisher: { '@id': `${SITE.origin}/#organization` },
}

const softwareApplication = (page) => ({
  '@type': ['WebApplication', 'FinancialProduct'],
  '@id': `${abs(page.path)}#calculator`,
  name: plain(page.h1),
  url: abs(page.path),
  applicationCategory: 'FinanceApplication',
  applicationSubCategory: 'Investment Calculator',
  operatingSystem: 'Any modern web browser',
  browserRequirements: 'Requires JavaScript',
  description: page.description,
  inLanguage: SITE.lang,
  isAccessibleForFree: true,
  provider: { '@id': `${SITE.origin}/#organization` },
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
  featureList: [
    'SIP return calculator',
    'Lumpsum investment calculator',
    'Systematic Withdrawal Plan calculator',
    'Automatic transfer of the SIP total value into the SWP total investment field',
  ],
})

const breadcrumbs = (page) => {
  const items = [{ name: 'Home', item: `${SITE.origin}/` }]
  if (page.path !== '/') items.push({ name: plain(page.h1), item: abs(page.path) })
  return {
    '@type': 'BreadcrumbList',
    '@id': `${abs(page.path)}#breadcrumb`,
    itemListElement: items.map((entry, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: entry.name,
      item: entry.item,
    })),
  }
}

const faqSchema = (page) => ({
  '@type': 'FAQPage',
  '@id': `${abs(page.path)}#faq`,
  mainEntity: page.faq.map(([question, answer]) => ({
    '@type': 'Question',
    name: question,
    acceptedAnswer: { '@type': 'Answer', text: answer },
  })),
})

const articleSchema = (page) => ({
  '@type': 'Article',
  '@id': `${abs(page.path)}#article`,
  headline: plain(page.h1),
  description: page.description,
  inLanguage: SITE.lang,
  datePublished: page.datePublished,
  dateModified: BUILD_DATE,
  author: { '@id': `${SITE.origin}/#organization` },
  publisher: { '@id': `${SITE.origin}/#organization` },
  mainEntityOfPage: { '@id': `${abs(page.path)}#webpage` },
})

const buildSchema = (page) => {
  const graph = [
    organization,
    website,
    {
      '@type': 'WebPage',
      '@id': `${abs(page.path)}#webpage`,
      url: abs(page.path),
      name: page.title,
      description: page.description,
      inLanguage: SITE.lang,
      isPartOf: { '@id': `${SITE.origin}/#website` },
      breadcrumb: { '@id': `${abs(page.path)}#breadcrumb` },
      datePublished: page.datePublished ?? undefined,
      dateModified: BUILD_DATE,
    },
    breadcrumbs(page),
  ]
  if (page.schema === 'app') graph.push(softwareApplication(page))
  if (page.schema === 'article') graph.push(articleSchema(page))
  if (page.faq.length) graph.push(faqSchema(page))
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph })
}

/* --------------------------------------------------------------- markup ---- */

const nav = (page) =>
  NAV.map((item) => {
    const current = item.href === page.path
    return `<a href="${item.href}"${current ? ' aria-current="page"' : ''}>${item.label}</a>`
  }).join('')

const breadcrumbMarkup = (page) =>
  page.path === '/'
    ? ''
    : `<nav class="crumbs" aria-label="Breadcrumb"><ol>
      <li><a href="/">Home</a></li>
      <li aria-current="page">${page.h1}</li>
    </ol></nav>`

const faqMarkup = (page) =>
  page.faq.length
    ? `<section class="faq" aria-labelledby="faq-heading">
      <h2 id="faq-heading">Frequently asked questions</h2>
      ${page.faq
        .map(
          ([question, answer]) => `<details>
        <summary><h3>${question}</h3></summary>
        <p>${answer}</p>
      </details>`,
        )
        .join('\n      ')}
    </section>`
    : ''

const related = (page) => {
  const links = PAGES.filter((candidate) => candidate.path !== page.path && Number(candidate.priority ?? 0) >= 0.7)
  if (!links.length) return ''
  return `<section class="related" aria-labelledby="related-heading">
      <h2 id="related-heading">More calculators and guides</h2>
      <ul class="related-grid">
        ${links
          .map(
            (link) => `<li><a href="${link.path}"><span class="related-title">${link.h1}</span>
          <span class="related-desc">${link.description.split('.')[0]}.</span></a></li>`,
          )
          .join('\n        ')}
      </ul>
    </section>`
}

const appMarkup = (page) =>
  page.app
    ? `<div id="root" data-view="${page.app.view}" data-mode="${page.app.mode}">
      <noscript>
        <p class="noscript-note">This calculator needs JavaScript to run. The formulas, worked examples and
        reference tables below work without it.</p>
      </noscript>
    </div>`
    : ''

const page = (data) => {
  const canonical = abs(data.path)
  const robots = data.noindex
    ? 'noindex, follow'
    : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
  const entry = data.app ? '/src/main.jsx' : '/src/site.js'

  return `<!doctype html>
<html lang="${SITE.lang}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeAttr(data.title)}</title>
    <meta name="description" content="${escapeAttr(data.description)}" />
    <meta name="robots" content="${robots}" />
${data.noindex ? '' : `    <link rel="canonical" href="${canonical}" />
    <link rel="alternate" hreflang="en-in" href="${canonical}" />
    <link rel="alternate" hreflang="x-default" href="${canonical}" />`}

    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <link rel="apple-touch-icon" href="/icon-192.png" />
    <link rel="manifest" href="/site.webmanifest" />
    <meta name="theme-color" content="#eef7ff" />

    <meta property="og:type" content="${data.schema === 'article' ? 'article' : 'website'}" />
    <meta property="og:locale" content="${SITE.locale}" />
    <meta property="og:site_name" content="${SITE.name}" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:title" content="${escapeAttr(data.title)}" />
    <meta property="og:description" content="${escapeAttr(data.description)}" />
    <meta property="og:image" content="${SITE.origin}/og-image.png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${escapeAttr(plain(data.h1))}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeAttr(data.title)}" />
    <meta name="twitter:description" content="${escapeAttr(data.description)}" />
    <meta name="twitter:image" content="${SITE.origin}/og-image.png" />

    <link rel="preconnect" href="https://pagead2.googlesyndication.com" crossorigin />
    <script type="application/ld+json">${buildSchema(data)}</script>
  </head>
  <body>
    <a class="skip-link" href="#main">Skip to calculator</a>

    <header class="site-header">
      <div class="site-header-inner">
        <a class="brand" href="/">
          <span class="brand-mark" aria-hidden="true">₹</span>
          <span class="brand-text">SIP<span>SWP</span>Calculator</span>
        </a>
        <nav class="site-nav" aria-label="Calculators">${nav(data)}</nav>
      </div>
    </header>

    <main id="main" class="app-shell">
      ${breadcrumbMarkup(data)}
      <div class="page-intro">
        <p class="eyebrow">${data.eyebrow}</p>
        <h1>${data.h1}</h1>
        <p class="intro-copy">${data.intro}</p>
      </div>

      ${appMarkup(data)}

      <article class="seo-content">
        ${data.body}
      </article>

      ${faqMarkup(data)}
      ${related(data)}
    </main>

    <footer class="site-footer">
      <div class="footer-inner">
        <nav aria-label="Footer">
          <a href="/">SIP + SWP Calculator</a>
          <a href="/sip-calculator/">SIP Calculator</a>
          <a href="/swp-calculator/">SWP Calculator</a>
          <a href="/lumpsum-calculator/">Lumpsum Calculator</a>
          <a href="/sip-vs-swp/">SIP vs SWP</a>
          <a href="/swp-from-1-crore/">Income From ₹1 Crore</a>
          <a href="/about/">About</a>
          <a href="/privacy/">Privacy</a>
        </nav>
        <p class="footer-note">
          Educational estimates only. Mutual fund investments are subject to market risk; read all scheme related
          documents carefully. Nothing here is investment advice.
        </p>
        <p class="footer-note">&copy; ${new Date().getFullYear()} ${SITE.name}</p>
      </div>
    </footer>

    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}" crossorigin="anonymous"></script>
    <script type="module" src="${entry}"></script>
  </body>
</html>
`
}

/* ---------------------------------------------------------------- write ---- */

const sitemap = () => {
  const urls = PAGES.map(
    (entry) => `  <url>
    <loc>${abs(entry.path)}</loc>
    <lastmod>${BUILD_DATE}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${entry.priority ?? '0.5'}</priority>
  </url>`,
  ).join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`
}

const robots = () => `User-agent: *
Allow: /

# Ad crawlers need access to render the pages they serve against.
User-agent: Mediapartners-Google
Allow: /

User-agent: AdsBot-Google
Allow: /

Sitemap: ${SITE.origin}/sitemap.xml
`

/**
 * Authorised Digital Sellers. Declares that Google is allowed to sell this
 * domain's inventory, which is what stops "unauthorised inventory" warnings
 * and lets buyers verify the seller is legitimate.
 *
 * Field order is fixed by the IAB spec:
 *   <ad system domain>, <publisher id>, <DIRECT|RESELLER>, <certification id>
 *
 * f08c47fec0942fa0 is Google's own TAG certification id and is the same for
 * every AdSense publisher — it identifies Google, not this account.
 */
const adsTxt = () => `# Authorised Digital Sellers for ${new URL(SITE.origin).hostname}
# Spec: https://iabtechlab.com/ads-txt/
google.com, ${ADSENSE_CLIENT.replace(/^ca-/, '')}, DIRECT, f08c47fec0942fa0
`

const manifest = () =>
  JSON.stringify(
    {
      name: 'SIP & SWP Calculator',
      short_name: 'SIP SWP',
      description: 'Combined SIP, lumpsum and SWP calculator for Indian mutual fund investors.',
      start_url: '/',
      display: 'standalone',
      background_color: '#eef7ff',
      theme_color: '#eef7ff',
      lang: SITE.lang,
      icons: [
        { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      ],
    },
    null,
    2,
  )

const write = async (relativePath, contents) => {
  const target = join(ROOT, relativePath)
  await mkdir(dirname(target), { recursive: true })
  await writeFile(target, contents, 'utf8')
}

// Azure applies trailingSlash to every path, asset files included. Setting it
// to "always" 301s /assets/x.js to /assets/x.js/, after which the bundle's
// relative imports resolve against that as a directory and 404. There is no
// per-path exclusion, so the setting simply must not be "always".
const checkHostingConfig = async () => {
  const configPath = join(ROOT, 'public/staticwebapp.config.json')
  const config = JSON.parse(await readFile(configPath, 'utf8'))
  if (config.trailingSlash === 'always') {
    throw new Error(
      'staticwebapp.config.json sets trailingSlash:"always", which redirects /assets/*.js ' +
        'and breaks module imports in production. Remove it; canonical tags already make the ' +
        'trailing-slash page URLs authoritative.',
    )
  }
}

const run = async () => {
  await checkHostingConfig()

  // Clear generated route directories so a renamed page cannot linger.
  for (const entry of PAGES) {
    if (entry.file.includes('/')) await rm(join(ROOT, dirname(entry.file)), { recursive: true, force: true })
  }

  for (const entry of [...PAGES, NOT_FOUND]) {
    await write(entry.file, page(entry))
  }

  await write('public/sitemap.xml', sitemap())
  await write('public/robots.txt', robots())
  await write('public/ads.txt', adsTxt())
  await write('public/site.webmanifest', manifest())

  console.log(`Generated ${PAGES.length + 1} pages, sitemap, robots.txt, ads.txt and web manifest.`)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
