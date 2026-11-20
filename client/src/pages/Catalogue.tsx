import { useEffect, useMemo, useState } from "react";
import { useRoute } from "wouter";
import { ArrowLeft, ArrowUpRight, Leaf, MessageCircle, PackageOpen } from "lucide-react";
import ShareBar from "@/components/ShareBar";

type Lang = "it" | "en" | "es";
type Product = { id: number; slug: string; nameIt: string; descriptionIt: string; nameEn: string | null; descriptionEn: string | null; nameEs: string | null; descriptionEs: string | null; category: string; categorySlug: string; imageUrl: string | null; priceCents: number; currency: string; INCI: string | null };
type Category = { slug: string; nameIt: string; nameEn: string | null; nameEs: string | null };
type Plant = { slug: string; nameIt: string; nameEn: string | null; nameEs: string | null };
type Relation = { productId: number; plantSlug: string };
const api = "https://dybqvnthmfeatwfpysrv.supabase.co";
const key = "sb_publishable_tOmI-rgVzQ7FHs56g-JhQ_zrYgZQOd";
const headers = { apikey: key, Authorization: `Bearer ${key}` };
const words = {
  it: { kicker: "Renacer · Ibiza", title: "La collezione", lead: "Prodotti artigianali, creati con cura e ispirati dalla natura.", search: "Cerca un prodotto", all: "Tutte le categorie", ask: "Chiedi disponibilità", inci: "INCI · ingredienti", plants: "Materie prime collegate", back: "Tutti i prodotti", empty: "Nessun prodotto pubblicato al momento.", noMatch: "Nessun prodotto corrisponde alla ricerca.", loading: "Caricamento della collezione…", notFound: "Questo prodotto non è disponibile.", home: "Torna al sito", catalog: "Catalogo", nutrition: "Nutrizione", artisans: "Artigiani" },
  en: { kicker: "Renacer · Ibiza", title: "The collection", lead: "Handcrafted products, made with care and inspired by nature.", search: "Search products", all: "All categories", ask: "Ask about availability", inci: "INCI · ingredients", plants: "Related raw materials", back: "All products", empty: "No products are published right now.", noMatch: "No products match your search.", loading: "Loading the collection…", notFound: "This product is not available.", home: "Back to the site", catalog: "Catalogue", nutrition: "Nutrition", artisans: "Artisans" },
  es: { kicker: "Renacer · Ibiza", title: "La colección", lead: "Productos artesanales, elaborados con cuidado e inspirados en la naturaleza.", search: "Buscar productos", all: "Todas las categorías", ask: "Consultar disponibilidad", inci: "INCI · ingredientes", plants: "Materias primas relacionadas", back: "Todos los productos", empty: "No hay productos publicados ahora.", noMatch: "No hay productos que coincidan con la búsqueda.", loading: "Cargando la colección…", notFound: "Este producto no está disponible.", home: "Volver al sitio", catalog: "Catálogo", nutrition: "Nutrición", artisans: "Artesanos" },
};
function getLanguage(): Lang { const v = localStorage.getItem("renacer_language"); return v === "en" || v === "es" ? v : "it"; }
function localized<T extends string | null>(it: T, en: T, es: T, lang: Lang): T { return (lang === "en" ? en : lang === "es" ? es : it) || it; }
function titleOf(item: Product, lang: Lang) { return localized(item.nameIt, item.nameEn, item.nameEs, lang) || item.nameIt; }
function descOf(item: Product, lang: Lang) { return localized(item.descriptionIt, item.descriptionEn, item.descriptionEs, lang) || item.descriptionIt; }

