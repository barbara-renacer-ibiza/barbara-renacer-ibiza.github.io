import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(root, 'dist/public');
const origin = 'https://barbara-renacer-ibiza.github.io';
const projectUrl = 'https://dybqvnthmfeatwfpysrv.supabase.co';

const source = await fs.readFile(path.join(root, 'client/src/pages/Home.tsx'), 'utf8');
const keyMatch = source.match(/const\s+supabasePublishableKey\s*=\s*["']([^"']+)["']/);
if (!keyMatch) throw new Error('Could not extract Supabase public key from client/src/pages/Home.tsx');
const key = keyMatch[1];
const headers = { apikey: key, Authorization: `Bearer ${key}` };

async function fetchRows(table, query) {
  const url = `${projectUrl}/rest/v1/${table}?${query}`;
  let response;
  try {
    response = await fetch(url, { headers });
  } catch (error) {
    throw new Error(`REST request failed for ${table}: ${error.message}`);
  }
  if (!response.ok) throw new Error(`REST request failed for ${table} (${response.status} ${response.statusText}): ${await response.text()}`);
  const rows = await response.json();
  if (!Array.isArray(rows)) throw new Error(`REST response for ${table} was not an array`);
  return rows;
}
const esc = (value) => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
const text = (value) => String(value ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const first = (row, ...keys) => keys.map((key) => row?.[key]).find((value) => value !== undefined && value !== null && String(value).trim() !== '') ?? '';
const slugify = (value) => String(value).normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const [products, articles, plants, artisans] = await Promise.all([
  fetchRows('products', 'select=*&isPublished=eq.1&order=createdAt.desc'),
  fetchRows('nutrition_articles', 'select=*&isPublished=eq.1&order=createdAt.desc'),
  fetchRows('plant_materials', 'select=*&isActive=eq.true&order=nameIt.asc'),
  fetchRows('artisan_submissions', 'select=id,slug,artisanName,productName,description,category,priceCents,currency,imageUrl,approvedAt&status=eq.approved&order=approvedAt.desc'),
]);
const shell = await fs.readFile(path.join(publicDir, 'index.html'), 'utf8');

function pageHtml({ route, title, description, type = 'website', image = `${origin}/images/renacer-collection.webp`, body }) {
  const canonical = `${origin}${route}`;
  const tags = [
    `<title>${esc(title)}</title>`, `<meta name="description" content="${esc(description)}">`,
    `<link rel="canonical" href="${esc(canonical)}">`,
    `<meta property="og:type" content="${esc(type)}">`, `<meta property="og:title" content="${esc(title)}">`,
    `<meta property="og:description" content="${esc(description)}">`, `<meta property="og:url" content="${esc(canonical)}">`,
    `<meta property="og:site_name" content="Renacer Ibiza · Rituales de cuidados">`, `<meta property="og:image" content="${esc(image || `${origin}/images/renacer-collection.webp`)}">`,
    `<meta name="twitter:card" content="summary_large_image">`, `<meta name="twitter:title" content="${esc(title)}">`,
    `<meta name="twitter:description" content="${esc(description)}">`, `<meta name="twitter:image" content="${esc(image || `${origin}/images/renacer-collection.webp`)}">`,
  ].join('\n    ');
  let html = shell.replace(/<title>[^<]*<\/title>/i, '').replace(/<meta\s+name="description"[^>]*>/i, '');
  html = html.replace('</head>', `    ${tags}\n  </head>`);
  const main = `<main><h1>${esc(title)}</h1>${body}</main>`;
  html = html.replace(/<div id="root"><\/div>/, `<div id="root">${main}</div>`);
  return html;
}

const routes = [];
async function writeRoute(route, metadata, includeInSitemap = true) {
  const clean = route.replace(/^\//, '');
  const destination = path.join(publicDir, clean, 'index.html');
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.writeFile(destination, pageHtml({ route, ...metadata }), 'utf8');
  if (includeInSitemap) routes.push(route);
}
const productName = (item) => text(first(item, 'nameIt', 'nameEn', 'nameEs', 'name')) || 'Renacer product';
const productDesc = (item) => text(first(item, 'descriptionIt', 'descriptionEn', 'descriptionEs', 'description')) || 'Handcrafted botanical care made with care in Ibiza.';
const productSlug = (item) => slugify(first(item, 'slug', 'nameIt', 'nameEn', 'nameEs', 'name')) || String(item.id);
const articleTitle = (item) => text(first(item, 'titleIt', 'titleEn', 'titleEs', 'title')) || 'Nutrition article';
const articleBody = (item) => text(first(item, 'bodyIt', 'bodyEn', 'bodyEs', 'body'));
const itemSlug = (item, fallback) => slugify(first(item, 'slug')) || fallback;

await writeRoute('/catalogue', { title: 'Catalogue · Renacer Ibiza · Rituales de cuidados', description: 'Explore Renacer handcrafted botanical skincare products, made with care in Ibiza.', body: `<p>Discover the Renacer collection: handcrafted skincare inspired by plants, thoughtful ingredients and a slower rhythm of life in Ibiza.</p>${products.length ? `<ul>${products.map((p) => `<li><a href="/catalogue/${encodeURIComponent(productSlug(p))}">${esc(productName(p))}</a> — ${esc(productDesc(p))}</li>`).join('')}</ul>` : '<p>The collection is being prepared. Contact Barbara for current availability.</p>'}` });
await writeRoute('/artisans', { title: 'Artisans · Renacer Ibiza · Rituales de cuidados', description: 'Meet the approved artisan makers connected with Renacer in Ibiza.', body: `<p>Discover artisan makers and their work, connected by care, craft and a thoughtful relationship with natural materials.</p>${artisans.length ? `<ul>${artisans.map((a, i) => { const slug = itemSlug(a, slugify(first(a, 'artisanName')) || String(a.id || i)); return `<li><a href="/artisans/${encodeURIComponent(slug)}">${esc(text(first(a, 'artisanName')) || 'Renacer artisan')}</a> — ${esc(text(first(a, 'description')) || 'An approved artisan maker in the Renacer community.')}: ${esc(text(first(a, 'productName')))}</li>`; }).join('')}</ul>` : '<p>Artisan profiles will appear here when approved for publication.</p>'}` });
await writeRoute('/nutrition', { title: 'Nutrition · Renacer Ibiza · Rituales de cuidados', description: 'Natural nutrition notes and articles from Renacer, connecting everyday nourishment with wellbeing.', body: `<p>Explore natural nutrition notes from Renacer: considered perspectives on everyday nourishment, wellbeing and caring for yourself from within.</p>${articles.length ? `<ul>${articles.map((a) => `<li><a href="/nutrition/${encodeURIComponent(itemSlug(a, String(a.id)))}">${esc(articleTitle(a))}</a> — ${esc(articleBody(a).slice(0, 240))}</li>`).join('')}</ul>` : '<p>Nutrition articles are being prepared and will be published here over time.</p>'}` });
await writeRoute('/plants', { title: 'Plants and ingredients · Renacer Ibiza · Rituales de cuidados', description: 'Learn about the active botanical materials and ingredients used in Renacer care.', body: `<p>Meet the plants and raw materials that inspire Renacer: botanical ingredients chosen with care for handmade skincare and everyday rituals.</p>${plants.length ? `<ul>${plants.map((p) => { const name = text(first(p, 'nameIt', 'nameEn', 'nameEs', 'name', 'botanicalName')) || 'Botanical material'; const slug = itemSlug(p, slugify(name)); return `<li><a href="/plants/${encodeURIComponent(slug)}">${esc(name)}</a> — ${esc(text(first(p, 'descriptionIt', 'descriptionEn', 'descriptionEs', 'description')) || 'A botanical material explored for its role in thoughtful, plant-inspired care.')}</li>`; }).join('')}</ul>` : '<p>Plant profiles will appear here as active materials are added.</p>'}` });
await writeRoute('/admin', { title: 'Gestione Renacer', description: 'Protected Renacer administration area.', body: '' }, false);
for (const section of ['products', 'categories', 'plants', 'articles', 'artisans', 'settings']) {
  await writeRoute(`/admin/${section}`, { title: 'Gestione Renacer', description: 'Protected Renacer administration area.', body: '' }, false);
}

for (const item of products) {
  const slug = productSlug(item), title = productName(item), description = productDesc(item), image = first(item, 'imageUrl', 'image_url');
  await writeRoute(`/catalogue/${slug}`, { title: `${title} · Renacer Ibiza · Rituales de cuidados`, description, type: 'product', image, body: `<article>${image ? `<img src="${esc(image)}" alt="${esc(title)}">` : ''}<p>${esc(description)}</p>${text(first(item, 'INCI')) ? `<p><strong>Ingredients:</strong> ${esc(text(first(item, 'INCI')))}</p>` : ''}</article>` });
}
for (const item of articles) {
  const slug = itemSlug(item, String(item.id)), title = articleTitle(item), description = articleBody(item).slice(0, 300) || 'Natural nutrition notes from Renacer Ibiza · Rituales de cuidados.';
  await writeRoute(`/nutrition/${slug}`, { title: `${title} · Renacer Ibiza · Rituales de cuidados`, description, type: 'article', image: first(item, 'imageUrl', 'image_url'), body: `<article>${first(item, 'imageUrl', 'image_url') ? `<img src="${esc(first(item, 'imageUrl', 'image_url'))}" alt="${esc(title)}">` : ''}<p>${esc(articleBody(item) || description)}</p></article>` });
}
for (const item of plants) {
  const name = text(first(item, 'nameIt', 'nameEn', 'nameEs', 'name', 'botanicalName')) || 'Botanical material';
  const slug = itemSlug(item, slugify(name)), description = text(first(item, 'descriptionIt', 'descriptionEn', 'descriptionEs', 'description')) || `Explore ${name}, a plant-inspired material in the Renacer botanical collection.`;
  await writeRoute(`/plants/${slug}`, { title: `${name} · Plants · Renacer Ibiza · Rituales de cuidados`, description, image: first(item, 'imageUrl', 'image_url'), body: `<article>${first(item, 'imageUrl', 'image_url') ? `<img src="${esc(first(item, 'imageUrl', 'image_url'))}" alt="${esc(name)}">` : ''}<p>${esc(description)}</p>${text(first(item, 'botanicalName')) ? `<p><strong>Botanical name:</strong> ${esc(text(first(item, 'botanicalName')))}</p>` : ''}${text(first(item, 'safetyIt', 'safetyEn', 'safetyEs')) ? `<p>${esc(text(first(item, 'safetyIt', 'safetyEn', 'safetyEs')))}</p>` : ''}</article>` });
}
for (const [index, item] of artisans.entries()) {
  const name = text(first(item, 'artisanName')) || 'Renacer artisan';
  const slug = itemSlug(item, slugify(name) || String(item.id || index)), description = text(first(item, 'description', 'descriptionIt', 'bio')) || `${name} is an approved artisan maker connected with Renacer in Ibiza.`;
  await writeRoute(`/artisans/${slug}`, { title: `${name} · Artisans · Renacer Ibiza · Rituales de cuidados`, description, image: first(item, 'imageUrl', 'image_url', 'image'), body: `<article>${first(item, 'imageUrl', 'image_url', 'image') ? `<img src="${esc(first(item, 'imageUrl', 'image_url', 'image'))}" alt="${esc(name)}">` : ''}<p>${esc(description)}</p><h2>${esc(text(first(item, 'productName')) || 'Artisan work')}</h2>${text(first(item, 'category')) ? `<p><strong>Category:</strong> ${esc(text(first(item, 'category')))}</p>` : ''}${text(first(item, 'priceCents')) ? `<p>${esc((Number(first(item, 'priceCents')) / 100).toFixed(2))} ${esc(first(item, 'currency') || 'EUR')}</p>` : ''}</article>` });
}

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...new Set(routes)].map((route) => `  <url><loc>${origin}${route.split('/').map((part) => encodeURIComponent(decodeURIComponent(part))).join('/')}</loc></url>`).join('\n')}\n</urlset>\n`;
await fs.writeFile(path.join(publicDir, 'sitemap.xml'), sitemap, 'utf8');
console.log(`Pre-rendered ${routes.length} public routes to ${publicDir}`);
