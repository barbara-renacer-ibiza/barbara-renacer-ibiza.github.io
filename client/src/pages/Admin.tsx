import { useEffect, useState } from "react";
import { ArrowLeft, Check, Languages, Leaf, LogOut, Pencil, Save, Sparkles, Trash2 } from "lucide-react";
import { Link } from "wouter";

type Lang = "it" | "en" | "es";
type Translation = { name: string; description: string };
const labels: Record<Lang, string> = { it: "Italiano", en: "English", es: "Español" };
const emptyTranslations: Record<Lang, Translation> = { it: { name: "", description: "" }, en: { name: "", description: "" }, es: { name: "", description: "" } };
const whatsappNumber = "34646072140";
const supabaseFunctionUrl = "https://dybqvnthmfeatwfpysrv.supabase.co/functions/v1/renacer-admin";
const supabasePublishableKey = "sb_publishable_tOmI-rgVzQ7FHs56gJ-JhQ_zrYgZQOd";
type Product = { id: number; sourceLanguage: string; nameIt: string; descriptionIt: string; nameEn?: string | null; descriptionEn?: string | null; nameEs?: string | null; descriptionEs?: string | null; priceCents: number; imageUrl?: string | null; whatsappMessage?: string | null };
const adminRequest = async (action: string, payload: Record<string, unknown> = {}) => {
  const token = localStorage.getItem("renacer_admin_token") || "";
  const response = await fetch(supabaseFunctionUrl, { method: "POST", headers: { apikey: supabasePublishableKey, Authorization: `Bearer ${supabasePublishableKey}`, "Content-Type": "application/json", "x-renacer-token": token }, body: JSON.stringify({ action, ...payload }) });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || "Operation unavailable.");
  return result;
};

function qrFor(name: string, message?: string | null) {
  const link = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message || `Ciao Barbara, vorrei informazioni per: ${name}`)}`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=10&data=${encodeURIComponent(link)}`;
}

