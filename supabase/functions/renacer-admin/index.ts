import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const cors = {
  "Access-Control-Allow-Origin": "https://barbara-renacer-ibiza.github.io",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-renacer-token",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
};
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { ...cors, "Content-Type": "application/json" } });
const enc = new TextEncoder();
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const PIN_ITERATIONS = 210_000;
const base = () => Deno.env.get("SUPABASE_URL") || "";
const serviceKey = () => Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const serviceHeaders = () => ({ apikey: serviceKey(), Authorization: `Bearer ${serviceKey()}` });

async function sig(value: string) {
  const key = await crypto.subtle.importKey("raw", enc.encode(Deno.env.get("ADMIN_PIN") || ""), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const bytes = await crypto.subtle.sign("HMAC", key, enc.encode(value));
  return [...new Uint8Array(bytes)].map((value) => value.toString(16).padStart(2, "0")).join("");
}

function constantTimeEqual(left: string, right: string) {
  const a = enc.encode(left);
  const b = enc.encode(right);
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a[i] ^ b[i];
  return mismatch === 0;
}

function toBase64(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes));
}

function fromBase64(value: string) {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
}

async function hashPin(pin: string, salt: string) {
  const key = await crypto.subtle.importKey("raw", enc.encode(pin), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: fromBase64(salt), iterations: PIN_ITERATIONS, hash: "SHA-256" }, key, 256);
  return toBase64(new Uint8Array(bits));
}

async function db(path: string, init: RequestInit = {}) {
  const response = await fetch(`${base()}/rest/v1/${path}`, {
    ...init,
    headers: { ...serviceHeaders(), "Content-Type": "application/json", ...(init.headers || {}) },
  });
  const text = await response.text();
  let data: unknown = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  return { ok: response.ok, status: response.status, data };
}

async function getSecurityRecord() {
  const result = await db("admin_security?select=id,pin_salt,pin_hash,pin_changed_at&id=eq.1&limit=1");
  if (!result.ok) throw new Error("Impostazioni di sicurezza non disponibili.");
  return Array.isArray(result.data) ? result.data[0] ?? null : null;
}

async function pinMatches(candidate: string) {
  const record = await getSecurityRecord();
  if (record) return constantTimeEqual(await hashPin(candidate, String(record.pin_salt)), String(record.pin_hash));
  const fallbackPin = Deno.env.get("ADMIN_PIN") || "";
  return Boolean(fallbackPin) && constantTimeEqual(candidate, fallbackPin);
}

async function tokenOk(token: string | null) {
  if (!token) return false;
  const [exp, mac] = token.split(".");
  const expiration = Number(exp);
  if (!exp || !mac || !Number.isFinite(expiration) || expiration < Date.now()) return false;
  if (!constantTimeEqual(mac, await sig(exp))) return false;
  const record = await getSecurityRecord();
  if (record) {
    const issuedAt = expiration - SESSION_TTL_MS;
    const rotatedAt = Date.parse(String(record.pin_changed_at));
    if (Number.isFinite(rotatedAt) && issuedAt < rotatedAt) return false;
  }
  return true;
}

function cleanSlug(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "categoria";
}

function errorMessage(value: unknown) {
  if (value && typeof value === "object" && "message" in value) return String((value as { message: unknown }).message);
  return String(value || "Operazione non riuscita.");
}

function writeResult(result: { ok: boolean; status: number; data: unknown }) {
  if (!result.ok) return json({ error: errorMessage(result.data) }, result.status);
  if (Array.isArray(result.data) && result.data.length === 0) return json({ error: "Nessun contenuto trovato da aggiornare." }, 404);
  return json(result.data);
}

async function translateText(name: string, description: string, safety = "") {
  const translate = async (text: string, lang: "en" | "es") => {
    if (!text.trim()) return "";
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=it|${lang}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Servizio di traduzione non disponibile.");
    const result = await response.json();
    const translated = result?.responseData?.translatedText;
    if (typeof translated !== "string" || !translated.trim()) throw new Error("Traduzione incompleta.");
    return translated;
  };
  const [enName, enDescription, esName, esDescription, enSafety, esSafety] = await Promise.all([
    translate(name, "en"), translate(description, "en"), translate(name, "es"), translate(description, "es"),
    translate(safety, "en"), translate(safety, "es"),
  ]);
  return { it: { name, description, safety }, en: { name: enName, description: enDescription, safety: enSafety }, es: { name: esName, description: esDescription, safety: esSafety } };
}

