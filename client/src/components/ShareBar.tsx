import { useState } from "react";
import { Check, Copy, Facebook, Instagram, MessageCircle, Share2 } from "lucide-react";

type ShareBarProps = { title: string; path: string; language?: "it" | "en" | "es" };

export default function ShareBar({ title, path, language = "it" }: ShareBarProps) {
  const [copied, setCopied] = useState(false);
  const url = new URL(path, window.location.origin).toString();
  const labels = {
    it: { share: "Condividi", copy: "Copia il link", copied: "Link copiato", facebook: "Condividi su Facebook", whatsapp: "Condividi su WhatsApp", instagram: "Condividi su Instagram", instagramCopied: "Link copiato: incollalo su Instagram" },
    en: { share: "Share", copy: "Copy link", copied: "Link copied", facebook: "Share on Facebook", whatsapp: "Share on WhatsApp", instagram: "Share on Instagram", instagramCopied: "Link copied: paste it into Instagram" },
    es: { share: "Compartir", copy: "Copiar enlace", copied: "Enlace copiado", facebook: "Compartir en Facebook", whatsapp: "Compartir en WhatsApp", instagram: "Compartir en Instagram", instagramCopied: "Enlace copiado: pégalo en Instagram" },
  }[language];
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      const input = document.createElement("textarea");
      input.value = url;
      input.setAttribute("readonly", "");
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      input.remove();
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    }
  };
  const shareOnInstagram = async () => {
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, text: title, url });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    await copyLink();
    window.setTimeout(() => setCopied(false), 3200);
  };
  const shareText = `${title} — ${url}`;
  return <div className="share-bar" aria-label={labels.share}>
    <span><Share2 size={14} /> {labels.share}</span>
    <button type="button" onClick={() => void copyLink()} aria-label={copied ? labels.copied : labels.copy}>{copied ? <Check size={14} /> : <Copy size={14} />} {copied ? labels.copied : labels.copy}</button>
    <a href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer" aria-label={labels.whatsapp}><MessageCircle size={14} /> WhatsApp</a>
    <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer" aria-label={labels.facebook}><Facebook size={14} /> Facebook</a>
    <button type="button" onClick={() => void shareOnInstagram()} aria-label={labels.instagram}><Instagram size={14} /> Instagram</button>
  </div>;
}
