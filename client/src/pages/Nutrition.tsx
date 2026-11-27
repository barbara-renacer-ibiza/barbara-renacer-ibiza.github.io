import { useEffect, useMemo, useState } from "react";
import { imageFrameStyle } from "../lib/imageFrame";
import { useRoute } from "wouter";
import { ArrowLeft, ArrowRight, BookOpen, Languages, Leaf } from "lucide-react";
import ShareBar from "@/components/ShareBar";
import RenacerEmblem from "@/components/RenacerEmblem";
import { articleExcerpt, renderArticleMarkup } from "../lib/articleMarkup";

type Language = "it" | "en" | "es";
type Article = {
  id: number;
  slug: string;
  titleIt: string;
  bodyIt: string;
  titleEn: string | null;
  bodyEn: string | null;
  titleEs: string | null;
  bodyEs: string | null;
  imageUrl: string | null;
  createdAt?: string;
  isPublished: number;
};

const supabaseUrl = "https://dybqvnthmfeatwfpysrv.supabase.co";
const supabasePublishableKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5YnF2bnRobWZlYXR3ZnB5c3J2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ3Nzk3MTAsImV4cCI6MjExMDM1NTcxMH0.9HxrdAIQxWQ3PtWAuICpXfNjMfR4chgAmlY9cYyxB38";
const languageCopy: Record<Language, Record<string, string>> = {
  it: {
    home: "Home", catalog: "La collezione", eyebrow: "Journal Renacer", title: "Nutrizione & benessere", lead: "Appunti, pratiche e riflessioni per una cura che parte da dentro e si intreccia con la vita quotidiana.",
    learn: "Leggi di più", back: "Tutti gli articoli", empty: "Gli articoli arriveranno presto.", loading: "Caricamento degli articoli…", missing: "Questo articolo non è disponibile.", notice: "Ogni percorso è personale: queste note hanno valore informativo e non sostituiscono il parere di un professionista sanitario.", askBarbara: "Hai una domanda su questo articolo?", whatsapp: "Chiedi a Barbara su WhatsApp", whatsappMessage: "Ciao Barbara, ho letto l'articolo «{title}» e vorrei chiederti maggiori informazioni.",
  },
  en: {
    home: "Home", catalog: "The collection", eyebrow: "Renacer Journal", title: "Nutrition & wellbeing", lead: "Notes, practices and reflections on care that begins within and meets everyday life.",
    learn: "Learn more", back: "All articles", empty: "Articles will be here soon.", loading: "Loading articles…", missing: "This article is not available.", notice: "Every path is personal: these notes are for information and do not replace advice from a healthcare professional.", askBarbara: "A question about this article?", whatsapp: "Ask Barbara on WhatsApp", whatsappMessage: "Hello Barbara, I read the article “{title}” and would love to ask you for more information.",
  },
  es: {
    home: "Inicio", catalog: "La colección", eyebrow: "Journal Renacer", title: "Nutrición y bienestar", lead: "Notas, prácticas y reflexiones para un cuidado que empieza dentro y se entrelaza con la vida cotidiana.",
    learn: "Leer más", back: "Todos los artículos", empty: "Pronto encontrarás artículos aquí.", loading: "Cargando artículos…", missing: "Este artículo no está disponible.", notice: "Cada camino es personal: estas notas son informativas y no sustituyen el consejo de un profesional sanitario.", askBarbara: "¿Tienes alguna pregunta sobre este artículo?", whatsapp: "Pregunta a Barbara por WhatsApp", whatsappMessage: "Hola Barbara, he leído el artículo «{title}» y quisiera pedirte más información.",
  },
};

function initialLanguage(): Language {
  const stored = window.localStorage.getItem("renacer_language");
  if (stored === "it" || stored === "en" || stored === "es") return stored;
  const browser = (navigator.language || "it").slice(0, 2);
  return browser === "en" || browser === "es" ? browser : "it";
}

function titleFor(article: Article, language: Language) {
  return (language === "en" ? article.titleEn : language === "es" ? article.titleEs : article.titleIt)?.trim() || article.titleIt;
}

function bodyFor(article: Article, language: Language) {
  return (language === "en" ? article.bodyEn : language === "es" ? article.bodyEs : article.bodyIt)?.trim() || article.bodyIt;
}

function articleWhatsappHref(article: Article, language: Language) {
  const message = languageCopy[language].whatsappMessage.replace("{title}", titleFor(article, language));
  return `https://wa.me/34646072140?text=${encodeURIComponent(message)}`;
}

