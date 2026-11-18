import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Check,
  Languages,
  Leaf,
  LogOut,
  Pencil,
  Save,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { Link } from "wouter";

type Lang = "it" | "en" | "es";
type Translation = { name: string; description: string };
type Product = {
  id: number;
  sourceLanguage: Lang;
  nameIt: string;
  descriptionIt: string;
  nameEn: string | null;
  descriptionEn: string | null;
  nameEs: string | null;
  descriptionEs: string | null;
  imageUrl: string | null;
  whatsappMessage: string | null;
  isPublished: number;
};

const labels: Record<Lang, string> = { it: "Italiano", en: "English", es: "Español" };
const emptyTranslations: Record<Lang, Translation> = {
  it: { name: "", description: "" },
  en: { name: "", description: "" },
  es: { name: "", description: "" },
};
const supabaseUrl = "https://dybqvnthmfeatwfpysrv.supabase.co";
const supabasePublishableKey = "sb_publishable_tOmI-rgVzQ7FHs56gJ-JhQ_zrYgZQOd";
const adminPinHash = "b7666a4d61f732c65c3bdd5317d8e5a75cf4bf7bc69b493074e6d42322b42993";
const staticSessionKey = "renacer-static-admin";
const whatsappNumber = "34646072140";
const adminFunctionUrl = "https://dybqvnthmfeatwfpysrv.supabase.co/functions/v1/renacer-admin";
async function adminRequest(action: string, payload: Record<string, unknown> = {}) {
  const token = sessionStorage.getItem("renacer_admin_token") || "";
  const response = await fetch(adminFunctionUrl, { method: "POST", headers: { apikey: supabasePublishableKey, Authorization: `Bearer ${supabasePublishableKey}`, "Content-Type": "application/json", "x-renacer-token": token }, body: JSON.stringify({ action, ...payload }) });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || "Operazione non disponibile.");
  return result;
}

const MAX_COMPRESSED_IMAGE_CHARS = 500_000;

function qrFor(name: string, message?: string | null) {
  const link = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message || `Ciao Barbara, vorrei informazioni per: ${name}`)}`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=10&data=${encodeURIComponent(link)}`;
}