async function resolveCategorySlug(product: Record<string, unknown>) {
  const provided = String(product.categorySlug || "").trim();
  if (provided) return provided;
  const legacy = String(product.category || "").trim();
  if (!legacy) return "altro";
  const result = await db("categories?select=slug,nameIt,nameEn,nameEs&limit=200");
  if (!result.ok || !Array.isArray(result.data)) throw new Error("Impossibile verificare la categoria selezionata.");
  const normalized = cleanSlug(legacy);
  const match = result.data.find((category: Record<string, unknown>) =>
    [category.slug, category.nameIt, category.nameEn, category.nameEs].some((label) => typeof label === "string" && cleanSlug(label) === normalized),
  );
  return String(match?.slug || "altro");
}

async function syncProductPlantMaterials(productId: number, rawSlugs: unknown) {
  if (!Array.isArray(rawSlugs) || rawSlugs.length > 100) return { ok: false, status: 400, data: { message: "Elenco materie prime non valido." } };
  const slugs = [...new Set(rawSlugs.map((value) => String(value)).filter((value) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)))];
  if (slugs.length !== rawSlugs.length) return { ok: false, status: 400, data: { message: "Una o più materie prime selezionate non sono valide." } };
  if (slugs.length) {
    const available = await db(`plant_materials?select=slug&slug=in.(${slugs.join(",")})&limit=100`);
    if (!available.ok) return available;
    if (!Array.isArray(available.data) || available.data.length !== slugs.length) return { ok: false, status: 400, data: { message: "Una o più materie prime non esistono più." } };
  }
  if (slugs.length) {
    const added = await db("product_plant_materials?on_conflict=productId,plantSlug", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify(slugs.map((plantSlug) => ({ productId, plantSlug }))),
    });
    if (!added.ok) return added;
  }
  const relationPath = slugs.length
    ? `product_plant_materials?productId=eq.${productId}&plantSlug=not.in.(${slugs.join(",")})`
    : `product_plant_materials?productId=eq.${productId}`;
  return await db(relationPath, { method: "DELETE", headers: { Prefer: "return=minimal" } });
}

const imageTypes: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

