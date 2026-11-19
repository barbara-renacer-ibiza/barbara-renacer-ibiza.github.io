import { useEffect, useState, type ReactNode } from "react";
import {
  ArrowDown,
  ArrowUpRight,
  BookOpen,
  Check,
  CircleDot,
  Compass,
  Heart,
  Languages,
  Leaf,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  Moon,
  PackageOpen,
  ShieldCheck,
  Sparkles,
  Sprout,
  X,
} from "lucide-react";

const whatsappLink = "https://wa.me/34646072140";
const supabaseUrl = "https://dybqvnthmfeatwfpysrv.supabase.co";
const supabasePublishableKey = "sb_publishable_tOmI-rgVzQ7FHs56gJ-JhQ_zrYgZQOd";
const assetUrl = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\/+/, "")}`;
type Language = "it" | "en" | "es";

const languageLabels: Record<Language, string> = { it: "IT", en: "EN", es: "ES" };
const copy: Record<Language, Record<string, string>> = {
  it: {
    project: "Il progetto", nutrition: "Nutrizione", catalog: "Catalogo", contact: "Contatti", whatsapp: "Scrivimi su WhatsApp", askNow: "Chiedi ora",
    kicker: "Cosmetici artigianali · Ibiza", heroTitle: "Tornare a sé", heroAccent: "con calma.", heroLead: "Piante, mani e tempo. Una cura quotidiana ispirata dalla natura e da un modo più lento di vivere.",
    discover: "Scopri i prodotti", talk: "Parliamone su WhatsApp", projectEyebrow: "Il progetto", projectTitle: "Tra il sapere delle piante e la vita di ogni giorno.", storyLead: "Sono Bárbara. Per me Ibiza è la possibilità di fermarmi e ascoltarmi, lontano dal rumore della vita quotidiana. Renacer è nato da questo desiderio di riconnettermi.", storyBody: "Lavorare con le piante, creare con le mani e incontrare le persone sono il modo in cui voglio vivere questo nuovo capitolo. I miei prodotti e il mio interesse per l'alimentazione naturale sono due espressioni dello stesso percorso.", storyLink: "Conosci la storia", band: "Non un grande laboratorio.", bandAccent: "Una pratica personale.", nutritionEyebrow: "Un approccio più ampio alla cura", nutritionTitle: "La cura passa anche da ciò che mangiamo.", nutritionBody: "La cura della pelle è collegata anche all’alimentazione. Una dieta varia ed equilibrata offre nutrienti importanti per la pelle e per il benessere del corpo. Qui troverai lezioni e appunti di nutrizione naturale, da aggiungere nel tempo.", futureOne: "Lezioni di nutrizione in arrivo", futureTwo: "Testi e immagini aggiungibili in seguito", futureThree: "Contenuti curati da Barbara", catalogEyebrow: "La collezione", catalogTitle: "Scopri la collezione", catalogAccent: "Renacer.", catalogBody: "Esplora i prodotti, guarda le immagini e chiedi a Barbara informazioni o disponibilità su WhatsApp.", emptyEyebrow: "Collezione in preparazione", emptyTitle: "Nessun prodotto pubblicato per ora.", emptyBody: "Se vuoi sapere cosa è disponibile in questo momento, scrivi direttamente su WhatsApp. Barbara sarà felice di raccontartelo.", ask: "Scrivi a Barbara", contactTitle: "Hai una domanda?", contactAccent: "Parliamone.", contactBody: "Per prodotti, disponibilità o prossimi mercati a Ibiza, puoi contattare direttamente Barbara su WhatsApp.", openWhatsapp: "Scrivi su WhatsApp", portraitEyebrow: "Una presenza, non un primo piano", portraitTitle: "La persona dietro Renacer", portraitAccent: "arriva alla fine.", portraitBody: "Barbara Claps · Certified natural and holistic nutrition adviser. Un progetto nato a Ibiza, tra piante, lavoro manuale, ascolto e ingredienti grezzi.", languageNote: "Scegli la lingua del sito",
  },
  en: {
    project: "The project", nutrition: "Nutrition", catalog: "Catalogue", contact: "Contact", whatsapp: "Write on WhatsApp", askNow: "Ask now",
    kicker: "Handcrafted skincare · Ibiza", heroTitle: "Back to yourself", heroAccent: "slowly.", heroLead: "Plants, hands and time. Everyday care inspired by nature and a slower way of living.",
    discover: "Explore the products", talk: "Talk on WhatsApp", projectEyebrow: "The project", projectTitle: "Between plant knowledge and everyday life.", storyLead: "I'm Bárbara. For me, Ibiza offers the chance to pause and listen to myself, away from the noise of everyday life. Renacer grew from that desire to reconnect.", storyBody: "Working with plants, making things by hand and meeting people are how I want to live this new chapter. My products and my interest in natural eating are two expressions of this journey.", storyLink: "Read my story", band: "Not a large laboratory.", bandAccent: "A personal practice.", nutritionEyebrow: "A broader approach to care", nutritionTitle: "Care is also connected to what we eat.", nutritionBody: "Skin care also connects with what we eat. A varied, balanced diet provides nutrients important to skin and whole-body wellbeing. This is where Barbara will share lessons and notes on natural nutrition over time.", futureOne: "Nutrition lessons coming soon", futureTwo: "Texts and images can be added later", futureThree: "Content curated by Barbara", catalogEyebrow: "The collection", catalogTitle: "Explore the Renacer", catalogAccent: "collection.", catalogBody: "Browse the products, see the images, and ask Barbara about details or availability on WhatsApp.", emptyEyebrow: "Collection in preparation", emptyTitle: "No products published yet.", emptyBody: "To find out what is available right now, write directly on WhatsApp. Barbara will be happy to tell you about it.", ask: "Message Barbara", contactTitle: "Have a question?", contactAccent: "Let's talk.", contactBody: "For products, availability or upcoming markets in Ibiza, contact Barbara directly on WhatsApp.", openWhatsapp: "Message on WhatsApp", portraitEyebrow: "A presence, not a close-up", portraitTitle: "The person behind Renacer", portraitAccent: "comes at the end.", portraitBody: "Barbara Claps · Certified natural and holistic nutrition adviser. A project born in Ibiza, between plants, handmade work, listening and raw ingredients.", languageNote: "Choose the site language",
  },
  es: {
    project: "El proyecto", nutrition: "Nutrición", catalog: "Catálogo", contact: "Contacto", whatsapp: "Escríbeme por WhatsApp", askNow: "Consultar ahora",
    kicker: "Cosmética artesanal · Ibiza", heroTitle: "Volver a una misma", heroAccent: "despacio.", heroLead: "Plantas, manos y tiempo. Cuidado cotidiano inspirado en la naturaleza y en una forma más lenta de vivir.",
    discover: "Explora los productos", talk: "Hablemos por WhatsApp", projectEyebrow: "El proyecto", projectTitle: "Entre el saber de las plantas y la vida cotidiana.", storyLead: "Soy Bárbara. Para mí, Ibiza ofrece la posibilidad de parar y escucharme, lejos del ruido de la vida diaria. Renacer nació de ese deseo de reconectar.", storyBody: "Trabajar con plantas, crear con las manos y conocer personas es la forma en que quiero vivir este nuevo capítulo. Mis productos y mi interés por la alimentación natural son dos expresiones de este camino.", storyLink: "Conoce mi historia", band: "No es un gran laboratorio.", bandAccent: "Es una práctica personal.", nutritionEyebrow: "Un enfoque más amplio del cuidado", nutritionTitle: "El cuidado también se relaciona con lo que comemos.", nutritionBody: "El cuidado de la piel también conecta con la alimentación. Una dieta variada y equilibrada aporta nutrientes importantes para la piel y el bienestar del cuerpo. Aquí Barbara compartirá lecciones y notas de nutrición natural con el tiempo.", futureOne: "Próximamente: lecciones de nutrición", futureTwo: "Textos e imágenes para añadir más adelante", futureThree: "Contenido preparado por Barbara", catalogEyebrow: "La colección", catalogTitle: "Explora la colección", catalogAccent: "Renacer.", catalogBody: "Descubre los productos, mira sus imágenes y pregunta a Barbara por WhatsApp sobre detalles o disponibilidad.", emptyEyebrow: "Colección en preparación", emptyTitle: "Todavía no hay productos publicados.", emptyBody: "Para saber qué está disponible ahora, escribe directamente por WhatsApp. Barbara estará encantada de contártelo.", ask: "Escribir a Barbara", contactTitle: "¿Tienes una pregunta?", contactAccent: "Hablemos.", contactBody: "Para productos, disponibilidad o próximos mercados en Ibiza, contacta directamente con Barbara por WhatsApp.", openWhatsapp: "Escribir por WhatsApp", portraitEyebrow: "Una presencia, no un primer plano", portraitTitle: "La persona detrás de Renacer", portraitAccent: "llega al final.", portraitBody: "Barbara Claps · Certified natural and holistic nutrition adviser. Un proyecto nacido en Ibiza, entre plantas, trabajo manual, escucha e ingredientes brutos.", languageNote: "Elige el idioma del sitio",
  },
};

const nutritionCopy: Record<Language, Record<string, string>> = {
  it: { allCategories: "Tutte le categorie", searchEmpty: "Nessun prodotto corrisponde alla ricerca.", learnMore: "Leggi di più", allArticles: "Tutti gli articoli" },
  en: { allCategories: "All categories", searchEmpty: "No products match your search.", learnMore: "Learn more", allArticles: "All articles" },
  es: { allCategories: "Todas las categorías", searchEmpty: "No hay productos que coincidan con la búsqueda.", learnMore: "Leer más", allArticles: "Todos los artículos" },
};
const extraCopy: Record<Language, Record<string, string>> = {
  it: { plants: "Le piante", inci: "INCI · ingredienti", rawMaterials: "Esplora le materie prime" },
  en: { plants: "The plants", inci: "INCI · ingredients", rawMaterials: "Explore raw materials" },
  es: { plants: "Las plantas", inci: "INCI · ingredientes", rawMaterials: "Explora las materias primas" },
};

function BotanicalMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "brand-mark brand-mark--compact" : "brand-mark"} aria-hidden="true">
      <svg viewBox="0 0 58 58" role="presentation">
        <circle cx="29" cy="29" r="27" className="brand-mark__ring" />
        <path d="M30.5 45c-.8-8.7.1-16 3.1-21.7 2.3-4.4 5.6-7.7 9.8-10" className="brand-mark__line" />
        <path d="M33 29c-6.5-1.6-10.6-5.1-12.5-10.8 6.5-.3 11.6 2.2 12.5 10.8Z" className="brand-mark__leaf" />
        <path d="M35 24.6c.8-6.1 4.1-10.5 9.8-13.2.8 6.1-2 10.6-9.8 13.2Z" className="brand-mark__leaf brand-mark__leaf--light" />
        <path d="M31.4 37.2c-6.4-.5-10.6-3-12.7-7.7 5.8-1.1 10.5 1.3 12.7 7.7Z" className="brand-mark__leaf brand-mark__leaf--muted" />
      </svg>
    </div>
  );
}

function SectionEyebrow({ children, icon }: { children: string; icon?: ReactNode }) {
  return (
    <div className="section-eyebrow">
      {icon ?? <CircleDot size={13} strokeWidth={2} />}
      <span>{children}</span>
    </div>
  );
}

type ProductView = {
  id: number;
  sourceLanguage: Language;
  nameIt: string;
  descriptionIt: string;
  nameEn: string | null;
  descriptionEn: string | null;
  nameEs: string | null;
  descriptionEs: string | null;
  imageUrl: string | null;
  whatsappMessage: string | null;
  priceCents: number;
  category: string;
  categorySlug: string;
  INCI: string | null;
  plantSlugs?: string[];
};

type NutritionArticleView = {
  id: number;
  slug: string;
  titleIt: string;
  bodyIt: string;
  titleEn: string | null;
  bodyEn: string | null;
  titleEs: string | null;
  bodyEs: string | null;
  imageUrl: string | null;
};

type CategoryView = { slug: string; nameIt: string; nameEn: string | null; nameEs: string | null; isActive: boolean };
type PlantMaterialView = { slug: string; nameIt: string; nameEn: string | null; nameEs: string | null };
type ProductPlantLink = { productId: number; plantSlug: string };

function productCopy(product: ProductView, language: Language) {
  const names: Record<Language, string | null> = { it: product.nameIt, en: product.nameEn, es: product.nameEs };
  const descriptions: Record<Language, string | null> = { it: product.descriptionIt, en: product.descriptionEn, es: product.descriptionEs };
  const name = names[language]?.trim() || product.nameIt;
  const description = descriptions[language]?.trim() || product.descriptionIt;
  return { name, description, isFallback: !names[language]?.trim() || !descriptions[language]?.trim() };
}

function productWhatsappLink(product: ProductView, language: Language, name: string) {
  const prompts = { it: `Ciao Barbara, vorrei informazioni e disponibilità per: ${name}`, en: `Hello Barbara, I would like information and availability for: ${name}`, es: `Hola Barbara, quisiera información y disponibilidad de: ${name}` };
  const customMessage = product.sourceLanguage === language ? product.whatsappMessage?.trim() : "";
  return `${whatsappLink}?text=${encodeURIComponent(customMessage || prompts[language])}`;
}

function ProductCard({ product, language, ctaLabel, categoryLabel, plantMaterials, inciLabel, rawMaterialsLabel }: { product: ProductView; language: Language; ctaLabel: string; categoryLabel: string; plantMaterials: PlantMaterialView[]; inciLabel: string; rawMaterialsLabel: string }) {
  const localized = productCopy(product, language);
  const link = productWhatsappLink(product, language, localized.name);
  const originalCopyLabel = {
    it: { it: "Testo originale in italiano", en: "Testo originale in inglese", es: "Testo originale in spagnolo" },
    en: { it: "Original text in Italian", en: "Original text in English", es: "Original text in Spanish" },
    es: { it: "Texto original en italiano", en: "Texto original en inglés", es: "Texto original en español" },
  };
  return (
    <article className="product-card" id={`product-${product.id}`}>
      <div className="product-card__image-wrap">
        {product.imageUrl ? <img src={product.imageUrl} alt={localized.name} className="product-card__image" /> : <div className="product-card__placeholder"><Leaf size={31} /></div>}
      </div>
      <div className="product-card__body"><div className="product-card__meta"><span>{localized.isFallback ? originalCopyLabel[language][product.sourceLanguage] : "Renacer · Ibiza"}</span></div><h3>{localized.name}</h3><p>{localized.description}</p>{product.priceCents > 0 ? <strong className="product-card__price">{(product.priceCents / 100).toFixed(2)} EUR</strong> : null}<small className="product-card__category">{categoryLabel}</small>
        {product.INCI?.trim() ? <details className="product-card__inci"><summary>{inciLabel}</summary><p>{product.INCI}</p></details> : null}
        {plantMaterials.length ? <div className="product-card__materials"><span>{rawMaterialsLabel}</span><div>{plantMaterials.map((material) => <a key={material.slug} href={`/plants?plant=${encodeURIComponent(material.slug)}`}>{language === "en" ? material.nameEn || material.nameIt : language === "es" ? material.nameEs || material.nameIt : material.nameIt}</a>)}</div></div> : null}
        <a className="button button--primary" href={link} target="_blank" rel="noreferrer"><MessageCircle size={16} /> {ctaLabel} <ArrowUpRight size={15} /></a></div>
    </article>
  );
}

function articleTitleFor(article: NutritionArticleView, language: Language) {
  return (language === "en" ? article.titleEn : language === "es" ? article.titleEs : article.titleIt)?.trim() || article.titleIt;
}

function articleBodyFor(article: NutritionArticleView, language: Language) {
  return (language === "en" ? article.bodyEn : language === "es" ? article.bodyEs : article.bodyIt)?.trim() || article.bodyIt;
}

function articleExcerpt(body: string, wordCount = 36) {
  const words = body.replace(/\s+/g, " ").trim().split(" ");
  return words.length > wordCount ? `${words.slice(0, wordCount).join(" ")}…` : words.join(" ");
}

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [language, setLanguage] = useState<Language>("it");
  const [products, setProducts] = useState<ProductView[]>([]);
  const [catalogCategories, setCatalogCategories] = useState<CategoryView[]>([]);
  const [plantMaterials, setPlantMaterials] = useState<PlantMaterialView[]>([]);
  const [articles, setArticles] = useState<NutritionArticleView[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const t = (key: string) => extraCopy[language][key] ?? nutritionCopy[language][key] ?? copy[language][key] ?? copy.it[key] ?? key;

  useEffect(() => {
    const headers = { apikey: supabasePublishableKey, Authorization: `Bearer ${supabasePublishableKey}` };
    Promise.all([
      fetch(`${supabaseUrl}/rest/v1/products?select=id,sourceLanguage,nameIt,descriptionIt,nameEn,descriptionEn,nameEs,descriptionEs,imageUrl,whatsappMessage,priceCents,category,categorySlug,INCI,isPublished&isPublished=eq.1&order=createdAt.desc`, { headers }).then((response) => response.ok ? response.json() : []),
      fetch(`${supabaseUrl}/rest/v1/categories?select=slug,nameIt,nameEn,nameEs,isActive&isActive=eq.true&order=nameIt.asc`, { headers }).then((response) => response.ok ? response.json() : []),
      fetch(`${supabaseUrl}/rest/v1/plant_materials?select=slug,nameIt,nameEn,nameEs&isActive=eq.true&order=nameIt.asc`, { headers }).then((response) => response.ok ? response.json() : []),
      fetch(`${supabaseUrl}/rest/v1/product_plant_materials?select=productId,plantSlug&order=plantSlug.asc`, { headers }).then((response) => response.ok ? response.json() : []),
    ]).then(([items, categoryRows, materialRows, materialLinks]: [ProductView[], CategoryView[], PlantMaterialView[], ProductPlantLink[]]) => {
      const linksByProduct = new Map<number, string[]>();
      materialLinks.forEach((link) => linksByProduct.set(link.productId, [...(linksByProduct.get(link.productId) || []), link.plantSlug]));
      setProducts(items.map((item) => ({ ...item, plantSlugs: linksByProduct.get(item.id) || [] })));
      setCatalogCategories(categoryRows);
      setPlantMaterials(materialRows);
    }).catch(() => { setProducts([]); setCatalogCategories([]); setPlantMaterials([]); });
  }, []);

  useEffect(() => {
    fetch(`${supabaseUrl}/rest/v1/nutrition_articles?select=id,slug,titleIt,bodyIt,titleEn,bodyEn,titleEs,bodyEs,imageUrl&isPublished=eq.1&order=createdAt.desc`, { headers: { apikey: supabasePublishableKey, Authorization: `Bearer ${supabasePublishableKey}` } }).then((response) => response.ok ? response.json() : []).then((items: NutritionArticleView[]) => setArticles(items)).catch(() => setArticles([]));
  }, []);

  useEffect(() => {
    let cancelled = false;
    const stored = localStorage.getItem("renacer_language");
    if (stored === "it" || stored === "en" || stored === "es") { setLanguage(stored); return () => { cancelled = true; }; }
    const browserLanguage = (navigator.language || "it").slice(0, 2) as Language;
    fetch("/api/locale").then((response) => response.json()).then((geo: { language?: Language | null }) => {
      if (!cancelled) setLanguage(geo.language ?? (["it", "en", "es"].includes(browserLanguage) ? browserLanguage : "it"));
    }).catch(() => { if (!cancelled && ["it", "en", "es"].includes(browserLanguage)) setLanguage(browserLanguage); });
    return () => { cancelled = true; };
  }, []);

  const closeMenu = () => setMenuOpen(false);
  const categoryLabel = (item: CategoryView) => language === "en" ? item.nameEn || item.nameIt : language === "es" ? item.nameEs || item.nameIt : item.nameIt;
  const usedCategorySlugs = new Set(products.map((item) => item.categorySlug));
  const categoryOptions = catalogCategories.filter((item) => usedCategorySlugs.has(item.slug));
  const visibleProducts = products.filter((item) => {
    const searchable = `${item.nameIt} ${item.descriptionIt} ${item.nameEn || ""} ${item.nameEs || ""}`.toLowerCase();
    return (!search.trim() || searchable.includes(search.toLowerCase())) && (selectedCategory === "all" || item.categorySlug === selectedCategory);
  });

  return (
    <div className="site-shell">
      <div className="topline">
        <div className="container topline__inner">
          <span>{t("kicker")}</span>
          <span className="topline__note"><Moon size={13} /> {language === "en" ? "made slowly, without complication" : language === "es" ? "hecho con calma, sin complicaciones" : "fatto con calma, senza complicazioni"}</span>
        </div>
      </div>

      <header className="site-header">
        <div className="container header__inner">
          <a className="brand" href="#top" onClick={closeMenu} aria-label="Renacer · Ibiza, pagina iniziale">
            <img className="brand-logo-image" src={assetUrl("/images/logo-woman.png")} alt="Logo Renacer" />
            <span className="brand__text">
              <strong>Renacer</strong>
              <small>Ibiza · {language === "en" ? "artisan care" : language === "es" ? "cuidado artesanal" : "cura artigianale"}</small>
            </span>
          </a>

          <button
            className="menu-toggle"
            type="button"
            aria-label={menuOpen ? "Chiudi menu" : "Apri menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <nav className={menuOpen ? "main-nav main-nav--open" : "main-nav"} aria-label="Navigazione principale">
            {[
              { label: t("project"), href: "#progetto" },
              { label: t("nutrition"), href: "/nutrition" },
              { label: t("plants"), href: "/plants" },
              { label: t("catalog"), href: "#catalogo" },
              { label: t("contact"), href: "#contatti" },
            ].map((item) => (
              <a key={item.href} href={item.href} onClick={closeMenu}>{item.label}</a>
            ))}
            <a className="nav-whatsapp" href={whatsappLink} target="_blank" rel="noreferrer" onClick={closeMenu}>
              <MessageCircle size={16} /> {t("whatsapp")}
            </a>
            <div className="language-switcher" aria-label={t("languageNote")}>
              <Languages size={15} />
              {(Object.keys(languageLabels) as Language[]).map((option) => (
                <button key={option} type="button" className={language === option ? "language-switcher__option is-active" : "language-switcher__option"} onClick={() => { localStorage.setItem("renacer_language", option); setLanguage(option); }}>{languageLabels[option]}</button>
              ))}
            </div>
          </nav>
        </div>
      </header>

      <main id="top">
        <section className="hero container">
          <div className="hero__copy">
            <div className="hero__kicker"><span className="kicker-line" /> {t("kicker")}</div>
            <h1>{t("heroTitle")} <em>{t("heroAccent")}</em></h1>
            <p className="hero__lead">
              {t("heroLead")}
            </p>
            <div className="hero__actions">
              <a className="button button--primary" href="#catalogo">
                {t("discover")} <ArrowDown size={17} />
              </a>
              <a className="text-link" href={whatsappLink} target="_blank" rel="noreferrer">
                <MessageCircle size={18} /> {t("talk")}
              </a>
            </div>
            <div className="hero__signature">
              <span>Ibiza</span><span className="signature-dot" /><span>{language === "en" ? "personal production" : language === "es" ? "producción personal" : "produzione personale"}</span><span className="signature-dot" /><span>{language === "en" ? "catalogue in preparation" : language === "es" ? "catálogo en preparación" : "catalogo in preparazione"}</span>
            </div>
          </div>
          <div className="hero__visual">
            <div className="hero__visual-label hero__visual-label--top">Il ritmo di Ibiza</div>
            <img className="hero__photo" src={assetUrl("/images/renacer-collection.webp")} alt="Fotografia del progetto Renacer a Ibiza" />
            <div className="hero__visual-label hero__visual-label--bottom"><Sprout size={15} /> piante, mani, tempo</div>
          </div>
        </section>

        <section className="intro-band">
          <div className="container intro-band__inner">
            <div className="intro-band__line" />
            <p>{t("band")} <strong>{t("bandAccent")}</strong></p>
            <div className="intro-band__line" />
          </div>
        </section>

        <section className="catalog-section catalog-section--early" id="catalogo">
          <div className="container">
            <div className="catalog-heading">
              <div>
                <SectionEyebrow icon={<PackageOpen size={14} />}>{t("catalogEyebrow")}</SectionEyebrow>
                <h2>{t("catalogTitle")}<br /><em>{t("catalogAccent")}</em></h2>
              </div>
              <p>{t("catalogBody")}</p>
            </div>
            <div className="catalog-filters">
              <label className="catalog-search"><span className="sr-only">{language === "en" ? "Search products" : language === "es" ? "Buscar productos" : "Cerca prodotti"}</span><input aria-label={language === "en" ? "Search products" : language === "es" ? "Buscar productos" : "Cerca prodotti"} placeholder={language === "en" ? "Search products" : language === "es" ? "Buscar productos" : "Cerca prodotti"} value={search} onChange={(event) => setSearch(event.target.value)} /></label>
              <div className="category-filters" aria-label={t("allCategories")}>
                <button type="button" className={selectedCategory === "all" ? "is-active" : ""} onClick={() => setSelectedCategory("all")}>{t("allCategories")}</button>
                {categoryOptions.map((category) => <button key={category.slug} type="button" className={selectedCategory === category.slug ? "is-active" : ""} onClick={() => setSelectedCategory(category.slug)}>{categoryLabel(category)}</button>)}
              </div>
            </div>
            {visibleProducts.length > 0 ? <div className="product-grid">{visibleProducts.map((item) => <ProductCard key={item.id} product={item} language={language} ctaLabel={t("askNow")} inciLabel={t("inci")} rawMaterialsLabel={t("rawMaterials")} plantMaterials={plantMaterials.filter((material) => item.plantSlugs?.includes(material.slug))} categoryLabel={categoryOptions.find((category) => category.slug === item.categorySlug) ? categoryLabel(categoryOptions.find((category) => category.slug === item.categorySlug)!) : item.category} />)}</div> : products.length > 0 ? <p className="catalog-no-results">{t("searchEmpty")}</p> : <div className="empty-catalog">
              <div className="empty-catalog__mark"><Leaf size={32} strokeWidth={1.1} /></div>
              <div><span className="empty-catalog__eyebrow">{t("emptyEyebrow")}</span><h3>{t("emptyTitle")}</h3><p>{t("emptyBody")}</p></div>
              <a className="button button--outline" href={whatsappLink} target="_blank" rel="noreferrer">{t("ask")} <ArrowUpRight size={17} /></a>
            </div>}
            <div className="catalog-footnote"><ShieldCheck size={15} /> {products.length > 0 ? (language === "en" ? "Ask on WhatsApp about details and availability." : language === "es" ? "Pregunta por WhatsApp sobre detalles y disponibilidad." : "Chiedi su WhatsApp informazioni e disponibilità.") : (language === "en" ? "Products will appear here when Barbara adds them." : language === "es" ? "Los productos aparecerán aquí cuando Barbara los añada." : "I prodotti appariranno qui quando Barbara li aggiungerà.")}</div>
          </div>
        </section>

        <section className="story-section container" id="progetto">
          <div className="story-section__heading">
            <SectionEyebrow icon={<Leaf size={14} />}>{t("projectEyebrow")}</SectionEyebrow>
            <h2>{t("projectTitle")}</h2>
          </div>
          <div className="story-section__body">
            <p className="story-section__lead">{t("storyLead")}</p>
            <p>{t("storyBody")}</p>
            <a className="arrow-link" href="/nutrition">{t("storyLink")} <ArrowUpRight size={16} /></a>
          </div>
        </section>

        <section className="values-section">
          <div className="container values-grid">
            <article className="value-card value-card--warm">
              <div className="value-card__icon"><Heart size={18} /></div>
              <span>01</span>
              <h3>{language === "en" ? "Personal" : language === "es" ? "Personal" : "Personale"}</h3>
              <p>{language === "en" ? "A living project, close to people and to the person carrying it forward." : language === "es" ? "Un proyecto vivo, cercano a las personas y a quien lo lleva adelante." : "Un progetto in evoluzione, vicino alle persone e alla realtà di chi lo porta avanti."}</p>
            </article>
            <article className="value-card value-card--green">
              <div className="value-card__icon"><Sprout size={18} /></div>
              <span>02</span>
              <h3>{language === "en" ? "Essential" : language === "es" ? "Esencial" : "Essenziale"}</h3>
              <p>{language === "en" ? "Ingredients and words chosen with care, leaving room for simplicity." : language === "es" ? "Ingredientes y palabras elegidos con cuidado, dejando espacio a la sencillez." : "Ingredienti e parole scelti con cura, lasciando spazio alla semplicità."}</p>
            </article>
            <article className="value-card value-card--cream">
              <div className="value-card__icon"><Compass size={18} /></div>
              <span>03</span>
              <h3>{language === "en" ? "Listening" : language === "es" ? "Escucha" : "In ascolto"}</h3>
              <p>{language === "en" ? "A catalogue that grows with real work, never the other way around." : language === "es" ? "Un catálogo que crece con el trabajo real, y no al contrario." : "Un catalogo che crescerà nel tempo, seguendo il lavoro reale e non il contrario."}</p>
            </article>
          </div>
        </section>

        <section className="nutrition-section container" id="nutrizione">
          <div className="nutrition-section__visual">
            <div className="nutrition-orbit nutrition-orbit--one" />
            <div className="nutrition-orbit nutrition-orbit--two" />
            <div className="nutrition-symbol"><Leaf size={34} strokeWidth={1.25} /></div>
            <span className="nutrition-note nutrition-note--one">alimentazione naturale</span>
            <span className="nutrition-note nutrition-note--two">cura dentro e fuori</span>
          </div>
          <div className="nutrition-section__copy">
            <SectionEyebrow icon={<BookOpen size={14} />}>{t("nutritionEyebrow")}</SectionEyebrow>
            <h2>{t("nutritionTitle")}</h2>
            <p>{t("nutritionBody")}</p>
            {articles.length > 0 ? <div className="nutrition-home-articles">{articles.slice(0, 2).map((item) => {
              const title = articleTitleFor(item, language);
              const body = articleBodyFor(item, language);
              return <article key={item.id} className="nutrition-preview">
                <a className="nutrition-preview__image" href={`/nutrition/${encodeURIComponent(item.slug)}`} aria-label={`${t("learnMore")}: ${title}`}>
                  {item.imageUrl ? <img src={item.imageUrl} alt={title} loading="lazy" /> : <span><Leaf size={23} /></span>}
                </a>
                <div><span className="nutrition-preview__label">Renacer · Nutrition</span><h3>{title}</h3><p>{articleExcerpt(body)}</p><a className="nutrition-preview__link" href={`/nutrition/${encodeURIComponent(item.slug)}`}>{t("learnMore")} <ArrowUpRight size={14} /></a></div>
              </article>;
            })}</div> : <div className="future-list">
              <div><Check size={16} /> {t("futureOne")}</div>
              <div><Check size={16} /> {t("futureTwo")}</div>
              <div><Check size={16} /> {t("futureThree")}</div>
            </div>}
            <a className="arrow-link nutrition-all-articles" href="/nutrition">{t("allArticles")} <ArrowUpRight size={15} /></a>
          </div>
        </section>

        <section className="offers-section container" id="offerte">
          <div className="offers-section__copy">
            <SectionEyebrow icon={<Sparkles size={14} />}>{language === "en" ? "Later on" : language === "es" ? "Más adelante" : "Più avanti"}</SectionEyebrow>
            <h2>{language === "en" ? "Small rituals," : language === "es" ? "Pequeños rituales," : "Piccoli rituali,"}<br /><em>{language === "en" ? "as an offering." : language === "es" ? "en forma de oferta." : "in forma di offerta."}</em></h2>
            <p>{language === "en" ? "A space ready for seasonal bundles, gift ideas and special offers when the time is right." : language === "es" ? "Un espacio preparado para paquetes de temporada, ideas de regalo y propuestas especiales cuando llegue el momento." : "Uno spazio pronto per accogliere pacchetti stagionali, idee regalo e proposte speciali quando sarà il momento."}</p>
            <div className="offers-tag"><CircleDot size={13} /> {language === "en" ? "no active offers" : language === "es" ? "ninguna oferta activa" : "nessuna offerta attiva"}</div>
          </div>
          <div className="offers-section__shape" aria-hidden="true">
            <div className="offers-sun" />
            <div className="offers-leaf offers-leaf--one" />
            <div className="offers-leaf offers-leaf--two" />
            <div className="offers-stem" />
            <span>spazio futuro<br />per le collezioni</span>
          </div>
        </section>

        <section className="contact-section" id="contatti">
          <div className="container contact-section__inner">
            <div className="contact-section__copy">
              <SectionEyebrow icon={<MessageCircle size={14} />}>{language === "en" ? "The simplest way" : language === "es" ? "La forma más sencilla" : "Il modo più semplice"}</SectionEyebrow>
              <h2>{t("contactTitle")}<br /><em>{t("contactAccent")}</em></h2>
              <p>{t("contactBody")}</p>
              <a className="button button--light" href={whatsappLink} target="_blank" rel="noreferrer">
                <MessageCircle size={18} /> {t("openWhatsapp")} <ArrowUpRight size={16} />
              </a>
            </div>
            <div className="contact-card">
              <BotanicalMark />
              <p>Renacer<br /><span>Ibiza</span></p>
              <div className="contact-card__rule" />
              <small>Una pagina personale.<br />Un contatto diretto.</small>
            </div>
          </div>
        </section>

        <section className="portrait-placeholder container" id="barbara">
          <div className="portrait-placeholder__frame">
            <img src={assetUrl("/images/barbara.jpg")} alt="Barbara, fondatrice di Renacer · Ibiza" className="portrait-placeholder__image" />
            <div className="portrait-placeholder__caption">Renacer<br /><span>Ibiza</span></div>
          </div>
          <div className="portrait-placeholder__copy">
            <SectionEyebrow icon={<Heart size={14} />}>{t("portraitEyebrow")}</SectionEyebrow>
            <h2>{t("portraitTitle")}<br /><em>{t("portraitAccent")}</em></h2>
            <p>{t("portraitBody")}</p>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container footer__top">
          <a className="brand brand--footer" href="#top">
            <img className="brand-logo-image" src={assetUrl("/images/logo-woman.png")} alt="Logo Renacer" />
            <span className="brand__text"><strong>Renacer</strong><small>Ibiza · {language === "en" ? "artisan care" : language === "es" ? "cuidado artesanal" : "cura artigianale"}</small></span>
          </a>
          <div className="footer__links">
            <a href="#progetto">{t("project")}</a>
            <a href="/nutrition">{t("nutrition")}</a>
            <a href="/plants">{t("plants")}</a>
            <a href="#catalogo">{t("catalog")}</a>
            <a href="#contatti">{t("contact")}</a>
          </div>
          <div className="footer__details">
            <span><MapPin size={14} /> Ibiza, Spagna</span>
            <a href={whatsappLink} target="_blank" rel="noreferrer"><Mail size={14} /> WhatsApp</a>
          </div>
        </div>
        <div className="container footer__bottom">
          <span>© {new Date().getFullYear()} Renacer · Ibiza</span>
          <span>piante, mani e tempo · <a href="/admin">Gestione catalogo</a></span>
        </div>
      </footer>
    </div>
  );
}
