import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRoute } from "wouter";
import { ArrowLeft, ArrowUpRight, HandHeart, Image as ImageIcon, Leaf, MessageCircle, ShieldCheck, Upload } from "lucide-react";
import ShareBar from "@/components/ShareBar";

type Lang = "it" | "en" | "es";
type Category = { slug: string; nameIt: string; nameEn: string | null; nameEs: string | null };
type ArtisanProduct = { id: number; slug: string; artisanName: string; productName: string; description: string; category: string; priceCents: number; currency: string; imageUrl: string | null; approvedAt?: string };
const api = "https://dybqvnthmfeatwfpysrv.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5YnF2bnRobWZlYXR3ZnB5c3J2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ3Nzk3MTAsImV4cCI6MjExMDM1NTcxMH0.9HxrdAIQxWQ3PtWAuICpXfNjMfR4chgAmlY9cYyxB38";
const endpoint = `${api}/functions/v1/renacer-admin`;
const headers = { apikey: key, Authorization: `Bearer ${key}` };
const copy = {
 it: { label:"Artigiani · Ibiza", title:"Fatto con mani e cura.", intro:"Uno spazio per le persone che creano a Ibiza. Scopri i loro prodotti o proponi un oggetto artigianale per la selezione Renacer.", formTitle:"Proponi il tuo prodotto", formIntro:"L'invio resta privato e in attesa di revisione. Nessun prodotto compare sul sito prima dell'approvazione di Barbara.", artisan:"Nome dell'artigiano/a", product:"Nome del prodotto", category:"Categoria", description:"Descrizione", price:"Prezzo in EUR", email:"Email di contatto", phone:"Telefono (facoltativo)", image:"Foto del prodotto", imageHint:"JPG, PNG, WebP, GIF o AVIF · massimo 10 MB", send:"Invia per la revisione", sending:"Invio in corso…", success:"Grazie. La proposta è stata inviata e sarà visibile solo dopo la revisione di Barbara.", error:"Invio non riuscito. Controlla i campi e riprova.", required:"Compila tutti i campi obbligatori e scegli una foto.", loading:"Caricamento dei prodotti artigianali…", none:"Non ci sono ancora prodotti artigianali approvati.", detailMissing:"Questo prodotto artigianale non è disponibile.", back:"Tutti gli artigiani", home:"Home", catalog:"Catalogo", nutrition:"Nutrizione", pending:"La proposta non sarà pubblicata prima dell'approvazione.", detail:"Scopri" },
 en: { label:"Artisans · Ibiza", title:"Made by hand, with care.", intro:"A space for people who make things in Ibiza. Discover their work or submit a handmade item for Renacer to review.", formTitle:"Submit your product", formIntro:"Your submission stays private while it is reviewed. Nothing appears on the site before Barbara approves it.", artisan:"Artisan name", product:"Product name", category:"Category", description:"Description", price:"Price in EUR", email:"Contact email", phone:"Phone (optional)", image:"Product photo", imageHint:"JPG, PNG, WebP, GIF or AVIF · up to 10 MB", send:"Submit for review", sending:"Submitting…", success:"Thank you. Your proposal was sent and will only be visible after Barbara reviews it.", error:"Submission failed. Check the fields and try again.", required:"Complete the required fields and choose a photo.", loading:"Loading approved artisan products…", none:"No artisan products have been approved yet.", detailMissing:"This artisan product is not available.", back:"All artisans", home:"Home", catalog:"Catalogue", nutrition:"Nutrition", pending:"Your proposal will not be published before approval.", detail:"Explore" },
 es: { label:"Artesanos · Ibiza", title:"Hecho a mano, con cuidado.", intro:"Un espacio para quienes crean en Ibiza. Descubre sus productos o presenta una pieza artesanal para que Renacer la revise.", formTitle:"Presenta tu producto", formIntro:"Tu propuesta se mantiene privada mientras se revisa. Nada aparece en el sitio antes de que Barbara la apruebe.", artisan:"Nombre del artesano/a", product:"Nombre del producto", category:"Categoría", description:"Descripción", price:"Precio en EUR", email:"Correo de contacto", phone:"Teléfono (opcional)", image:"Foto del producto", imageHint:"JPG, PNG, WebP, GIF o AVIF · máximo 10 MB", send:"Enviar para revisión", sending:"Enviando…", success:"Gracias. La propuesta se ha enviado y solo será visible después de la revisión de Barbara.", error:"No se pudo enviar. Revisa los campos e inténtalo de nuevo.", required:"Completa los campos obligatorios y elige una foto.", loading:"Cargando productos artesanales aprobados…", none:"Todavía no hay productos artesanales aprobados.", detailMissing:"Este producto artesanal no está disponible.", back:"Todos los artesanos", home:"Inicio", catalog:"Catálogo", nutrition:"Nutrición", pending:"La propuesta no se publicará antes de su aprobación.", detail:"Descubrir" }
};
function getLanguage(): Lang { const value = localStorage.getItem("renacer_language"); return value === "en" || value === "es" ? value : "it"; }
function categoryName(c: Category, l: Lang) { return (l === "en" ? c.nameEn : l === "es" ? c.nameEs : c.nameIt) || c.nameIt; }