function detectImageType(bytes: Uint8Array): string | null {
  const text = (start: number, end: number) => String.fromCharCode(...bytes.slice(start, end));
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (text(0, 8) === "\x89PNG\r\n\x1a\n") return "image/png";
  if (text(0, 6) === "GIF87a" || text(0, 6) === "GIF89a") return "image/gif";
  if (text(0, 4) === "RIFF" && text(8, 12) === "WEBP") return "image/webp";
  if (bytes.length >= 12 && text(4, 8) === "ftyp" && ["avif", "avis"].includes(text(8, 12))) return "image/avif";
  return null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const contentType = req.headers.get("content-type") || "";
    const isMultipart = contentType.toLowerCase().includes("multipart/form-data");
    const form = isMultipart ? await req.formData() : null;
    const body = form ? Object.fromEntries([...form.entries()].filter(([key]) => key !== "file")) : await req.json().catch(() => ({}));
    const action = String(body.action || "");
    const configuredPin = Deno.env.get("ADMIN_PIN");
    if (!configuredPin) return json({ error: "Configurazione amministratore non disponibile." }, 503);

    if (action === "login") {
      const candidate = String(body.pin || "").trim();
      if (!(await pinMatches(candidate))) return json({ error: "PIN non valido." }, 401);
      const exp = Date.now() + SESSION_TTL_MS;
      return json({ token: `${exp}.${await sig(String(exp))}` });
    }
    if (!(await tokenOk(req.headers.get("x-renacer-token")))) return json({ error: "Sessione scaduta. Accedi di nuovo." }, 401);

    if (action === "list") {
      const [products, articles, categories, plantMaterials, productPlantMaterials] = await Promise.all([
        db("products?select=*&order=createdAt.desc&limit=500"),
        db("nutrition_articles?select=*&order=createdAt.desc&limit=500"),
        db("categories?select=*&order=nameIt.asc&limit=500"),
        db("plant_materials?select=*&order=nameIt.asc&limit=1000"),
        db("product_plant_materials?select=productId,plantSlug&limit=5000"),
      ]);
      for (const result of [products, articles, categories, plantMaterials, productPlantMaterials]) {
        if (!result.ok) return json({ error: `Errore nel caricamento dei contenuti: ${errorMessage(result.data)}` }, result.status);
      }
      const slugsByProduct = new Map<number, string[]>();
      if (Array.isArray(productPlantMaterials.data)) {
        for (const relation of productPlantMaterials.data as Array<{ productId: number; plantSlug: string }>) {
          slugsByProduct.set(relation.productId, [...(slugsByProduct.get(relation.productId) || []), relation.plantSlug]);
        }
      }
      const productRows = Array.isArray(products.data) ? products.data.map((item: Record<string, unknown>) => ({ ...item, plantSlugs: slugsByProduct.get(Number(item.id)) || [] })) : products.data;
      return json({ products: productRows, articles: articles.data, categories: categories.data, plantMaterials: plantMaterials.data });
    }

    if (action === "change_pin") {
      const currentPin = String(body.currentPin || "").trim();
      const newPin = String(body.newPin || "").trim();
      if (!/^\d{6,12}$/.test(newPin)) return json({ error: "Il nuovo PIN deve contenere da 6 a 12 cifre." }, 400);
      if (!constantTimeEqual(currentPin, newPin) && !(await pinMatches(currentPin))) return json({ error: "Il PIN attuale non è corretto." }, 401);
      if (constantTimeEqual(currentPin, newPin)) return json({ error: "Il nuovo PIN deve essere diverso da quello attuale." }, 400);
      const salt = toBase64(crypto.getRandomValues(new Uint8Array(16)));
      const pinHash = await hashPin(newPin, salt);
      const result = await db("admin_security?on_conflict=id", {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify({ id: 1, pin_salt: salt, pin_hash: pinHash, pin_changed_at: new Date().toISOString() }),
      });
      if (!result.ok) return json({ error: errorMessage(result.data) }, result.status);
      return json({ ok: true });
    }

    if (action === "translate") {
      if (String(body.sourceLanguage || "it") !== "it") return json({ error: "La lingua di origine deve essere l'italiano." }, 400);
      try { return json(await translateText(String(body.name || ""), String(body.description || ""), String(body.safety || ""))); }
      catch (error) { return json({ error: errorMessage(error) }, 502); }
    }

    if (action === "upload_image") {
      if (!form) return json({ error: "Caricamento immagine non valido." }, 400);
      const file = form.get("file");
      const entity = String(form.get("entity") || "");
      if (!(file instanceof File) || !["product", "article", "plant"].includes(entity)) return json({ error: "File immagine o destinazione non validi." }, 400);
      if (!Object.hasOwn(imageTypes, file.type)) return json({ error: "Formato non supportato. Usa JPG, PNG, WebP, GIF o AVIF." }, 415);
      if (file.size <= 0 || file.size > 10 * 1024 * 1024) return json({ error: "L'immagine deve avere una dimensione massima di 10 MB." }, 413);
      const signature = new Uint8Array(await file.slice(0, 32).arrayBuffer());
      if (detectImageType(signature) !== file.type) return json({ error: "Il contenuto del file non corrisponde a un'immagine valida del formato dichiarato." }, 415);
      const path = `${entity}/${Date.now()}-${crypto.randomUUID()}.${imageTypes[file.type]}`;
      const upload = await fetch(`${base()}/storage/v1/object/renacer-media/${path}`, {
        method: "POST",
        headers: { ...serviceHeaders(), "Content-Type": file.type, "x-upsert": "false" },
        body: await file.arrayBuffer(),
      });
      if (!upload.ok) {
        const detail = await upload.text();
        return json({ error: `Caricamento non riuscito: ${detail || upload.statusText}` }, upload.status);
      }
      return json({ url: `${base()}/storage/v1/object/public/renacer-media/${path}` });
    }

    if (action === "create" || action === "update") {
      const p = body.product || {};
      const categorySlug = await resolveCategorySlug(p);
      const inci = p.INCI == null ? null : String(p.INCI).trim();
      if (inci && inci.length > 20000) return json({ error: "Il testo INCI supera la lunghezza massima consentita." }, 400);
      const data = {
        sourceLanguage: "it", nameIt: p.nameIt, descriptionIt: p.descriptionIt,
        nameEn: p.nameEn, descriptionEn: p.descriptionEn, nameEs: p.nameEs, descriptionEs: p.descriptionEs,
        priceCents: p.priceCents, currency: p.currency || "EUR", imageUrl: p.imageUrl || null,
        whatsappMessage: p.whatsappMessage || null, INCI: inci || null, category: p.categoryName || p.category || categorySlug,
        categorySlug, isPublished: p.isPublished ?? 1,
      };
      const result = action === "create"
        ? await db("products", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify({ ...data, slug: `${cleanSlug(String(p.nameIt || "product"))}-${Date.now()}` }) })
        : await db(`products?id=eq.${encodeURIComponent(String(body.id))}`, { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify(data) });
      if (!result.ok) return writeResult(result);
      const savedRow = Array.isArray(result.data) ? result.data[0] : null;
      if (!savedRow) return writeResult(result);
      if (p.plantSlugs !== undefined) {
        const links = await syncProductPlantMaterials(Number(savedRow.id), p.plantSlugs);
        if (!links.ok) return json({ error: `Il prodotto è stato salvato, ma i collegamenti alle materie prime non sono stati aggiornati: ${errorMessage(links.data)}` }, links.status);
      }
      return json(savedRow);
    }

    if (action === "material_create") {
      const m = body.material || {};
      const fields = ["nameIt", "nameEn", "nameEs", "descriptionIt", "descriptionEn", "descriptionEs"] as const;
      const data: Record<string, unknown> = {};
      for (const field of fields) {
        const value = String(m[field] || "").trim();
        if (!value || value.length > (field.startsWith("description") ? 8000 : 180)) return json({ error: "Completa i nomi e le descrizioni in italiano, inglese e spagnolo (entro la lunghezza consentita)." }, 400);
        data[field] = value;
      }
      const botanicalName = String(m.botanicalName || "").trim();
      if (botanicalName.length > 180) return json({ error: "Il nome botanico è troppo lungo." }, 400);
      const imageUrl = String(m.imageUrl || "").trim();
      if (imageUrl && (!imageUrl.startsWith(`${base()}/storage/v1/object/public/renacer-media/plant/`) || imageUrl.length > 2048)) return json({ error: "Carica un'immagine della materia prima tramite il modulo immagini." }, 400);
      const sourceUrl = String(m.sourceUrl || "").trim();
      if (sourceUrl && (!/^https:\/\//i.test(sourceUrl) || sourceUrl.length > 2048)) return json({ error: "Il link della fonte deve essere HTTPS e non superare 2048 caratteri." }, 400);
      for (const field of ["safetyIt", "safetyEn", "safetyEs"] as const) {
        const value = String(m[field] || "").trim();
        if (value.length > 2000) return json({ error: "Una nota di cautela è troppo lunga." }, 400);
        data[field] = value || null;
      }
      data.botanicalName = botanicalName || null;
      data.imageUrl = imageUrl || null;
      data.sourceUrl = sourceUrl || null;
      data.isActive = true;
      const slug = `${cleanSlug(String(m.nameIt))}-${Date.now().toString(36)}`;
      return writeResult(await db("plant_materials", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify({ slug, ...data }) }));
    }

    if (action === "material_update") {
      const m = body.material || {};
      const data: Record<string, unknown> = {};
      for (const field of ["nameIt", "nameEn", "nameEs", "descriptionIt", "descriptionEn", "descriptionEs"] as const) {
        if (m[field] === undefined) continue;
        const value = String(m[field]).trim();
        if (!value || value.length > (field.startsWith("description") ? 8000 : 180)) return json({ error: "I nomi e le descrizioni devono essere compilati e rispettare la lunghezza consentita." }, 400);
        data[field] = value;
      }
      if (m.botanicalName !== undefined) {
        const value = String(m.botanicalName || "").trim();
        if (value.length > 180) return json({ error: "Il nome botanico è troppo lungo." }, 400);
        data.botanicalName = value || null;
      }
      if (m.imageUrl !== undefined) {
        const value = String(m.imageUrl || "").trim();
        if (value && (!value.startsWith(`${base()}/storage/v1/object/public/renacer-media/plant/`) || value.length > 2048)) return json({ error: "Carica un'immagine della materia prima tramite il modulo immagini." }, 400);
        data.imageUrl = value || null;
      }
      if (m.sourceUrl !== undefined) {
        const value = String(m.sourceUrl || "").trim();
        if (value && (!/^https:\/\//i.test(value) || value.length > 2048)) return json({ error: "Il link della fonte deve essere HTTPS e non superare 2048 caratteri." }, 400);
        data.sourceUrl = value || null;
      }
      for (const field of ["safetyIt", "safetyEn", "safetyEs"] as const) {
        if (m[field] === undefined) continue;
        const value = String(m[field] || "").trim();
        if (value.length > 2000) return json({ error: "Una nota di cautela è troppo lunga." }, 400);
        data[field] = value || null;
      }
      if (m.isActive !== undefined) {
        if (typeof m.isActive !== "boolean") return json({ error: "Stato materia prima non valido." }, 400);
        data.isActive = m.isActive;
      }
      if (!Object.keys(data).length) return json({ error: "Nessuna modifica da salvare." }, 400);
      const slug = String(body.slug || "").trim();
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return json({ error: "Materia prima non valida." }, 400);
      data.updatedAt = new Date().toISOString();
      return writeResult(await db(`plant_materials?slug=eq.${encodeURIComponent(slug)}`, { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify(data) }));
    }

    if (action === "article_create" || action === "article_update") {
      const a = body.article || {};
      const data: Record<string, unknown> = {
        titleIt: a.titleIt, bodyIt: a.bodyIt, titleEn: a.titleEn || null, bodyEn: a.bodyEn || null,
        titleEs: a.titleEs || null, bodyEs: a.bodyEs || null, imageUrl: a.imageUrl || null,
        isPublished: a.isPublished ?? 1,
      };
      const result = action === "article_create"
        ? await db("nutrition_articles", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify({ ...data, slug: `${cleanSlug(String(a.titleIt || "article"))}-${Date.now()}` }) })
        : await db(`nutrition_articles?id=eq.${encodeURIComponent(String(body.id))}`, { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify(data) });
      return writeResult(result);
    }

    if (action === "set_published") {
      const table = body.kind === "article" ? "nutrition_articles" : body.kind === "product" ? "products" : "";
      if (!table || ![0, 1].includes(Number(body.isPublished))) return json({ error: "Stato di pubblicazione non valido." }, 400);
      const result = await db(`${table}?id=eq.${encodeURIComponent(String(body.id))}`, { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify({ isPublished: Number(body.isPublished) }) });
      return writeResult(result);
    }

    if (action === "category_create") {
      const c = body.category || {};
      const nameIt = String(c.nameIt || "").trim();
      const nameEn = String(c.nameEn || "").trim();
      const nameEs = String(c.nameEs || "").trim();
      if (!nameIt || !nameEn || !nameEs) return json({ error: "Nome italiano e traduzioni inglese/spagnolo obbligatori." }, 400);
      const slug = `${cleanSlug(nameIt)}-${Date.now().toString(36)}`;
      const result = await db("categories", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify({ slug, nameIt, nameEn, nameEs, isActive: true }) });
      return writeResult(result);
    }

    if (action === "category_update") {
      const c = body.category || {};
      const data: Record<string, unknown> = {};
      for (const field of ["nameIt", "nameEn", "nameEs"] as const) {
        if (c[field] !== undefined) data[field] = String(c[field]).trim();
      }
      if (c.isActive !== undefined) {
        if (typeof c.isActive !== "boolean") return json({ error: "Stato categoria non valido." }, 400);
        data.isActive = c.isActive;
      }
      if (!Object.keys(data).length) return json({ error: "Nessuna modifica da salvare." }, 400);
      const result = await db(`categories?slug=eq.${encodeURIComponent(String(body.slug || ""))}`, { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify(data) });
      return writeResult(result);
    }

    if (action === "category_delete") {
      const slug = String(body.slug || "").trim();
      if (!slug) return json({ error: "Categoria non valida." }, 400);
      const category = await db(`categories?select=slug,nameIt&slug=eq.${encodeURIComponent(slug)}&limit=1`);
      if (!category.ok) return json({ error: errorMessage(category.data) }, category.status);
      if (!Array.isArray(category.data) || category.data.length === 0) return json({ error: "Categoria non trovata." }, 404);
      const products = await db(`products?select=id&categorySlug=eq.${encodeURIComponent(slug)}&limit=1`);
      if (!products.ok) return json({ error: errorMessage(products.data) }, products.status);
      if (Array.isArray(products.data) && products.data.length > 0) {
        return json({ error: "Questa categoria è assegnata a uno o più prodotti. Riassegna prima quei prodotti, poi riprova." }, 409);
      }
      const result = await db(`categories?slug=eq.${encodeURIComponent(slug)}`, { method: "DELETE", headers: { Prefer: "return=representation" } });
      if (!result.ok && (result.status === 409 || result.status === 400)) {
        return json({ error: "La categoria è ancora utilizzata da un prodotto e non può essere eliminata." }, 409);
      }
      return writeResult(result);
    }

    return json({ error: "Azione non riconosciuta." }, 400);
  } catch (error) {
    console.error("renacer-admin", error);
    return json({ error: "Errore del server. Riprova." }, 500);
  }
});
