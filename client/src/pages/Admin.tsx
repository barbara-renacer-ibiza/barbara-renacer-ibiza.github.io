import { useEffect, useState } from "react";
import { ArrowLeft, Check, ImagePlus, Languages, Leaf, LogOut, Pencil, Save, Sparkles, Trash2, X } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";

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
  priceCents: number;
  currency: string;
  imageUrl: string | null;
  whatsappMessage: string | null;
  isPublished: number;
};

const ADMIN_URL = "https://barbarabotan-7xc3xthl.manus.space/admin";
const labels: Record<Lang, string> = { it: "Italiano", en: "English", es: "Español" };
const emptyTranslations: Record<Lang, Translation> = {
  it: { name: "", description: "" },
  en: { name: "", description: "" },
  es: { name: "", description: "" },
};
const whatsappNumber = "34646072140";
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

function qrFor(name: string, message?: string | null) {
  const text = message || `Ciao Barbara, vorrei informazioni per: ${name}`;
  const link = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=10&data=${encodeURIComponent(link)}`;
}

function fileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Impossibile leggere l'immagine."));
    reader.onerror = () => reject(new Error("Impossibile leggere l'immagine."));
    reader.readAsDataURL(file);
  });
}

function hasCompleteTranslations(value: Partial<Record<Lang, Partial<Translation>>>) {
  return (Object.keys(labels) as Lang[]).every((lang) => Boolean(value[lang]?.name?.trim() && value[lang]?.description?.trim()));
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

export default function Admin() {
  const [unlocked, setUnlocked] = useState<boolean | null>(null);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [active, setActive] = useState<Lang>("it");
  const [sourceLanguage, setSourceLanguage] = useState<Lang>("it");
  const [translations, setTranslations] = useState<Record<Lang, Translation>>(emptyTranslations);
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [whatsappMessage, setWhatsappMessage] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [translated, setTranslated] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [connectionError, setConnectionError] = useState("");

  const productsQuery = trpc.products.admin.list.useQuery(undefined, { enabled: unlocked === true });
  const createProduct = trpc.products.admin.create.useMutation();
  const updateProduct = trpc.products.admin.update.useMutation();
  const removeProduct = trpc.products.admin.delete.useMutation();
  const products = (productsQuery.data ?? []) as Product[];

  useEffect(() => {
    if (window.location.hostname === "barbara-renacer-ibiza.github.io") {
      window.location.replace(ADMIN_URL);
      return;
    }

    let activeEffect = true;
    fetch("/api/admin/session", { credentials: "include" })
      .then(async (response) => {
        if (!response.ok) throw new Error("La sessione amministrativa non è raggiungibile.");
        const data = await response.json() as { unlocked?: boolean };
        if (activeEffect) setUnlocked(Boolean(data.unlocked));
      })
      .catch(() => {
        if (!activeEffect) return;
        setConnectionError("Apri la gestione dal dominio amministrativo per usare la sessione protetta.");
        setUnlocked(false);
      });

    return () => { activeEffect = false; };
  }, []);

  useEffect(() => {
    if (imageFile) {
      const objectUrl = URL.createObjectURL(imageFile);
      setImagePreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }
    setImagePreview(imageUrl);
  }, [imageFile, imageUrl]);

  const resetForm = () => {
    setTranslations({ it: { name: "", description: "" }, en: { name: "", description: "" }, es: { name: "", description: "" } });
    setImageUrl("");
    setImageFile(null);
    setWhatsappMessage("");
    setTranslated(false);
    setEditingId(null);
    setError("");
    setActive("it");
    setSourceLanguage("it");
  };

  const unlock = async () => {
    setPinError("");
    setConnectionError("");
    try {
      const response = await fetch("/api/admin/unlock", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      if (!response.ok) throw new Error(response.status === 401 ? "PIN non valido. Riprova." : "Accesso non disponibile. Riprova.");
      setUnlocked(true);
      setPin("");
    } catch (unlockError) {
      setPinError(errorMessage(unlockError, "Accesso non disponibile. Riprova."));
      setPin("");
    }
  };

  const lock = async () => {
    await fetch("/api/admin/lock", { method: "POST", credentials: "include" }).catch(() => undefined);
    setUnlocked(false);
    resetForm();
  };

  const source = translations[sourceLanguage];
  const setSourceField = (field: keyof Translation, value: string) => {
    setTranslated(false);
    setTranslations((current) => ({ ...current, [sourceLanguage]: { ...current[sourceLanguage], [field]: value } }));
  };

  const prepareTranslations = async () => {
    if (!source.name.trim() || !source.description.trim()) {
      setError("Inserisci il nome e la descrizione nella lingua scelta.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceLanguage, name: source.name, description: source.description }),
      });
      const result = await response.json().catch(() => ({})) as Record<Lang, Translation> & { error?: string };
      if (!response.ok) throw new Error(result.error || "La traduzione automatica non è disponibile in questo momento.");
      if (!hasCompleteTranslations(result)) throw new Error("La risposta di traduzione non contiene tutti i nomi e le descrizioni.");
      setTranslations(result);
      setTranslated(true);
      setActive("en");
    } catch (translationError) {
      setTranslated(false);
      setError(errorMessage(translationError, "La traduzione non è riuscita. Riprova prima di salvare."));
    } finally {
      setBusy(false);
    }
  };

  const uploadSelectedImage = async () => {
    if (!imageFile) return imageUrl.trim() || null;
    const dataUrl = await fileAsDataUrl(imageFile);
    const response = await fetch("/api/admin/upload-image", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dataUrl, filename: imageFile.name }),
    });
    const result = await response.json().catch(() => ({})) as { url?: string; error?: string };
    if (!response.ok || !result.url) throw new Error(result.error || "Caricamento immagine non riuscito.");
    return new URL(result.url, window.location.origin).toString();
  };

  const saveProduct = async () => {
    if (!translated || !hasCompleteTranslations(translations)) {
      setError("Prepara e controlla prima le tre traduzioni.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const savedImageUrl = await uploadSelectedImage();
      const data = {
        sourceLanguage,
        nameIt: translations.it.name.trim(),
        descriptionIt: translations.it.description.trim(),
        nameEn: translations.en.name.trim(),
        descriptionEn: translations.en.description.trim(),
        nameEs: translations.es.name.trim(),
        descriptionEs: translations.es.description.trim(),
        imageUrl: savedImageUrl,
        whatsappMessage: whatsappMessage.trim() || null,
        isPublished: 1,
      };

      if (editingId) {
        await updateProduct.mutateAsync({ id: editingId, data });
      } else {
        await createProduct.mutateAsync({ ...data, priceCents: 0, currency: "EUR" });
      }
      await productsQuery.refetch();
      resetForm();
    } catch (saveError) {
      setError(errorMessage(saveError, "Salvataggio non riuscito. Riprova."));
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
    setImageFile(null);
    setWhatsappMessage(product.whatsappMessage || "");
    setTranslated(Boolean(product.nameIt?.trim() && product.descriptionIt?.trim() && product.nameEn?.trim() && product.descriptionEn?.trim() && product.nameEs?.trim() && product.descriptionEs?.trim()));
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteProduct = async (id: number) => {
    if (!window.confirm("Eliminare questo prodotto?")) return;
    setError("");
    try {
      await removeProduct.mutateAsync({ id });
      await productsQuery.refetch();
    } catch (deleteError) {
      setError(errorMessage(deleteError, "Eliminazione non riuscita."));
    }
  };

  if (unlocked === null) return <div className="admin-shell" aria-label="Caricamento area amministrativa" />;

  if (!unlocked) return (
    <div className="admin-shell">
      <header className="admin-header">
        <Link href="/" className="admin-back"><ArrowLeft size={16} /> Torna al sito</Link>
        <div className="admin-brand"><span className="admin-brand__mark"><Leaf size={17} /></span><span><strong>Renacer</strong><small>Area privata · Ibiza</small></span></div>
        <span />
      </header>
      <main className="admin-main admin-login admin-pin-login">
        <span className="admin-eyebrow"><Languages size={14} /> Accesso riservato</span>
        <h1>Apri il<br /><em>tuo spazio.</em></h1>
        <p>Gestisci i prodotti, le traduzioni, le immagini e i collegamenti WhatsApp di Barbara Claps.</p>
        {connectionError ? <small className="admin-error">{connectionError}</small> : null}
        <form className="admin-pin-form" onSubmit={(event) => { event.preventDefault(); void unlock(); }}>
          <label htmlFor="admin-pin">Codice PIN</label>
          <input id="admin-pin" type="password" inputMode="numeric" autoComplete="current-password" value={pin} onChange={(event) => setPin(event.target.value)} placeholder="••••••••" maxLength={32} autoFocus />
          {pinError ? <small className="admin-error">{pinError}</small> : null}
          <button type="submit" className="admin-primary"><Leaf size={16} /> Entra nella gestione</button>
        </form>
      </main>
    </div>
  );

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <Link href="/" className="admin-back"><ArrowLeft size={16} /> Torna al sito</Link>
        <div className="admin-brand"><span className="admin-brand__mark"><Leaf size={17} /></span><span><strong>Renacer</strong><small>Area gestione · catalogo</small></span></div>
        <button type="button" className="admin-lock" onClick={() => void lock()}><LogOut size={14} /> Esci</button>
      </header>
      <main className="admin-main">
        <div className="admin-intro">
          <div>
            <span className="admin-eyebrow"><Languages size={14} /> Contenuti multilingue</span>
            <h1>Un prodotto.<br /><em>Tre lingue.</em></h1>
            <p>Scrivi nome e descrizione in una sola lingua. La traduzione prepara italiano, inglese e spagnolo; puoi rivedere i testi prima di pubblicare.</p>
          </div>
          <div className="admin-intro__note"><Sparkles size={18} /><span>Flusso semplice<br /><strong>scrivi → controlla → pubblica</strong></span></div>
        </div>

        <section className="admin-card">
          <div className="admin-card__top">
            <div><span className="admin-card__number">01</span><h2>{editingId ? "Modifica prodotto" : "Nuovo prodotto"}</h2></div>
            <span className="admin-badge">{translated ? "Traduzioni pronte" : "Bozza da completare"}</span>
          </div>

          <div className="admin-source-row">
            <label>Lingua in cui scrivi
              <select value={sourceLanguage} onChange={(event) => { const next = event.target.value as Lang; setSourceLanguage(next); setActive(next); setTranslated(false); }}>
                <option value="it">Italiano</option><option value="en">English</option><option value="es">Español</option>
              </select>
            </label>
            <label>Messaggio WhatsApp (opzionale)
              <input value={whatsappMessage} onChange={(event) => setWhatsappMessage(event.target.value)} placeholder="Messaggio precompilato" maxLength={1000} />
            </label>
          </div>

          <div className="admin-language-tabs" role="tablist" aria-label="Traduzioni prodotto">
            {(Object.keys(labels) as Lang[]).map((lang) => (
              <button key={lang} type="button" className={active === lang ? "is-active" : ""} onClick={() => setActive(lang)} role="tab" aria-selected={active === lang}>
                {labels[lang]} {translated ? <Check size={14} /> : null}
              </button>
            ))}
          </div>

          <div className="admin-form-grid">
            <label>Nome del prodotto
              <input value={translations[active].name} onChange={(event) => active === sourceLanguage && setSourceField("name", event.target.value)} placeholder={active === sourceLanguage ? `Scrivi in ${labels[sourceLanguage]}` : "Traduzione automatica"} readOnly={active !== sourceLanguage} maxLength={180} />
            </label>
            <label>Descrizione
              <textarea value={translations[active].description} onChange={(event) => active === sourceLanguage && setSourceField("description", event.target.value)} placeholder={active === sourceLanguage ? `Descrivi il prodotto in ${labels[sourceLanguage]}` : "Traduzione automatica"} readOnly={active !== sourceLanguage} rows={6} maxLength={10000} />
            </label>
          </div>

          <div className="admin-extra-grid admin-image-grid">
            <label className="admin-upload-label">Foto del prodotto
              <span className="admin-upload-control"><ImagePlus size={17} /><span>{imageFile?.name || (imageUrl ? "Sostituisci la foto" : "Carica una foto dal dispositivo")}</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                if (file && (!file.type.startsWith("image/") || file.size > MAX_IMAGE_BYTES)) {
                  setError("Scegli una foto JPEG, PNG o WebP di massimo 8 MB.");
                  event.currentTarget.value = "";
                  return;
                }
                setImageFile(file);
                setError("");
              }} /></span>
              <small>JPEG, PNG o WebP · massimo 8 MB</small>
            </label>
            <div className="admin-image-preview" aria-live="polite">
              {imagePreview ? <><img src={imagePreview} alt="Anteprima della foto prodotto" /><button type="button" className="admin-image-remove" aria-label="Rimuovi foto" onClick={() => { setImageFile(null); setImageUrl(""); }}><X size={15} /></button></> : <span><ImagePlus size={24} /> Anteprima foto</span>}
            </div>
          </div>

          <div className="admin-card__bottom">
            <div>
              <p><span className="admin-dot" /> Catalogo, immagini e gestione collegati al server protetto.</p>
              {error ? <small className="admin-error">{error}</small> : null}
            </div>
            <div className="admin-actions">
              <button type="button" className="admin-secondary" onClick={() => void prepareTranslations()} disabled={busy}><Sparkles size={16} /> {busy ? "Attendi…" : "Prepara traduzioni"}</button>
              <button type="button" className="admin-primary" onClick={() => void saveProduct()} disabled={busy || productsQuery.isLoading}><Save size={16} /> {busy ? "Salvo…" : editingId ? "Aggiorna prodotto" : "Salva e pubblica"}</button>
            </div>
          </div>
        </section>

        <section className="admin-next">
          <div className="admin-next__icon"><Check size={19} /></div>
          <div><strong>Ogni prodotto conduce alla conversazione giusta.</strong><p>La cliente può chiedere informazioni o disponibilità su WhatsApp dalla scheda del prodotto.</p></div>
        </section>

        <section className="admin-products">
          <div className="admin-products__heading"><div><span className="admin-eyebrow"><Leaf size={14} /> Catalogo</span><h2>Prodotti pubblicati</h2></div><span className="admin-badge">{products.length} prodotti</span></div>
          {productsQuery.error ? <div className="admin-empty admin-error">{productsQuery.error.message}</div> : null}
          {productsQuery.isLoading ? <div className="admin-empty">Caricamento catalogo…</div> : !products.length ? <div className="admin-empty">Nessun prodotto per ora. Il catalogo pubblico resterà vuoto finché non aggiungi il primo.</div> : (
            <div className="admin-products-list">
              {products.map((product) => (
                <article className="admin-product-row" key={product.id}>
                  <div className="admin-product-row__identity">{product.imageUrl ? <img className="admin-product-thumb" src={product.imageUrl} alt="" /> : <span className="admin-product-thumb admin-product-thumb--empty"><ImagePlus size={18} /></span>}<div><strong>{product.nameIt}</strong><span>IT / EN / ES · {product.isPublished ? "Pubblicato" : "Bozza"}</span></div></div>
                  <img src={qrFor(product.nameIt, product.whatsappMessage)} alt={`QR WhatsApp ${product.nameIt}`} />
                  <div className="admin-row-actions">
                    <button type="button" className="admin-edit" aria-label={`Modifica ${product.nameIt}`} onClick={() => beginEdit(product)}><Pencil size={15} /></button>
                    <button type="button" className="admin-delete" aria-label={`Elimina ${product.nameIt}`} onClick={() => void deleteProduct(product.id)}><Trash2 size={15} /></button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
