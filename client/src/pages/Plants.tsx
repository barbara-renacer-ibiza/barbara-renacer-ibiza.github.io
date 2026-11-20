import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowUpRight, ExternalLink, Leaf, Languages, Search, Sprout } from "lucide-react";
import { useRoute } from "wouter";
import ShareBar from "@/components/ShareBar";

type Language = "it" | "en" | "es";
type PlantMaterial = {
  slug: string;
  nameIt: string;
  nameEn: string;
  nameEs: string;
  botanicalName: string | null;
  descriptionIt: string;
  descriptionEn: string;
  descriptionEs: string;
  safetyIt: string | null;
  safetyEn: string | null;
  safetyEs: string | null;
  sourceUrl: string | null;
  imageUrl: string | null;
};
type Product = { id: number; slug: string; nameIt: string; nameEn: string | null; nameEs: string | null };
type ProductMaterial = { productId: number; plantSlug: string };

const supabaseUrl = "https://dybqvnthmfeatwfpysrv.supabase.co";
const supabaseKey = "sb_publishable_tOmI-rgVzQ7FHs56gJ-JhQ_zrYgZQOd";
const assetUrl = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\/+/, "")}`;
const headers = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` };

const copy: Record<Language, Record<string, string>> = {
  it: {
    kicker: "La materia prima, da vicino", title: "Piante e ingredienti", accent: "da esplorare.", intro: "Un piccolo atlante delle materie prime citate nei prodotti Renacer: da dove arrivano e quale ruolo possono avere in una formula cosmetica.", home: "Torna al sito", collection: "La collezione", nutrition: "Nutrizione", plants: "Le piante", search: "Cerca una pianta o un ingrediente", all: "Tutte le materie", count: "materie prime", learn: "Scopri il materiale", products: "Nei prodotti Renacer", noProducts: "Nessun prodotto collegato per ora.", source: "Approfondisci la fonte", botanical: "Nome botanico", loading: "Caricamento delle materie prime…", failure: "Le materie prime non sono disponibili al momento. Riprova più tardi.", empty: "Nessun ingrediente corrisponde alla ricerca.", noteTitle: "Informazioni da leggere con cura", note: "Queste note descrivono ingredienti e usi cosmetici generali, non sono indicazioni mediche e non sostituiscono le informazioni complete in etichetta. I cosmetici non sono destinati a ustioni o ferite. In caso di ustione recente, segui le indicazioni sanitarie.", burns: "Indicazioni NHS sulle ustioni", back: "Torna alla collezione", footer: "Piante, mani e tempo · Ibiza",
  },
  en: {
    kicker: "Raw materials, up close", title: "Plants and ingredients", accent: "to explore.", intro: "A small field guide to materials mentioned in Renacer products: where they come from and the role they may play in a cosmetic formula.", home: "Back to the site", collection: "The collection", nutrition: "Nutrition", plants: "The plants", search: "Search a plant or ingredient", all: "All materials", count: "raw materials", learn: "Explore this material", products: "In Renacer products", noProducts: "No products are linked yet.", source: "Read the source", botanical: "Botanical name", loading: "Loading raw materials…", failure: "Raw materials are not available right now. Please try again later.", empty: "No ingredients match your search.", noteTitle: "A note to read with care", note: "These notes describe ingredients and general cosmetic uses; they are not medical advice and do not replace full label information. Cosmetics are not intended for burns or wounds. For a recent burn, follow health-service guidance.", burns: "NHS guidance on burns", back: "Back to the collection", footer: "Plants, hands and time · Ibiza",
  },
  es: {
    kicker: "Materias primas, de cerca", title: "Plantas e ingredientes", accent: "para explorar.", intro: "Una pequeña guía de los materiales mencionados en los productos Renacer: de dónde proceden y qué función pueden tener en una fórmula cosmética.", home: "Volver al sitio", collection: "La colección", nutrition: "Nutrición", plants: "Las plantas", search: "Buscar una planta o ingrediente", all: "Todas las materias", count: "materias primas", learn: "Descubre este material", products: "En productos Renacer", noProducts: "Todavía no hay productos vinculados.", source: "Consultar la fuente", botanical: "Nombre botánico", loading: "Cargando materias primas…", failure: "Las materias primas no están disponibles ahora. Inténtalo más tarde.", empty: "No hay ingredientes que coincidan con la búsqueda.", noteTitle: "Información para leer con cuidado", note: "Estas notas describen ingredientes y usos cosméticos generales; no son consejos médicos ni sustituyen la información completa del etiquetado. Los cosméticos no están destinados a quemaduras ni heridas. Para una quemadura reciente, sigue las indicaciones sanitarias.", burns: "Indicaciones del NHS sobre quemaduras", back: "Volver a la colección", footer: "Plantas, manos y tiempo · Ibiza",
  },
};