export default function Artisans() {
 const [routeMatch, params] = useRoute("/artisans/:slug");
 const slug = routeMatch ? params?.slug : undefined;
 const [lang, setLang] = useState<Lang>(getLanguage);
 const [products, setProducts] = useState<ArtisanProduct[]>([]);
 const [categories, setCategories] = useState<Category[]>([]);
 const [loading, setLoading] = useState(true);
 const [sending, setSending] = useState(false);
 const [error, setError] = useState("");
 const [notice, setNotice] = useState("");
 const [file, setFile] = useState<File | null>(null);
 const t = copy[lang];
 const selected = useMemo(() => products.find(item => item.slug === slug), [products, slug]);
 const [form, setForm] = useState({ artisanName:"", contactEmail:"", contactPhone:"", productName:"", description:"", category:"", price:"", website:"" });
 useEffect(() => {
  let cancelled = false;
  Promise.all([
   fetch(`${api}/rest/v1/artisan_submissions?select=id,slug,artisanName,productName,description,category,priceCents,currency,imageUrl,approvedAt&status=eq.approved&order=approvedAt.desc`, { headers }).then(r => { if (!r.ok) throw new Error(); return r.json() as Promise<ArtisanProduct[]>; }),
   fetch(`${api}/rest/v1/categories?select=slug,nameIt,nameEn,nameEs&isActive=eq.true&order=nameIt.asc`, { headers }).then(r => r.ok ? r.json() : [] as Category[]),
  ]).then(([p,c]: [ArtisanProduct[],Category[]]) => { if (!cancelled) { setProducts(p); setCategories(c); } }).catch(() => { if (!cancelled) setProducts([]); }).finally(() => { if (!cancelled) setLoading(false); });
  return () => { cancelled = true; };
 }, []);
 useEffect(() => { localStorage.setItem("renacer_language",lang); document.documentElement.lang=lang; document.title=`${selected?.productName || t.title} · Renacer Ibiza · Rituales de cuidados`; }, [lang,selected,t.title]);
 const submit = async (event: FormEvent) => {
  event.preventDefault(); setError(""); setNotice("");
  if (!form.artisanName.trim() || !form.contactEmail.trim() || !form.productName.trim() || !form.description.trim() || !form.category || !form.price || !file) { setError(t.required); return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail.trim())) { setError(lang === "en" ? "Enter a valid email address." : lang === "es" ? "Introduce un correo válido." : "Inserisci un indirizzo email valido."); return; }
  const price = Number(form.price.replace(",","."));
  if (!Number.isFinite(price) || price < 0 || price > 100000) { setError(lang === "en" ? "Enter a valid price." : lang === "es" ? "Introduce un precio válido." : "Inserisci un prezzo valido."); return; }
  if (!/^(image\/(jpeg|png|webp|gif|avif))$/.test(file.type) || file.size <= 0 || file.size > 10 * 1024 * 1024) { setError(t.imageHint); return; }
  setSending(true);
  try {
   const data = new FormData();
   data.set("action","artisan_submit"); data.set("artisanName",form.artisanName.trim()); data.set("contactEmail",form.contactEmail.trim()); data.set("contactPhone",form.contactPhone.trim()); data.set("productName",form.productName.trim()); data.set("description",form.description.trim()); data.set("category",form.category); data.set("priceCents",String(Math.round(price * 100))); data.set("website",form.website); data.set("file",file);
   const response = await fetch(endpoint,{method:"POST",headers,body:data});
   const result = await response.json().catch(()=>({}));
   if (!response.ok) throw new Error(result.error || t.error);
   setNotice(t.success); setForm({artisanName:"",contactEmail:"",contactPhone:"",productName:"",description:"",category:"",price:"",website:""}); setFile(null);
   const input = document.getElementById("artisan-image") as HTMLInputElement | null; if(input) input.value="";
  } catch (e) { setError(e instanceof Error ? e.message : t.error); }
  finally { setSending(false); }
 };
 return <div className="artisans-page">
  <div className="topline"><div className="container topline__inner"><span>{t.label}</span><span className="topline__note"><HandHeart size={13}/> Renacer Ibiza · Rituales de cuidados</span></div></div>
  <header className="site-header"><div className="container header__inner"><a className="brand" href="/"><img className="brand-logo-image" src="/images/logo-woman.png" alt=""/><span className="brand__text"><strong>Renacer Ibiza</strong><small>Rituales de cuidados</small></span></a><nav className="catalogue-nav"><a href="/">{t.home}</a><a href="/catalogue">{t.catalog}</a><a href="/nutrition">{t.nutrition}</a><span>{(["it","en","es"] as Lang[]).map(l=><button key={l} type="button" className={lang===l?"is-active":""} onClick={()=>setLang(l)}>{l.toUpperCase()}</button>)}</span></nav></div></header>
  <main className="artisans-main container"><section className="artisans-hero"><span className="section-eyebrow"><HandHeart size={14}/>{t.label}</span><h1>{t.title}</h1><p>{t.intro}</p></section>
   {slug ? (loading ? <p className="catalogue-state">{t.loading}</p> : !selected ? <section className="catalogue-missing"><Leaf size={26}/><h1>{t.detailMissing}</h1><a href="/artisans"><ArrowLeft size={15}/>{t.back}</a></section> : <article className="artisan-detail"><a className="catalogue-back" href="/artisans"><ArrowLeft size={15}/>{t.back}</a><div className="catalogue-detail__grid"><div className="catalogue-detail__photo">{selected.imageUrl?<img src={selected.imageUrl} alt={selected.productName}/>:<Leaf size={42}/>}</div><div className="catalogue-detail__copy"><span className="section-eyebrow"><HandHeart size={14}/>{selected.artisanName}</span><h1>{selected.productName}</h1><strong className="catalogue-price">{(selected.priceCents/100).toFixed(2)} {selected.currency || "EUR"}</strong><p>{selected.description}</p><span className="artisan-category">{selected.category}</span><ShareBar title={selected.productName} path={`/artisans/${encodeURIComponent(selected.slug)}`} language={lang}/></div></div></article>) : <>
    <section className="artisan-gallery"><div className="artisan-section-heading"><span className="section-eyebrow"><ShieldCheck size={14}/>{lang === "en" ? "Reviewed by Barbara" : lang === "es" ? "Revisado por Barbara" : "Revisionati da Barbara"}</span><h2>{lang === "en" ? "Approved makers" : lang === "es" ? "Artesanos aprobados" : "Creazioni approvate"}</h2></div>{loading ? <p className="catalogue-state">{t.loading}</p> : products.length === 0 ? <p className="catalogue-state">{t.none}</p> : <div className="catalogue-grid">{products.map(p=><article className="catalogue-card artisan-card" key={p.id}><a className="catalogue-card__image" href={`/artisans/${encodeURIComponent(p.slug)}`}>{p.imageUrl?<img src={p.imageUrl} alt={p.productName} loading="lazy"/>:<span><Leaf size={30}/></span>}</a><div className="catalogue-card__content"><small>{p.artisanName} · {p.category}</small><h2><a href={`/artisans/${encodeURIComponent(p.slug)}`}>{p.productName}</a></h2><p>{p.description}</p><div className="catalogue-card__bottom"><strong>{(p.priceCents/100).toFixed(2)} {p.currency||"EUR"}</strong><a href={`/artisans/${encodeURIComponent(p.slug)}`}>{t.detail}<ArrowUpRight size={14}/></a></div></div></article>)}</div>}</section>
    <section className="artisan-form-wrap"><div className="artisan-form-intro"><span className="section-eyebrow"><Upload size={14}/>{t.formTitle}</span><h2>{t.formTitle}</h2><p>{t.formIntro}</p><p className="artisan-privacy"><ShieldCheck size={15}/>{t.pending}</p></div><form className="artisan-form" onSubmit={submit}>
      <label>{t.artisan} *<input required maxLength={120} value={form.artisanName} onChange={e=>setForm({...form,artisanName:e.target.value})}/></label>
      <label>{t.product} *<input required maxLength={160} value={form.productName} onChange={e=>setForm({...form,productName:e.target.value})}/></label>
      <label>{t.category} *<select required value={form.category} onChange={e=>setForm({...form,category:e.target.value})}><option value="">—</option>{categories.map(c=><option key={c.slug} value={c.nameIt}>{categoryName(c,lang)}</option>)}<option value={lang === "en" ? "Other" : lang === "es" ? "Otro" : "Altro"}>{lang === "en" ? "Other" : lang === "es" ? "Otro" : "Altro"}</option></select></label>
      <label>{t.price} *<input required type="number" min="0" max="100000" step="0.01" value={form.price} onChange={e=>setForm({...form,price:e.target.value})}/></label>
      <label className="artisan-form__wide">{t.description} *<textarea required maxLength={4000} rows={5} value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label>
      <label>{t.email} *<input required type="email" maxLength={254} autoComplete="email" value={form.contactEmail} onChange={e=>setForm({...form,contactEmail:e.target.value})}/></label>
      <label>{t.phone}<input type="tel" maxLength={40} autoComplete="tel" value={form.contactPhone} onChange={e=>setForm({...form,contactPhone:e.target.value})}/></label>
      <label className="artisan-form__wide artisan-upload"><span><ImageIcon size={16}/>{t.image} *</span><input id="artisan-image" required type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" onChange={e=>setFile(e.target.files?.[0] || null)}/><small>{file?.name || t.imageHint}</small></label>
      <label className="artisan-honeypot" aria-hidden="true">Website<input tabIndex={-1} autoComplete="off" value={form.website} onChange={e=>setForm({...form,website:e.target.value})}/></label>
      {error && <p className="artisan-alert artisan-alert--error" role="alert">{error}</p>}{notice && <p className="artisan-alert artisan-alert--success" role="status">{notice}</p>}
      <button className="button button--primary artisan-submit" type="submit" disabled={sending}>{sending?t.sending:t.send}<ArrowUpRight size={16}/></button>
    </form></section>
   </>}
  </main><footer className="site-footer"><div className="container footer__bottom"><a href="/">Renacer Ibiza · Rituales de cuidados</a><a href="/catalogue">{t.catalog}</a><a href="/nutrition">{t.nutrition}</a><span>© {new Date().getFullYear()} Renacer Ibiza · Rituales de cuidados</span></div></footer>
 </div>;
}