export default function Admin() {
  const [unlocked, setUnlocked] = useState<boolean | null>(null);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [active, setActive] = useState<Lang>("it");
  const [sourceLanguage, setSourceLanguage] = useState<Lang>("it");
  const [translations, setTranslations] = useState(emptyTranslations);
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [whatsappMessage, setWhatsappMessage] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [translated, setTranslated] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("renacer_admin_token");
    setUnlocked(Boolean(token));
  }, []);

  const loadProducts = async () => { try { setProducts(await adminRequest("list")); } catch { localStorage.removeItem("renacer_admin_token"); setUnlocked(false); } };
  useEffect(() => { if (unlocked) void loadProducts(); }, [unlocked]);

  const resetForm = () => { setTranslations({ it: { name: "", description: "" }, en: { name: "", description: "" }, es: { name: "", description: "" } }); setPrice(""); setImageUrl(""); setWhatsappMessage(""); setTranslated(false); setEditingId(null); setError(""); setActive("it"); setSourceLanguage("it"); };

  const unlock = async () => {
    setPinError("");
    try { const result = await adminRequest("login", { pin }); localStorage.setItem("renacer_admin_token", result.token); setUnlocked(true); setPin(""); } catch { setPinError("PIN non valido. Riprova."); setPin(""); }
  };

  const lock = async () => { localStorage.removeItem("renacer_admin_token"); setUnlocked(false); resetForm(); };

  const source = translations[sourceLanguage];
  const setSourceField = (field: keyof Translation, value: string) => { setTranslated(false); setTranslations((current) => ({ ...current, [sourceLanguage]: { ...current[sourceLanguage], [field]: value } })); };

  const prepareTranslations = async () => {
    if (!source.name.trim() || !source.description.trim()) { setError("Inserisci nome e descrizione nella lingua scelta."); return; }
    setBusy(true); setError("");
    try {
      const result = await adminRequest("translate", { sourceLanguage, name: source.name, description: source.description });
      setTranslations(result); setTranslated(true); setActive("en");
    } catch (translationError) { setError(translationError instanceof Error ? translationError.message : "Traduzione non disponibile"); }
    finally { setBusy(false); }
  };

  const saveProduct = async () => {
    if (!translated || !translations.it.name || !translations.en.name || !translations.es.name) { setError("Prepara prima le tre traduzioni."); return; }
    const parsedPrice = Number.parseFloat(price.replace(",", "."));
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) { setError("Inserisci un prezzo valido in euro."); return; }
    setError("");
    const data = { sourceLanguage, nameIt: translations.it.name, descriptionIt: translations.it.description, nameEn: translations.en.name, descriptionEn: translations.en.description, nameEs: translations.es.name, descriptionEs: translations.es.description, priceCents: Math.round(parsedPrice * 100), currency: "EUR", imageUrl: imageUrl.trim() || null, whatsappMessage: whatsappMessage.trim() || null, isPublished: 1 };
    try { await adminRequest(editingId ? "update" : "create", { id: editingId, product: data }); await loadProducts(); resetForm(); } catch (saveError) { setError(saveError instanceof Error ? saveError.message : "Salvataggio non disponibile."); }
  };

  const beginEdit = (product: Product) => {
  setEditingId(product.id); setSourceLanguage(product.sourceLanguage as Lang); setActive(product.sourceLanguage as Lang); setTranslations({ it: { name: product.nameIt, description: product.descriptionIt }, en: { name: product.nameEn || "", description: product.descriptionEn || "" }, es: { name: product.nameEs || "", description: product.descriptionEs || "" } }); setPrice((product.priceCents / 100).toFixed(2)); setImageUrl(product.imageUrl || ""); setWhatsappMessage(product.whatsappMessage || ""); setTranslated(true); setError(""); window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const removeProduct = async (id: number) => { try { await adminRequest("delete", { id }); await loadProducts(); } catch (deleteError) { setError(deleteError instanceof Error ? deleteError.message : "Eliminazione non disponibile."); } };

  if (unlocked === null) return <div className="admin-shell" />;
  if (!unlocked) return (
    <div className="admin-shell">
      <header className="admin-header"><Link href="/" className="admin-back"><ArrowLeft size={16} /> Torna al sito</Link><div className="admin-brand"><span className="admin-brand__mark"><Leaf size={17} /></span><span><strong>Renacer</strong><small>Area privata · Ibiza</small></span></div><span /></header>
      <main className="admin-main admin-login admin-pin-login">
        <span className="admin-eyebrow"><Languages size={14} /> Accesso riservato</span>
        <h1>Apri il<br /><em>tuo spazio.</em></h1>
        <p>Inserisci il codice PIN per gestire il catalogo di Barbara Claps, le traduzioni, i prezzi e i collegamenti WhatsApp.</p>
        <form className="admin-pin-form" onSubmit={(event) => { event.preventDefault(); void unlock(); }}>
          <label htmlFor="admin-pin">Codice PIN</label>
          <input id="admin-pin" type="password" inputMode="numeric" autoComplete="off" value={pin} onChange={(event) => setPin(event.target.value)} placeholder="••••••••" maxLength={32} autoFocus />
          {pinError ? <small className="admin-error">{pinError}</small> : null}
          <button type="submit" className="admin-primary"><Leaf size={16} /> Entra nella gestione</button>
        </form>
      </main>
    </div>
  );

  return (
    <div className="admin-shell">
      <header className="admin-header"><Link href="/" className="admin-back"><ArrowLeft size={16} /> Torna al sito</Link><div className="admin-brand"><span className="admin-brand__mark"><Leaf size={17} /></span><span><strong>Renacer</strong><small>Area gestione · catalogo</small></span></div><button type="button" className="admin-lock" onClick={() => void lock()}><LogOut size={14} /> Esci</button></header>
      <main className="admin-main">
        <div className="admin-intro"><div><span className="admin-eyebrow"><Languages size={14} /> Contenuti multilingue</span><h1>Un prodotto.<br /><em>Tre lingue.</em></h1><p>Scrivi nella lingua che preferisci. Il pannello prepara automaticamente italiano, inglese e spagnolo, poi puoi controllare tutto prima di pubblicare.</p></div><div className="admin-intro__note"><Sparkles size={18} /><span>Flusso previsto<br /><strong>scrivi → traduci → pubblica</strong></span></div></div>
        <section className="admin-card">
          <div className="admin-card__top"><div><span className="admin-card__number">01</span><h2>{editingId ? "Modifica prodotto" : "Nuovo prodotto"}</h2></div><span className="admin-badge">{translated ? "Traduzioni pronte" : "Bozza vuota"}</span></div>
          <div className="admin-source-row"><label>Lingua in cui scrivi<select value={sourceLanguage} onChange={(e) => { setSourceLanguage(e.target.value as Lang); setActive(e.target.value as Lang); setTranslated(false); }}><option value="it">Italiano</option><option value="en">English</option><option value="es">Español</option></select></label><label>Prezzo in euro<input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="es. 24,00" inputMode="decimal" /></label></div>
          <div className="admin-language-tabs" role="tablist">{(Object.keys(labels) as Lang[]).map((lang) => <button key={lang} type="button" className={active === lang ? "is-active" : ""} onClick={() => setActive(lang)} role="tab">{labels[lang]} {translated ? <Check size={14} /> : null}</button>)}</div>
          <div className="admin-form-grid"><label>Nome del prodotto<input value={translations[active].name} onChange={(e) => active === sourceLanguage && setSourceField("name", e.target.value)} placeholder={active === sourceLanguage ? `Scrivi in ${labels[sourceLanguage]}` : "Traduzione automatica"} readOnly={active !== sourceLanguage} /></label><label>Descrizione<textarea value={translations[active].description} onChange={(e) => active === sourceLanguage && setSourceField("description", e.target.value)} placeholder={active === sourceLanguage ? `Descrivi il prodotto in ${labels[sourceLanguage]}` : "Traduzione automatica"} readOnly={active !== sourceLanguage} rows={6} /></label></div>
          <div className="admin-extra-grid"><label>URL immagine prodotto (opzionale)<input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://…" /></label><label>Messaggio WhatsApp (opzionale)<input value={whatsappMessage} onChange={(e) => setWhatsappMessage(e.target.value)} placeholder="Messaggio precompilato" /></label></div>
          <div className="admin-card__bottom"><div><p><span className="admin-dot" /> Le traduzioni restano modificabili prima della pubblicazione.</p>{error ? <small className="admin-error">{error}</small> : null}</div><div className="admin-actions"><button type="button" className="admin-secondary" onClick={prepareTranslations} disabled={busy}><Sparkles size={16} /> {busy ? "Traduco…" : "Prepara traduzioni"}</button><button type="button" className="admin-primary" onClick={saveProduct} disabled={busy}><Save size={16} /> {busy ? "Salvo…" : editingId ? "Aggiorna prodotto" : "Salva e pubblica"}</button></div></div>
        </section>
        <section className="admin-next"><div className="admin-next__icon"><Check size={19} /></div><div><strong>Ogni prodotto avrà il suo QR WhatsApp.</strong><p>Il cliente può premere Buy now oppure scansionare il codice QR sulla scheda. In entrambi i casi si apre WhatsApp con il prodotto già indicato.</p></div></section>
        <section className="admin-products"><div className="admin-products__heading"><div><span className="admin-eyebrow"><Leaf size={14} /> Catalogo</span><h2>Prodotti pubblicati</h2></div><span className="admin-badge">{products.length} prodotti</span></div>{!products.length ? <div className="admin-empty">Nessun prodotto per ora. Il catalogo pubblico resterà vuoto finché non aggiungi il primo.</div> : <div className="admin-products-list">{products.map((product) => <article className="admin-product-row" key={product.id}><div><strong>{product.nameIt}</strong><span>{(product.priceCents / 100).toFixed(2)} € · IT / EN / ES</span></div><img src={qrFor(product.nameIt, product.whatsappMessage)} alt="QR WhatsApp prodotto" /><div className="admin-row-actions"><button type="button" className="admin-edit" aria-label={`Modifica ${product.nameIt}`} onClick={() => beginEdit(product)}><Pencil size={15} /></button><button type="button" className="admin-delete" aria-label={`Elimina ${product.nameIt}`} onClick={() => void removeProduct(product.id)}><Trash2 size={15} /></button></div></article>)}</div>}</section>
      </main>
    </div>
  );
}