function localized<T extends string | null>(value: { it: T; en: T; es: T }, language: Language): T {
  return value[language] || value.it;
}

function materialName(material: PlantMaterial, language: Language) {
  return localized({ it: material.nameIt, en: material.nameEn, es: material.nameEs }, language);
}

function materialDescription(material: PlantMaterial, language: Language) {
  return localized({ it: material.descriptionIt, en: material.descriptionEn, es: material.descriptionEs }, language);
}

function materialSafety(material: PlantMaterial, language: Language) {
  return localized({ it: material.safetyIt, en: material.safetyEn, es: material.safetyEs }, language);
}

function productName(product: Product, language: Language) {
  return (language === "en" ? product.nameEn : language === "es" ? product.nameEs : product.nameIt)?.trim() || product.nameIt;
}

export default function Plants() {
  const [detailMatch, routeParams] = useRoute("/plants/:slug");
  const routeSlug = detailMatch ? routeParams?.slug : undefined;
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem("renacer_language");
    return saved === "en" || saved === "es" ? saved : "it";
  });
  const [materials, setMaterials] = useState<PlantMaterial[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [relations, setRelations] = useState<ProductMaterial[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const selectedSlug = routeSlug || new URLSearchParams(window.location.search).get("plant");
  const t = (key: string) => copy[language][key] ?? copy.it[key] ?? key;

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch(`${supabaseUrl}/rest/v1/plant_materials?select=slug,nameIt,nameEn,nameEs,botanicalName,descriptionIt,descriptionEn,descriptionEs,safetyIt,safetyEn,safetyEs,sourceUrl,imageUrl&isActive=eq.true&order=nameIt.asc`, { headers }).then((response) => {
        if (!response.ok) throw new Error("materials");
        return response.json() as Promise<PlantMaterial[]>;
      }),
      fetch(`${supabaseUrl}/rest/v1/products?select=id,slug,nameIt,nameEn,nameEs&isPublished=eq.1&order=createdAt.desc`, { headers }).then((response) => {
        if (!response.ok) throw new Error("products");
        return response.json() as Promise<Product[]>;
      }),
      fetch(`${supabaseUrl}/rest/v1/product_plant_materials?select=productId,plantSlug&order=plantSlug.asc`, { headers }).then((response) => {
        if (!response.ok) throw new Error("relations");
        return response.json() as Promise<ProductMaterial[]>;
      }),
    ]).then(([materialRows, productRows, relationRows]) => {
      if (cancelled) return;
      setMaterials(materialRows);
      setProducts(productRows);
      setRelations(relationRows);
      setFailed(false);
    }).catch(() => {
      if (cancelled) return;
      setFailed(true);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!selectedSlug || loading) return;
    const target = document.getElementById(`material-${selectedSlug}`);
    if (target) window.setTimeout(() => target.scrollIntoView({ behavior: "smooth", block: "center" }), 80);
  }, [selectedSlug, loading]);

  const visibleMaterials = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase(language);
    const result = !needle ? materials : materials.filter((material) => [material.nameIt, material.nameEn, material.nameEs, material.botanicalName || "", material.descriptionIt, material.descriptionEn, material.descriptionEs].join(" ").toLocaleLowerCase(language).includes(needle));
    return routeSlug ? result.filter((material) => material.slug === routeSlug) : result;
  }, [materials, search, language, routeSlug]);

  useEffect(() => {
    const selected = materials.find((material) => material.slug === selectedSlug);
    if (!selected) return;
    const title = materialName(selected, language);
    document.title = `${title} · Renacer Ibiza`;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) { meta = document.createElement("meta"); meta.setAttribute("name", "description"); document.head.append(meta); }
    meta.setAttribute("content", materialDescription(selected, language).slice(0, 155));
  }, [materials, selectedSlug, language]);

  const chooseLanguage = (next: Language) => {
    localStorage.setItem("renacer_language", next);
    setLanguage(next);
  };

  return (
    <div className="plants-page">
      <div className="topline"><div className="container topline__inner"><span>{t("kicker")}</span><span className="topline__note"><Sprout size={13} /> Renacer · Ibiza</span></div></div>
      <header className="site-header">
        <div className="container header__inner">
          <a className="brand" href="/" aria-label="Renacer Ibiza">
            <img className="brand-logo-image" src={assetUrl("/images/logo-woman.png")} alt="" />
            <span className="brand__text"><strong>Renacer</strong><small>Ibiza · artisan care</small></span>
          </a>
          <nav className="plants-nav" aria-label={t("plants")}>
            <a href="/catalogue">{t("collection")}</a><a href="/nutrition">{t("nutrition")}</a><a className="is-active" href="/plants">{t("plants")}</a>
            <span className="plants-language" aria-label="Language"><Languages size={14} />
              {(["it", "en", "es"] as Language[]).map((option) => <button key={option} type="button" className={language === option ? "is-active" : ""} onClick={() => chooseLanguage(option)}>{option.toUpperCase()}</button>)}
            </span>
          </nav>
        </div>
      </header>

      <main className="plants-main">
        <section className="plants-hero container">
          <div className="plants-hero__copy">
            <a className="plants-back" href="/"><ArrowLeft size={15} /> {t("home")}</a>
            <span className="section-eyebrow"><Leaf size={14} /> {t("kicker")}</span>
            <h1>{t("title")}<br /><em>{t("accent")}</em></h1>
            <p>{t("intro")}</p>
          </div>
          <div className="plants-hero__seal" aria-hidden="true"><span className="plants-hero__orbit plants-hero__orbit--one" /><span className="plants-hero__orbit plants-hero__orbit--two" /><span className="plants-hero__seal-icon"><Sprout size={39} strokeWidth={1.15} /></span><span className="plants-hero__seal-label">Renacer · Ibiza</span></div>
        </section>

        <section className="plants-catalog container" aria-label={t("plants")}>
          <div className="plants-catalog__heading"><div><span className="section-eyebrow"><Leaf size={14} /> {materials.length} {t("count")}</span><h2>{t("all")}</h2></div>
            <label className="plants-search"><Search size={16} /><span className="sr-only">{t("search")}</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("search")} /></label>
          </div>
          {loading ? <p className="plants-state">{t("loading")}</p> : failed ? <p className="plants-state">{t("failure")}</p> : visibleMaterials.length === 0 ? <p className="plants-state">{t("empty")}</p> : (
            <div className="plants-grid">
              {visibleMaterials.map((material, index) => {
                const related = relations.filter((relation) => relation.plantSlug === material.slug).map((relation) => products.find((product) => product.id === relation.productId)).filter((product): product is Product => Boolean(product));
                const safety = materialSafety(material, language);
                return <article className={selectedSlug === material.slug ? "plant-card is-highlighted" : "plant-card"} id={`material-${material.slug}`} key={material.slug}>
                  {material.imageUrl ? <img className="plant-card__image" src={material.imageUrl} alt={materialName(material, language)} loading="lazy" /> : null}
                  <div className="plant-card__top"><span>{String(index + 1).padStart(2, "0")}</span><Leaf size={17} /></div>
                  <h3><a href={`/plants/${encodeURIComponent(material.slug)}`}>{materialName(material, language)}</a></h3>
                  {material.botanicalName ? <p className="plant-card__botanical"><i>{material.botanicalName}</i></p> : null}
                  <p className="plant-card__description">{materialDescription(material, language)}</p>
                  {safety ? <p className="plant-card__safety">{safety}</p> : null}
                  {material.sourceUrl ? <a className="plant-card__source" href={material.sourceUrl} target="_blank" rel="noopener noreferrer">{t("source")} <ExternalLink size={13} /></a> : null}
                  <div className="plant-card__products"><strong>{t("products")}</strong>
                    {related.length ? <div>{related.map((product) => <a key={product.id} href={`/catalogue/${encodeURIComponent(product.slug)}`}>{productName(product, language)} <ArrowUpRight size={12} /></a>)}</div> : <small>{t("noProducts")}</small>}
                  </div>
                  <ShareBar title={materialName(material, language)} path={`/plants/${encodeURIComponent(material.slug)}`} language={language}/>
                </article>;
              })}
            </div>
          )}
        </section>

        <aside className="plants-note container"><span className="plants-note__icon"><Leaf size={18} /></span><div><strong>{t("noteTitle")}</strong><p>{t("note")} <a href="https://www.nhs.uk/conditions/burns-and-scalds/" target="_blank" rel="noopener noreferrer">{t("burns")} <ExternalLink size={12} /></a></p></div></aside>
      </main>

      <footer className="site-footer plants-footer"><div className="container footer__top">
        <a className="brand brand--footer" href="/"><img className="brand-logo-image" src={assetUrl("/images/logo-woman.png")} alt="" /><span className="brand__text"><strong>Renacer</strong><small>Ibiza · artisan care</small></span></a>
        <div className="footer__links"><a href="/catalogue">{t("collection")}</a><a href="/nutrition">{t("nutrition")}</a><a href="/plants">{t("plants")}</a></div>
        <div className="footer__details"><span>{t("footer")}</span><a href="/admin">Gestione catalogo</a></div>
      </div><div className="container footer__bottom"><a href="/#catalogo">{t("back")}</a><span>© {new Date().getFullYear()} Renacer · Ibiza</span></div></footer>
    </div>
  );
}