export default function Nutrition() {
  const [matches, params] = useRoute("/nutrition/:slug");
  const slug = matches ? params?.slug : undefined;
  const [language, setLanguage] = useState<Language>(initialLanguage);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const text = languageCopy[language];

  useEffect(() => {
    let cancelled = false;
    fetch(`${supabaseUrl}/rest/v1/nutrition_articles?select=id,slug,titleIt,bodyIt,titleEn,bodyEn,titleEs,bodyEs,imageUrl,createdAt,isPublished&isPublished=eq.1&order=createdAt.desc`, {
      headers: { apikey: supabasePublishableKey, Authorization: `Bearer ${supabasePublishableKey}` },
    })
      .then((response) => {
        if (!response.ok) throw new Error("Articles unavailable");
        return response.json();
      })
      .then((items: Article[]) => { if (!cancelled) setArticles(items); })
      .catch(() => { if (!cancelled) setFailed(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const article = useMemo(() => articles.find((item) => item.slug === slug), [articles, slug]);
  useEffect(() => {
    window.localStorage.setItem("renacer_language", language);
    document.documentElement.lang = language;
    document.title = article ? `${titleFor(article, language)} · Renacer Ibiza · Rituales de cuidados` : `${text.title} · Renacer Ibiza · Rituales de cuidados`;
    return () => { document.documentElement.lang = "it"; };
  }, [article, language, text.title]);

  return (
    <div className="site-shell nutrition-page">
      <div className="topline"><div className="container topline__inner"><span>Renacer Ibiza · Rituales de cuidados</span><span className="topline__note"><Leaf size={13} /> {text.eyebrow}</span></div></div>
      <header className="site-header">
        <div className="container header__inner">
          <a className="brand" href="/" aria-label="Renacer Ibiza · Rituales de cuidados, home">
            <img className="brand-logo-image" src="/images/logo-woman.png" alt="" />
            <span className="brand__text"><strong>Renacer Ibiza</strong><small>Rituales de cuidados</small></span>
          </a>
          <nav className="nutrition-nav" aria-label="Navigation">
            <a href="/">{text.home}</a><a href="/catalogue">{text.catalog}</a>
            <div className="nutrition-language" aria-label="Language">
              <Languages size={14} />
              {(["it", "en", "es"] as const).map((option) => (
                <button key={option} type="button" className={language === option ? "is-active" : ""} onClick={() => setLanguage(option)}>{option.toUpperCase()}</button>
              ))}
            </div>
          </nav>
        </div>
      </header>

      <main className="nutrition-main container">
        {!slug ? (
          <>
            <section className="nutrition-hero">
              <RenacerEmblem />
              <div><span className="section-eyebrow"><Leaf size={14} /> {text.eyebrow}</span><h1>{text.title}</h1><p>{text.lead}</p></div>
            </section>
            {loading ? <p className="nutrition-state">{text.loading}</p> : failed ? <p className="nutrition-state">{text.empty}</p> : articles.length === 0 ? <p className="nutrition-state">{text.empty}</p> : (
              <div className="journal-grid">
                {articles.map((item, index) => (
                  <article className="journal-card" key={item.id}>
                    <a className="journal-card__image" href={`/nutrition/${encodeURIComponent(item.slug)}`} aria-label={`${text.learn}: ${titleFor(item, language)}`}>
                      {item.imageUrl ? <img src={item.imageUrl} alt={titleFor(item, language)} loading="lazy" style={imageFrameStyle(item.imageUrl)} /> : <span className="journal-card__placeholder"><Leaf size={31} /></span>}
                      <span className="journal-card__index">{String(index + 1).padStart(2, "0")}</span>
                    </a>
                    <div className="journal-card__body"><span className="journal-card__eyebrow">{text.eyebrow}</span><h2>{titleFor(item, language)}</h2><p>{articleExcerpt(bodyFor(item, language), 42)}</p><a className="journal-card__link" href={`/nutrition/${encodeURIComponent(item.slug)}`}>{text.learn} <ArrowRight size={15} /></a></div>
                  </article>
                ))}
              </div>
            )}
            <p className="nutrition-disclaimer">{text.notice}</p>
          </>
        ) : loading ? (
          <p className="nutrition-state">{text.loading}</p>
        ) : !article ? (
          <section className="nutrition-missing"><BookOpen size={25} /><h1>{text.missing}</h1><a className="journal-card__link" href="/nutrition"><ArrowLeft size={15} /> {text.back}</a></section>
        ) : (
          <article className="nutrition-detail">
            <a className="journal-card__link nutrition-detail__back" href="/nutrition"><ArrowLeft size={15} /> {text.back}</a>
            {article.imageUrl ? <div className="nutrition-detail__image"><img src={article.imageUrl} alt={titleFor(article, language)} style={imageFrameStyle(article.imageUrl)} /></div> : null}
            <div className="nutrition-detail__content"><span className="section-eyebrow"><BookOpen size={14} /> {text.eyebrow}</span><h1>{titleFor(article, language)}</h1><div className="nutrition-detail__body">{renderArticleMarkup(bodyFor(article, language))}</div><a className="article-whatsapp" href={articleWhatsappHref(article, language)} target="_blank" rel="noopener noreferrer"><span className="article-whatsapp__mark" aria-hidden="true"><svg viewBox="0 0 32 32"><path d="M16 3.2A12.6 12.6 0 0 0 5.2 22.3L3.5 28.8l6.7-1.7A12.6 12.6 0 1 0 16 3.2Zm0 22.9a10.2 10.2 0 0 1-5.2-1.4l-.4-.2-3.9 1 1-3.8-.2-.4A10.2 10.2 0 1 1 16 26.1Zm5.6-7.7c-.3-.2-1.8-.9-2.1-1s-.5-.2-.7.2-.8 1-1 1.2-.4.2-.7.1a8.2 8.2 0 0 1-2.4-1.5 9 9 0 0 1-1.7-2.1c-.2-.3 0-.5.1-.7l.5-.5.3-.6c.1-.2 0-.4 0-.6l-1-2.3c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4s-1.2 1.2-1.2 2.8 1.2 3.2 1.4 3.5a14.2 14.2 0 0 0 5.5 4.9c.8.3 1.4.5 1.9.7.8.2 1.5.2 2.1.1.7-.1 1.8-.8 2.1-1.5s.3-1.3.2-1.5-.3-.3-.6-.5Z" /></svg></span><span><small>{text.askBarbara}</small><strong>{text.whatsapp}</strong></span><ArrowRight size={18} /></a><ShareBar title={titleFor(article, language)} path={`/nutrition/${encodeURIComponent(article.slug)}`} language={language}/><p className="nutrition-disclaimer">{text.notice}</p></div>
          </article>
        )}
      </main>

      <footer className="site-footer nutrition-footer"><div className="container footer__bottom"><span>© {new Date().getFullYear()} Renacer Ibiza · Rituales de cuidados</span><a href="/">Renacer Ibiza · Rituales de cuidados</a></div></footer>
    </div>
  );
}