function supabaseRequest(path: string, init: RequestInit = {}) {
  return fetch(`${supabaseUrl}${path}`, {
    ...init,
    headers: {
      apikey: supabasePublishableKey,
      Authorization: `Bearer ${supabasePublishableKey}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
}

async function sha256(value: string) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function compressProductImage(file: File) {
  const supportedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!supportedTypes.includes(file.type)) throw new Error("Scegli una foto JPEG, PNG o WebP.");
  if (file.size > 15 * 1024 * 1024) throw new Error("La foto originale deve essere inferiore a 15 MB.");

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("Non riesco ad aprire questa foto."));
      element.src = objectUrl;
    });

    let maxDimension = 1400;
    let quality = 0.76;
    for (let attempt = 0; attempt < 9; attempt += 1) {
      const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Il browser non può preparare questa foto.");
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const result = canvas.toDataURL("image/jpeg", quality);
      if (result.length <= MAX_COMPRESSED_IMAGE_CHARS) return result;
      if (quality > 0.5) quality -= 0.08;
      else maxDimension = Math.max(640, Math.floor(maxDimension * 0.8));
    }
    throw new Error("La foto resta troppo grande dopo la compressione. Prova una foto più piccola.");
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function isTranslationSet(value: unknown): value is Record<Lang, Translation> {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<Record<Lang, Partial<Translation>>>;
  return (["it", "en", "es"] as Lang[]).every((lang) =>
    Boolean(record[lang]?.name?.trim() && record[lang]?.description?.trim()),
  );
}

export default function Admin() {
  const [unlocked, setUnlocked] = useState<boolean | null>(null);
  const [staticMode, setStaticMode] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [active, setActive] = useState<Lang>("it");
  const [sourceLanguage, setSourceLanguage] = useState<Lang>("it");
  const [translations, setTranslations] = useState<Record<Lang, Translation>>(emptyTranslations);
  const [manualTranslations, setManualTranslations] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [whatsappMessage, setWhatsappMessage] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [products, setProducts] = useState<Product[]>([]);

  const loadProducts = async () => {
    const response = await supabaseRequest(
      "/rest/v1/products?select=id,sourceLanguage,nameIt,descriptionIt,nameEn,descriptionEn,nameEs,descriptionEs,imageUrl,whatsappMessage,isPublished&order=createdAt.desc",
    );
    if (!response.ok) throw new Error(`Supabase indisponibile (${response.status})`);
    setProducts((await response.json()) as Product[]);
  };

  useEffect(() => {
    fetch("/api/admin/session")
      .then(async (response) => {
        if (response.ok) {
          const data = (await response.json()) as { unlocked?: boolean };
          setUnlocked(Boolean(data.unlocked));
          return;
        }
        setStaticMode(true);
        setUnlocked(sessionStorage.getItem(staticSessionKey) === "1");
      })
      .catch(() => {
        setStaticMode(true);
        setUnlocked(sessionStorage.getItem(staticSessionKey) === "1");
      });
  }, []);

  useEffect(() => {
    if (unlocked) void loadProducts().catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Impossibile caricare il catalogo."));
  }, [unlocked]);

  const resetForm = () => {
    setTranslations({ it: { name: "", description: "" }, en: { name: "", description: "" }, es: { name: "", description: "" } });
    setImageUrl("");
    setWhatsappMessage("");
    setEditingId(null);
    setError("");
    setManualTranslations(false);
    setActive("it");
    setSourceLanguage("it");
  };

  const unlock = async () => {
    setPinError("");
    try {
      const result = await adminRequest("login", { pin });
      sessionStorage.setItem("renacer_admin_token", result.token);
      setStaticMode(true);
      setUnlocked(true);
      setPin("");
      return;
    } catch {
      // Keep the local fallback only if Supabase is temporarily unavailable.
    }
    if ((await sha256(pin.trim())) !== adminPinHash) {
      setPinError("PIN non valido. Riprova.");
      setPin("");
      return;
    }
    sessionStorage.setItem(staticSessionKey, "1");
    setUnlocked(true);
    setPin("");
  };

  const lock = async () => {
    if (!staticMode) await fetch("/api/admin/lock", { method: "POST" }).catch(() => undefined);
    sessionStorage.removeItem(staticSessionKey);
    sessionStorage.removeItem("renacer_admin_token");
    setUnlocked(false);
    resetForm();
  };

  const setActiveField = (field: keyof Translation, value: string) => {
    if (active === sourceLanguage) setManualTranslations(false);
    setTranslations((current) => {
      const next = { ...current, [active]: { ...current[active], [field]: value } };
      if (active === sourceLanguage) {
        for (const language of ["it", "en", "es"] as Lang[]) {
          if (language !== sourceLanguage) next[language] = { name: "", description: "" };
        }
      }
      return next;
    });
  };

  const prepareTranslations = async () => {
    const source = translations[sourceLanguage];
    if (!source.name.trim() || !source.description.trim()) {
      setError(`Inserisci nome e descrizione in ${labels[sourceLanguage]}.`);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result: unknown = await adminRequest("translate", { sourceLanguage, name: source.name, description: source.description });
      if (!isTranslationSet(result)) throw new Error("La risposta non contiene tutte le traduzioni.");
      setTranslations(result);
      setManualTranslations(false);
      setActive(sourceLanguage === "it" ? "en" : "it");
    } catch {
      setManualTranslations(true);
      setError("Traduzione automatica non disponibile qui. Puoi inserire o correggere le tre lingue nelle schede sopra.");
      setActive(sourceLanguage === "it" ? "en" : "it");
    } finally {
      setBusy(false);
    }
  };

  const selectProductImage = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      setImageUrl(await compressProductImage(file));
    } catch (imageError) {
      setError(imageError instanceof Error ? imageError.message : "Caricamento della foto non riuscito.");
    } finally {
      setBusy(false);
    }
  };

  const saveProduct = async () => {
    if (!isTranslationSet(translations)) {
      setError("Inserisci nome e descrizione in italiano, inglese e spagnolo prima di salvare.");
      return;
    }
    setBusy(true);
    setError("");
    const data = {
      sourceLanguage,
      nameIt: translations.it.name.trim(),
      descriptionIt: translations.it.description.trim(),
      nameEn: translations.en.name.trim(),
      descriptionEn: translations.en.description.trim(),
      nameEs: translations.es.name.trim(),
      descriptionEs: translations.es.description.trim(),
      priceCents: 0,
      currency: "EUR",
      imageUrl: imageUrl.trim() || null,
      whatsappMessage: whatsappMessage.trim() || null,
      isPublished: 1,
    };
    try {
      const response = editingId
        ? await supabaseRequest(`/rest/v1/products?id=eq.${editingId}`, {
            method: "PATCH",
            headers: { Prefer: "return=representation" },
            body: JSON.stringify(data),
          })
        : await supabaseRequest("/rest/v1/products", {
            method: "POST",
            headers: { Prefer: "return=representation" },
            body: JSON.stringify({
              ...data,
              slug: `${(data.nameIt || "prodotto").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}-${Date.now().toString(36)}`,
            }),
          });
      if (!response.ok) throw new Error(`Salvataggio fallito (${response.status})`);
      await loadProducts();
      resetForm();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Salvataggio fallito.");
    } finally {
      setBusy(false);
    }
  };

  const beginEdit = (product: Product) => {
    setEditingId(product.id);
    setSourceLanguage(product.sourceLanguage);
    setActive(product.sourceLanguage);
    setTranslations({
      it: { name: product.nameIt, description: product.descriptionIt },
      en: { name: product.nameEn || "", description: product.descriptionEn || "" },
      es: { name: product.nameEs || "", description: product.descriptionEs || "" },
    });
    setImageUrl(product.imageUrl || "");
    setWhatsappMessage(product.whatsappMessage || "");
    setManualTranslations(!(product.nameEn && product.descriptionEn && product.nameEs && product.descriptionEs));
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteProduct = async (id: number) => {
    if (!window.confirm("Eliminare questo prodotto?")) return;
    const response = await supabaseRequest(`/rest/v1/products?id=eq.${id}`, { method: "DELETE" });
    if (!response.ok) setError(`Eliminazione fallita (${response.status})`);
    else await loadProducts();
  };

  if (unlocked === null) return <div className="admin-shell" />;

  if (!unlocked) {
    return (
      <div className="admin-shell">
        <header className="admin-header">
          <Link href="/" className="admin-back"><ArrowLeft size={16} /> Torna al sito</Link>
          <div className="admin-brand"><span className="admin-brand__mark"><Leaf size={17} /></span><span><strong>Renacer</strong><small>Area privata · Ibiza</small></span></div>
          <span />
        </header>
        <main className="admin-main admin-login admin-pin-login">
          <span className="admin-eyebrow"><Languages size={14} /> Accesso riservato</span>
          <h1>Apri il<br /><em>tuo spazio.</em></h1>
          <p>Inserisci il codice PIN per gestire il catalogo di Barbara Claps, le foto, le traduzioni e i collegamenti WhatsApp.</p>
          <form className="admin-pin-form" onSubmit={(event) => { event.preventDefault(); void unlock(); }}>
            <label htmlFor="admin-pin">Codice PIN</label>
            <input id="admin-pin" type="password" inputMode="numeric" autoComplete="off" value={pin} onChange={(event) => setPin(event.target.value)} placeholder="••••••••" maxLength={32} autoFocus />
            {pinError ? <small className="admin-error">{pinError}</small> : null}
            <button type="submit" className="admin-primary"><Leaf size={16} /> Entra nella gestione</button>
          </form>
        </main>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <Link href="/" className="admin-back"><ArrowLeft size={16} /> Torna al sito</Link>
        <div className="admin-brand"><span className="admin-brand__mark"><Leaf size={17} /></span><span><strong>Renacer</strong><small>Area gestione · catalogo</small></span></div>
        <button type="button" className="admin-lock" onClick={() => void lock()}><LogOut size={14} /> Esci</button>
      </header>
      <main className="admin-main">
        <div className="admin-intro">
          <div><span className="admin-eyebrow"><Languages size={14} /> Contenuti multilingue</span><h1>Un prodotto.<br /><em>Tre lingue.</em></h1><p>Scrivi nella lingua che preferisci. Prepara italiano, inglese e spagnolo e controlla tutto prima di pubblicare.</p></div>
          <div className="admin-intro__note"><Sparkles size={18} /><span>Flusso previsto<br /><strong>scrivi → traduci → pubblica</strong></span></div>
        </div>

        <section className="admin-card">
          <div className="admin-card__top"><div><span className="admin-card__number">01</span><h2>{editingId ? "Modifica prodotto" : "Nuovo prodotto"}</h2></div><span className="admin-badge">{isTranslationSet(translations) ? "Lingue complete" : "Bozza"}</span></div>
          <div className="admin-source-row">
            <label>Lingua in cui scrivi<select value={sourceLanguage} onChange={(event) => { setSourceLanguage(event.target.value as Lang); setActive(event.target.value as Lang); setManualTranslations(false); }}><option value="it">Italiano</option><option value="en">English</option><option value="es">Español</option></select></label>
          </div>
          <div className="admin-language-tabs" role="tablist">{(Object.keys(labels) as Lang[]).map((lang) => <button key={lang} type="button" className={active === lang ? "is-active" : ""} onClick={() => setActive(lang)} role="tab">{labels[lang]} {translations[lang].name.trim() && translations[lang].description.trim() ? <Check size={14} /> : null}</button>)}</div>
          <div className="admin-form-grid">
            <label>Nome del prodotto<input value={translations[active].name} onChange={(event) => active === sourceLanguage || manualTranslations ? setActiveField("name", event.target.value) : undefined} placeholder={active === sourceLanguage ? `Scrivi in ${labels[sourceLanguage]}` : "Traduzione da controllare"} readOnly={active !== sourceLanguage && !manualTranslations} /></label>
            <label>Descrizione<textarea value={translations[active].description} onChange={(event) => active === sourceLanguage || manualTranslations ? setActiveField("description", event.target.value) : undefined} placeholder={active === sourceLanguage ? `Descrivi il prodotto in ${labels[sourceLanguage]}` : "Traduzione da controllare"} readOnly={active !== sourceLanguage && !manualTranslations} rows={6} /></label>
          </div>
          <div className="admin-extra-grid">
            <label>Carica una foto del prodotto<input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; void selectProductImage(file); }} /><small>JPEG, PNG o WebP · compressa automaticamente a massimo 500 KB</small></label>
            <label>Oppure usa URL immagine<input value={imageUrl.startsWith("data:") ? "" : imageUrl} onChange={(event) => setImageUrl(event.target.value)} placeholder="https://…" /></label>
            <label>Messaggio WhatsApp (opzionale)<input value={whatsappMessage} onChange={(event) => setWhatsappMessage(event.target.value)} placeholder="Messaggio precompilato" /></label>
          </div>
          {imageUrl ? <div className="admin-photo-preview"><img src={imageUrl} alt="Anteprima del prodotto" /><button type="button" className="admin-secondary" onClick={() => setImageUrl("")}><X size={15} /> Rimuovi foto</button></div> : null}
          <div className="admin-card__bottom">
            <div><p><span className="admin-dot" /> Foto e testi si salvano con il prodotto nel catalogo Supabase.</p>{error ? <small className="admin-error">{error}</small> : null}</div>
            <div className="admin-actions"><button type="button" className="admin-secondary" onClick={() => void prepareTranslations()} disabled={busy}><Sparkles size={16} /> {busy ? "Attendi…" : "Prepara traduzioni"}</button><button type="button" className="admin-primary" onClick={() => void saveProduct()} disabled={busy}><Save size={16} /> {busy ? "Salvo…" : editingId ? "Aggiorna prodotto" : "Salva e pubblica"}</button></div>
          </div>
        </section>

        <section className="admin-next"><div className="admin-next__icon"><Check size={19} /></div><div><strong>Una richiesta diretta a Barbara.</strong><p>Ogni scheda del catalogo apre WhatsApp con il nome del prodotto.</p></div></section>
        <section className="admin-products">
          <div className="admin-products__heading"><div><span className="admin-eyebrow"><Leaf size={14} /> Catalogo</span><h2>Prodotti pubblicati</h2></div><span className="admin-badge">{products.length} prodotti</span></div>
          {!products.length ? <div className="admin-empty">Nessun prodotto per ora. Aggiungi il primo prodotto con la sua foto.</div> : <div className="admin-products-list">{products.map((product) => <article className="admin-product-row" key={product.id}><div><strong>{product.nameIt}</strong><span>IT / EN / ES · WhatsApp</span></div>{product.imageUrl ? <img className="admin-product-photo" src={product.imageUrl} alt="" loading="lazy" /> : null}<img src={qrFor(product.nameIt, product.whatsappMessage)} alt="QR WhatsApp prodotto" /><div className="admin-row-actions"><button type="button" className="admin-edit" aria-label={`Modifica ${product.nameIt}`} onClick={() => beginEdit(product)}><Pencil size={15} /></button><button type="button" className="admin-delete" aria-label={`Elimina ${product.nameIt}`} onClick={() => void deleteProduct(product.id)}><Trash2 size={15} /></button></div></article>)}</div>}
        </section>
      </main>
    </div>
  );
}
