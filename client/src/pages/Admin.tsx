import { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Info,
  Leaf,
  LockKeyhole,
  LogOut,
  Package,
  Pencil,
  Plus,
  Save,
  Sparkles,
} from "lucide-react";

type Product = {
  id: number;
  nameIt: string;
  descriptionIt: string;
  nameEn: string | null;
  descriptionEn: string | null;
  nameEs: string | null;
  descriptionEs: string | null;
  priceCents: number;
  currency: string;
  category: string;
  imageUrl: string | null;
  whatsappMessage: string | null;
  isPublished: number;
};
type Article = {
  id: number;
  titleIt: string;
  bodyIt: string;
  titleEn: string | null;
  bodyEn: string | null;
  titleEs: string | null;
  bodyEs: string | null;
  imageUrl: string | null;
  isPublished: number;
};

const supabaseUrl = "https://dybqvnthmfeatwfpysrv.supabase.co";
const supabaseKey = "sb_publishable_tOmI-rgVzQ7FHs56gJ-JhQ_zrYgZQOd";
const adminFunctionUrl = supabaseUrl + "/functions/v1/renacer-admin";

function request(path: string, init: RequestInit = {}) {
  return fetch(supabaseUrl + path, {
    ...init,
    headers: {
      apikey: supabaseKey,
      Authorization: "Bearer " + supabaseKey,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
}

async function adminRequest(action: string, payload: Record<string, unknown> = {}) {
  const token = sessionStorage.getItem("renacer_admin_token") || "";
  const response = await fetch(adminFunctionUrl, {
    method: "POST",
    headers: {
      apikey: supabaseKey,
      Authorization: "Bearer " + supabaseKey,
      "Content-Type": "application/json",
      "x-renacer-token": token,
    },
    body: JSON.stringify({ action, ...payload }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Operazione non disponibile");
  return data;
}

const blankProduct = { name: "", description: "", price: "", category: "Altro", imageUrl: "", whatsappMessage: "" };
const blankArticle = { title: "", body: "", imageUrl: "" };

function AdminHeader({ onLogout }: { onLogout?: () => void }) {
  return (
    <header className="admin-header">
      <Link className="admin-back" href="/">
        <ArrowLeft size={15} />
        <span>Torna al sito</span>
      </Link>
      <div className="admin-brand">
        <span className="admin-brand__mark"><Leaf size={17} /></span>
        <span>
          <strong>Renacer</strong>
          <small>Area riservata</small>
        </span>
      </div>
      {onLogout ? (
        <button className="admin-lock" type="button" onClick={onLogout}>
          <LogOut size={14} />
          <span>Esci</span>
        </button>
      ) : (
        <span className="admin-status"><span /> Accesso protetto</span>
      )}
    </header>
  );
}

export default function Admin() {
  const [pin, setPin] = useState("");
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem("renacer_admin_token") === "ok");
  const [pinError, setPinError] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [product, setProduct] = useState(blankProduct);
  const [article, setArticle] = useState(blankArticle);
  const [editingProduct, setEditingProduct] = useState<number | null>(null);
  const [editingArticle, setEditingArticle] = useState<number | null>(null);
  const [notice, setNotice] = useState("");

  const load = async () => {
    const [productsResponse, articlesResponse] = await Promise.all([
      request("/rest/v1/products?select=*&order=createdAt.desc"),
      request("/rest/v1/nutrition_articles?select=*&order=createdAt.desc"),
    ]);
    if (productsResponse.ok) setProducts(await productsResponse.json());
    if (articlesResponse.ok) setArticles(await articlesResponse.json());
  };

  useEffect(() => {
    if (unlocked) void load();
  }, [unlocked]);

  const login = async () => {
    setPinError("");
    try {
      await adminRequest("login", { pin });
      sessionStorage.setItem("renacer_admin_token", "ok");
      setUnlocked(true);
    } catch {
      setPinError("Codice PIN non valido.");
    }
  };

  const translate = async () => {
    if (!product.name.trim() || !product.description.trim()) {
      setError("Inserisci prima nome e descrizione in italiano.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await adminRequest("translate", { sourceLanguage: "it", name: product.name, description: product.description });
      if (!result?.it || !result?.en || !result?.es) throw new Error();
      setNotice("Traduzioni automatiche pronte per il controllo.");
    } catch {
      setError("Traduzione automatica non disponibile. Riprova tra poco.");
    } finally {
      setBusy(false);
    }
  };

  const saveProduct = async () => {
    if (!product.name.trim() || !product.description.trim()) {
      setError("Nome e descrizione in italiano sono obbligatori.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const translated = await adminRequest("translate", { sourceLanguage: "it", name: product.name, description: product.description }).catch(() => null);
      const data = {
        sourceLanguage: "it",
        nameIt: product.name.trim(),
        descriptionIt: product.description.trim(),
        nameEn: translated?.en?.name || null,
        descriptionEn: translated?.en?.description || null,
        nameEs: translated?.es?.name || null,
        descriptionEs: translated?.es?.description || null,
        priceCents: Math.round((Number(product.price) || 0) * 100),
        currency: "EUR",
        category: product.category.trim() || "Altro",
        imageUrl: product.imageUrl.trim() || null,
        whatsappMessage: product.whatsappMessage.trim() || null,
        isPublished: 1,
      };
      const response = editingProduct
        ? await request("/rest/v1/products?id=eq." + editingProduct, { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify(data) })
        : await request("/rest/v1/products", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify({ ...data, slug: product.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") + "-" + Date.now() }) });
      if (!response.ok) throw new Error("Salvataggio fallito");
      await load();
      setProduct(blankProduct);
      setEditingProduct(null);
      setNotice("Prodotto salvato e pubblicato.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Salvataggio fallito");
    } finally {
      setBusy(false);
    }
  };

  const saveArticle = async () => {
    if (!article.title.trim() || !article.body.trim()) {
      setError("Titolo e testo dell'articolo sono obbligatori.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const translated = await adminRequest("translate", { sourceLanguage: "it", name: article.title, description: article.body }).catch(() => null);
      const data = {
        slug: article.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") + "-" + Date.now(),
        titleIt: article.title.trim(),
        bodyIt: article.body.trim(),
        titleEn: translated?.en?.name || null,
        bodyEn: translated?.en?.description || null,
        titleEs: translated?.es?.name || null,
        bodyEs: translated?.es?.description || null,
        imageUrl: article.imageUrl.trim() || null,
        isPublished: 1,
      };
      const response = editingArticle
        ? await request("/rest/v1/nutrition_articles?id=eq." + editingArticle, { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify(data) })
        : await request("/rest/v1/nutrition_articles", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify(data) });
      if (!response.ok) throw new Error("Salvataggio articolo fallito");
      await load();
      setArticle(blankArticle);
      setEditingArticle(null);
      setNotice("Articolo Nutrition pubblicato.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Salvataggio articolo fallito");
    } finally {
      setBusy(false);
    }
  };

  const logout = () => {
    sessionStorage.removeItem("renacer_admin_token");
    setUnlocked(false);
  };

  if (!unlocked) {
    return (
      <div className="admin-shell">
        <AdminHeader />
        <main className="admin-main admin-login admin-pin-login">
          <span className="admin-eyebrow"><LockKeyhole size={13} /> Area privata</span>
          <h1>Pronta a<br /><em>ripartire.</em></h1>
          <p>Accedi alla gestione di Renacer per pubblicare prodotti e articoli. Il sito pubblico resta sempre aggiornato con ciò che salvi qui.</p>
          <form className="admin-pin-form" onSubmit={(event) => { event.preventDefault(); void login(); }}>
            <label>Codice PIN<input type="password" value={pin} onChange={(event) => setPin(event.target.value)} autoFocus inputMode="numeric" /></label>
            {pinError && <p className="admin-error">{pinError}</p>}
            <button className="admin-primary" type="submit"><LockKeyhole size={14} /> Entra nell'area</button>
          </form>
        </main>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <AdminHeader onLogout={logout} />
      <main className="admin-main">
        <div className="admin-intro">
          <div>
            <span className="admin-eyebrow"><Sparkles size={13} /> Studio Renacer</span>
            <h1>Gestione<br /><em>del catalogo.</em></h1>
            <p>Un piccolo spazio per curare i prodotti, raccontare il progetto e mantenere il catalogo sempre vivo. Scrivi in italiano: le traduzioni per i visitatori vengono preparate automaticamente.</p>
          </div>
          <div className="admin-intro__note"><Info size={16} /><span><strong>Consiglio</strong><br />Completa nome, descrizione e prezzo prima di pubblicare.</span></div>
        </div>

        {error && <p className="admin-error admin-alert"><Info size={14} /> {error}</p>}
        {notice && <p className="admin-success admin-alert"><CheckCircle2 size={14} /> {notice}</p>}

        <section className="admin-card">
          <div className="admin-card__top"><div><span className="admin-card__number">01 / CATALOGO</span><h2>{editingProduct ? "Modifica prodotto" : "Nuovo prodotto"}</h2></div><span className="admin-badge"><Package size={12} /> Pubblicazione immediata</span></div>
          <div className="admin-language-tabs"><button className="is-active" type="button"><Leaf size={13} /> Italiano</button><button type="button" disabled>EN <small>automatico</small></button><button type="button" disabled>ES <small>automatico</small></button></div>
          <div className="admin-form-grid">
            <label>Nome del prodotto<input value={product.name} onChange={(event) => setProduct({ ...product, name: event.target.value })} placeholder="Es. Olio botanico" /></label>
            <label>Descrizione in italiano<textarea value={product.description} onChange={(event) => setProduct({ ...product, description: event.target.value })} rows={5} placeholder="Racconta il prodotto con parole semplici..." /></label>
          </div>
          <div className="admin-extra-grid">
            <label>Prezzo (EUR)<input type="number" min="0" step="0.01" value={product.price} onChange={(event) => setProduct({ ...product, price: event.target.value })} placeholder="0,00" /></label>
            <label>Categoria<select value={product.category} onChange={(event) => setProduct({ ...product, category: event.target.value })}><option>Altro</option><option>Cura del viso</option><option>Cura del corpo</option><option>Oli e balsami</option><option>Regali</option><option>Novità</option></select></label>
          </div>
          <div className="admin-form-grid admin-form-grid--compact">
            <label><span><ImageIcon size={12} /> URL immagine</span><input value={product.imageUrl} onChange={(event) => setProduct({ ...product, imageUrl: event.target.value })} placeholder="https://..." /></label>
            <label><span>Messaggio WhatsApp opzionale</span><input value={product.whatsappMessage} onChange={(event) => setProduct({ ...product, whatsappMessage: event.target.value })} placeholder="Es. Ciao Barbara, vorrei saperne di più..." /></label>
          </div>
          <div className="admin-card__bottom"><p><span className="admin-dot" /> I campi in italiano sono la fonte del catalogo</p><div className="admin-actions"><button className="admin-secondary" type="button" onClick={() => void translate()} disabled={busy}><Sparkles size={14} /> Prepara traduzioni</button><button className="admin-primary" type="button" onClick={() => void saveProduct()} disabled={busy}>{editingProduct ? <Pencil size={14} /> : <Save size={14} />}{editingProduct ? "Aggiorna prodotto" : "Salva e pubblica"}</button></div></div>
        </section>

        <section className="admin-card admin-article-card">
          <div className="admin-card__top"><div><span className="admin-card__number">02 / NUTRIZIONE</span><h2>{editingArticle ? "Modifica articolo" : "Nuovo articolo"}</h2></div><span className="admin-badge"><BookOpen size={12} /> Journal Renacer</span></div>
          <div className="admin-form-grid"><label>Titolo dell'articolo<input value={article.title} onChange={(event) => setArticle({ ...article, title: event.target.value })} placeholder="Es. Una cura più ampia" /></label><label>Testo dell'articolo<textarea value={article.body} onChange={(event) => setArticle({ ...article, body: event.target.value })} rows={6} placeholder="Scrivi una nota per la sezione Nutrizione..." /></label></div>
          <div className="admin-extra-grid"><label><span><ImageIcon size={12} /> URL immagine</span><input value={article.imageUrl} onChange={(event) => setArticle({ ...article, imageUrl: event.target.value })} placeholder="https://..." /></label></div>
          <div className="admin-card__bottom"><p><FileText size={14} /> Pubblicato nella sezione Nutrizione</p><button className="admin-primary" type="button" onClick={() => void saveArticle()} disabled={busy}>{editingArticle ? <Pencil size={14} /> : <Plus size={14} />}{editingArticle ? "Aggiorna articolo" : "Pubblica articolo"}</button></div>
        </section>

        <section className="admin-products">
          <div className="admin-products__heading"><div><span className="admin-eyebrow"><Package size={13} /> Catalogo live</span><h2>Prodotti pubblicati <small>({products.length})</small></h2></div><a href="/" target="_blank" rel="noreferrer" className="text-link">Apri il sito <ExternalLink size={14} /></a></div>
          {products.length === 0 ? <div className="admin-empty">Nessun prodotto pubblicato. Il catalogo è pronto per il primo rituale.</div> : <div className="admin-products-list">{products.map((item) => <div className="admin-product-row" key={item.id}><div className="admin-product-row__identity">{item.imageUrl ? <img className="admin-product-thumb" src={item.imageUrl} alt="" /> : <span className="admin-product-thumb admin-product-thumb--empty"><Leaf size={18} /></span>}<div><strong>{item.nameIt}</strong><span>{item.category} · {(item.priceCents / 100).toFixed(2)} EUR</span></div></div><span className="admin-published"><CheckCircle2 size={13} /> Online</span><button className="admin-edit" type="button" aria-label={`Modifica ${item.nameIt}`} onClick={() => { setEditingProduct(item.id); setProduct({ name: item.nameIt, description: item.descriptionIt, price: String(item.priceCents / 100), category: item.category || "Altro", imageUrl: item.imageUrl || "", whatsappMessage: item.whatsappMessage || "" }); window.scrollTo({ top: 0, behavior: "smooth" }); }}><Pencil size={15} /></button></div>)}</div>}
        </section>

        <section className="admin-products admin-articles-list">
          <div className="admin-products__heading"><div><span className="admin-eyebrow"><BookOpen size={13} /> Journal live</span><h2>Articoli pubblicati <small>({articles.length})</small></h2></div></div>
          {articles.length === 0 ? <div className="admin-empty">Non ci sono ancora articoli pubblicati.</div> : <div className="admin-products-list">{articles.map((item) => <div className="admin-product-row" key={item.id}><div><strong>{item.titleIt}</strong><span>Articolo Nutrition</span></div><span className="admin-published"><CheckCircle2 size={13} /> Online</span><button className="admin-edit" type="button" aria-label={`Modifica ${item.titleIt}`} onClick={() => { setEditingArticle(item.id); setArticle({ title: item.titleIt, body: item.bodyIt, imageUrl: item.imageUrl || "" }); window.scrollTo({ top: 0, behavior: "smooth" }); }}><Pencil size={15} /></button></div>)}</div>}
        </section>
      </main>
    </div>
  );
}