export default function Catalogue() {
  const [detailMatch, route] = useRoute("/catalogue/:slug");
  const slug = detailMatch ? route?.slug : new URLSearchParams(window.location.search).get("product") || undefined;
  const [lang, setLang] = useState<Lang>(getLanguage);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [relations, setRelations] = useState<Relation[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const t = words[lang];
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch(`${api}/rest/v1/products?select=id,slug,nameIt,descriptionIt,nameEn,descriptionEn,nameEs,descriptionEs,category,categorySlug,imageUrl,priceCents,currency,INCI&isPublished=eq.1&order=createdAt.desc`, { headers }).then(r => { if (!r.ok) throw new Error(); return r.json() as Promise<Product[]>; }),
      fetch(`${api}/rest/v1/categories?select=slug,nameIt,nameEn,nameEs&isActive=eq.true&order=nameIt.asc`, { headers }).then(r => r.ok ? r.json() : [] as Category[]),
      fetch(`${api}/rest/v1/plant_materials?select=slug,nameIt,nameEn,nameEs&isActive=eq.true&order=nameIt.asc`, { headers }).then(r => r.ok ? r.json() : [] as Plant[]),
      fetch(`${api}/rest/v1/product_plant_materials?select=productId,plantSlug&order=plantSlug.asc`, { headers }).then(r => r.ok ? r.json() : [] as Relation[]),
    ]).then(([p,c,pl,re]: [Product[],Category[],Plant[],Relation[]]) => { if (!cancelled) { setProducts(p); setCategories(c); setPlants(pl); setRelations(re); } }).catch(() => { if (!cancelled) setProducts([]); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);
  const selected = useMemo(() => products.find(p => p.slug === slug), [products, slug]);
  const visible = useMemo(() => products.filter(p => (category === "all" || p.categorySlug === category) && `${p.nameIt} ${p.nameEn || ""} ${p.nameEs || ""} ${p.descriptionIt}`.toLocaleLowerCase(lang).includes(search.trim().toLocaleLowerCase(lang))), [products, category, search, lang]);
  useEffect(() => {
    localStorage.setItem("renacer_language", lang);
    document.documentElement.lang = lang;
    const name = selected ? titleOf(selected, lang) : t.title;
    document.title = `${name} · Renacer Ibiza`;
    const description = selected ? descOf(selected, lang).slice(0, 155) : t.lead;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) { meta = document.createElement("meta"); meta.setAttribute("name", "description"); document.head.append(meta); }
    meta.setAttribute("content", description);
  }, [lang, selected, t.lead, t.title]);
  const materialRows = selected ? relations.filter(r => r.productId === selected.id).map(r => plants.find(p => p.slug === r.plantSlug)).filter((p): p is Plant => Boolean(p)) : [];
  const formatPrice = (p: Product) => `${(p.priceCents / 100).toFixed(2)} ${p.currency || "EUR"}`;
  return <div className="catalogue-page">
    <div className="topline"><div className="container topline__inner"><span>{t.kicker}</span><span className="topline__note"><Leaf size={13} /> {t.title}</span></div></div>
    <header className="site-header"><div className="container header__inner"><a className="brand" href="/" aria-label="Renacer Ibiza"><img className="brand-logo-image" src="/images/logo-woman.png" alt=""/><span className="brand__text"><strong>Renacer</strong><small>Ibiza · cura artigianale</small></span></a><nav className="catalogue-nav"><a href="/">{t.home}</a><a href="/nutrition">{t.nutrition}</a><a href="/plants">{lang === "en" ? "Plants" : lang === "es" ? "Plantas" : "Piante"}</a><a href="/artisans">{t.artisans}</a><span>{(["it","en","es"] as Lang[]).map(l => <button key={l} className={lang === l ? "is-active" : ""} onClick={() => setLang(l)} type="button">{l.toUpperCase()}</button>)}</span></nav></div></header>
    <main className="catalogue-main container">
      {!slug ? <>
        <section className="catalogue-hero"><span className="section-eyebrow"><PackageOpen size={14}/>{t.kicker}</span><h1>{t.title}</h1><p>{t.lead}</p></section>
        {loading ? <p className="catalogue-state">{t.loading}</p> : products.length === 0 ? <p className="catalogue-state">{t.empty}</p> : <>
          <section className="catalogue-controls"><input type="search" aria-label={t.search} placeholder={t.search} value={search} onChange={e => setSearch(e.target.value)}/><div className="catalogue-categories"><button type="button" className={category === "all" ? "is-active" : ""} onClick={() => setCategory("all")}>{t.all}</button>{categories.filter(c => products.some(p => p.categorySlug === c.slug)).map(c => <button key={c.slug} type="button" className={category === c.slug ? "is-active" : ""} onClick={() => setCategory(c.slug)}>{localized(c.nameIt,c.nameEn,c.nameEs,lang)}</button>)}</div></section>
          {visible.length ? <div className="catalogue-grid">{visible.map(p => <article className="catalogue-card" key={p.id}><a className="catalogue-card__image" href={`/catalogue/${encodeURIComponent(p.slug)}`} aria-label={titleOf(p,lang)}>{p.imageUrl ? <img src={p.imageUrl} alt={titleOf(p,lang)} loading="lazy"/> : <span><Leaf size={30}/></span>}</a><div className="catalogue-card__content"><small>{categories.find(c => c.slug === p.categorySlug)?.[lang === "en" ? "nameEn" : lang === "es" ? "nameEs" : "nameIt"] || p.category}</small><h2><a href={`/catalogue/${encodeURIComponent(p.slug)}`}>{titleOf(p,lang)}</a></h2><p>{descOf(p,lang)}</p><div className="catalogue-card__bottom"><strong>{formatPrice(p)}</strong><a href={`/catalogue/${encodeURIComponent(p.slug)}`} aria-label={`${t.back}: ${titleOf(p,lang)}`}>{lang === "en" ? "Details" : lang === "es" ? "Detalles" : "Dettagli"} <ArrowUpRight size={14}/></a></div></div></article>)}</div> : <p className="catalogue-state">{t.noMatch}</p>}
        </>}
      </> : loading ? <p className="catalogue-state">{t.loading}</p> : !selected ? <section className="catalogue-missing"><Leaf size={26}/><h1>{t.notFound}</h1><a href="/catalogue"><ArrowLeft size={15}/>{t.back}</a></section> : <article className="catalogue-detail"><a className="catalogue-back" href="/catalogue"><ArrowLeft size={15}/>{t.back}</a><div className="catalogue-detail__grid"><div className="catalogue-detail__photo">{selected.imageUrl ? <img src={selected.imageUrl} alt={titleOf(selected,lang)}/> : <Leaf size={42}/>}</div><div className="catalogue-detail__copy"><span className="section-eyebrow"><Leaf size={14}/>{categories.find(c=>c.slug===selected.categorySlug)?.[lang === "en" ? "nameEn" : lang === "es" ? "nameEs" : "nameIt"] || selected.category}</span><h1>{titleOf(selected,lang)}</h1><strong className="catalogue-price">{formatPrice(selected)}</strong><p>{descOf(selected,lang)}</p><a className="button button--primary" href={`https://wa.me/34646072140?text=${encodeURIComponent(`${lang === "en" ? "Hello Barbara, I would like information about" : lang === "es" ? "Hola Barbara, quisiera información sobre" : "Ciao Barbara, vorrei informazioni su"}: ${titleOf(selected,lang)}`)}`} target="_blank" rel="noopener noreferrer"><MessageCircle size={16}/>{t.ask}<ArrowUpRight size={14}/></a><ShareBar title={titleOf(selected,lang)} path={`/catalogue/${encodeURIComponent(selected.slug)}`} language={lang}/></div></div>{selected.INCI?.trim() ? <section className="catalogue-detail__section"><h2>{t.inci}</h2><p>{selected.INCI}</p></section> : null}{materialRows.length ? <section className="catalogue-detail__section"><h2>{t.plants}</h2><div className="catalogue-materials">{materialRows.map(m=><a key={m.slug} href={`/plants/${encodeURIComponent(m.slug)}`}>{localized(m.nameIt,m.nameEn,m.nameEs,lang)} <ArrowUpRight size={13}/></a>)}</div></section> : null}</article>}
    </main>
    <footer className="site-footer"><div className="container footer__bottom"><a href="/">Renacer · Ibiza</a><a href="/catalogue">{t.catalog}</a><a href="/artisans">{t.artisans}</a><span>© {new Date().getFullYear()} Renacer · Ibiza</span></div></footer>
  </div>;
}
