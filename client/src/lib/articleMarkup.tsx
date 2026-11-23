import type { ReactNode } from "react";

const ALLOWED_TAGS = new Set(["P", "BR", "H2", "H3", "BLOCKQUOTE", "STRONG", "B", "EM", "I", "U", "A", "SPAN", "FONT", "UL", "OL", "LI"]);
const ALLOWED_STYLE = new Set(["color", "font-size", "font-family", "text-align"]);

function cleanStyle(style: string) {
  return style.split(";").map(rule => {
    const separator = rule.indexOf(":");
    if (separator < 0) return "";
    const property = rule.slice(0, separator).trim().toLowerCase();
    const value = rule.slice(separator + 1).trim();
    if (!ALLOWED_STYLE.has(property) || /[<>]|url\s*\(|expression\s*\(/i.test(value)) return "";
    if (property === "color" && !/^(#[\da-f]{3,8}|rgba?\([\d\s.,%]+\)|[a-z]{1,20})$/i.test(value)) return "";
    if (property === "font-size" && !/^\d+(?:\.\d+)?(?:px|pt|em|rem|%)$/.test(value)) return "";
    if (property === "font-family" && !/^[\w\s,'"-]{1,80}$/.test(value)) return "";
    if (property === "text-align" && !/^(left|right|center|justify)$/.test(value)) return "";
    return `${property}: ${value}`;
  }).filter(Boolean).join("; ");
}

/** Sanitizes rich-text HTML before storing it or placing it in the article page. */
export function sanitizeArticleHtml(html: string) {
  if (typeof DOMParser === "undefined") return html.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const parsed = new DOMParser().parseFromString(html, "text/html");
  const cleanNode = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) return (node.textContent ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    if (!(node instanceof HTMLElement)) return "";
    const tag = node.tagName;
    const children = Array.from(node.childNodes).map(cleanNode).join("");
    if (!ALLOWED_TAGS.has(tag)) return children;
    const outputTag = tag === "FONT" ? "SPAN" : tag.toLowerCase();
    const attrs: string[] = [];
    let rawStyle = node.getAttribute("style") ?? "";
    if (tag === "FONT") {
      const face = node.getAttribute("face");
      const color = node.getAttribute("color");
      const sizes: Record<string, string> = { "1": "10px", "2": "13px", "3": "16px", "4": "18px", "5": "24px", "6": "32px", "7": "40px" };
      if (face) rawStyle += `;font-family:${face}`;
      if (color) rawStyle += `;color:${color}`;
      const size = node.getAttribute("size");
      if (size && sizes[size]) rawStyle += `;font-size:${sizes[size]}`;
    }
    const style = cleanStyle(rawStyle);
    if (style) attrs.push(`style="${style.replace(/&/g, "&amp;").replace(/"/g, "&quot;")}"`);
    if (tag === "A") {
      try {
        const url = new URL(node.getAttribute("href") ?? "");
        if (url.protocol === "https:") attrs.push(`href="${url.href.replace(/&/g, "&amp;").replace(/"/g, "&quot;")}" target="_blank" rel="noopener noreferrer"`);
      } catch { /* discard unsafe links */ }
    }
    return `<${outputTag}${attrs.length ? ` ${attrs.join(" ")}` : ""}>${children}</${outputTag}>`;
  };
  return Array.from(parsed.body.childNodes).map(cleanNode).join("");
}

export function isRichArticleHtml(text: string) {
  return /<(?:p|br|h2|h3|blockquote|strong|b|em|i|u|a|span|font|ul|ol|li)(?:\s|>|\/)/i.test(text);
}

function inline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|\[[^\]]+\]\((https:\/\/[^\s)]+)\))/g;
  let cursor = 0;
  let match: RegExpExecArray | null;
  let index = 0;
  while ((match = pattern.exec(text))) {
    if (match.index > cursor) nodes.push(text.slice(cursor, match.index));
    const token = match[0];
    if (token.startsWith("**")) nodes.push(<strong key={`${keyPrefix}-b-${index}`}>{token.slice(2, -2)}</strong>);
    else {
      const link = token.match(/^\[([^\]]+)\]\((https:\/\/[^\s)]+)\)$/);
      if (link) nodes.push(<a key={`${keyPrefix}-a-${index}`} href={link[2]} target="_blank" rel="noopener noreferrer">{link[1]}</a>);
      else nodes.push(token);
    }
    cursor = match.index + token.length;
    index += 1;
  }
  if (cursor < text.length) nodes.push(text.slice(cursor));
  return nodes;
}
function decodeEntities(text: string) {
  return text.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}
export function plainArticleText(text: string) {
  if (isRichArticleHtml(text)) return decodeEntities(text.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
  return text.replace(/^#{1,2}\s+/gm, "").replace(/^>\s?/gm, "").replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\[([^\]]+)\]\(https:\/\/[^\s)]+\)/g, "$1").replace(/\s+/g, " ").trim();
}
export function articleExcerpt(text: string, wordCount = 36) {
  const words = plainArticleText(text).split(" ").filter(Boolean);
  return words.length > wordCount ? `${words.slice(0, wordCount).join(" ")}…` : words.join(" ");
}
export function renderArticleMarkup(text: string): ReactNode[] {
  if (isRichArticleHtml(text)) return [<div key="rich-article" dangerouslySetInnerHTML={{ __html: sanitizeArticleHtml(text) }} />];
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let paragraph: string[] = [];
  let blockIndex = 0;
  const flush = () => {
    const value = paragraph.join("\n").trim();
    if (value) blocks.push(<p key={`p-${blockIndex++}`}>{value.split("\n").map((line, index) => <span key={`line-${index}`}>{index > 0 ? <br /> : null}{inline(line, `p-${blockIndex}-${index}`)}</span>)}</p>);
    paragraph = [];
  };
  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) return flush();
    const heading = trimmed.match(/^(#{1,2})\s+(.+)$/);
    if (heading) {
      flush();
      const Tag = heading[1].length === 1 ? "h2" : "h3";
      blocks.push(<Tag key={`h-${blockIndex++}`}>{inline(heading[2], `h-${blockIndex}`)}</Tag>);
      return;
    }
    if (trimmed.startsWith(">")) {
      flush();
      blocks.push(<aside className="article-callout" key={`quote-${blockIndex++}`}>{inline(trimmed.replace(/^>\s?/, ""), `q-${blockIndex}`)}</aside>);
      return;
    }
    paragraph.push(line);
  });
  flush();
  return blocks;
}

/** Converts the existing lightweight Markdown syntax to editable HTML for legacy posts. */
export function legacyArticleToEditorHtml(text: string) {
  const escape = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return text.split(/\r?\n/).map(line => {
    const heading = line.match(/^(#{1,2})\s+(.+)$/);
    if (heading) {
      const tag = heading[1].length === 1 ? "h2" : "h3";
      return `<${tag}>${escape(heading[2])}</${tag}>`;
    }
    const quote = line.match(/^>\s?(.*)$/);
    const content = escape(quote ? quote[1] : line).replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>").replace(/\[([^\]]+)\]\((https:\/\/[^\s)]+)\)/g, '<a href="$2">$1</a>');
    return quote ? `<blockquote>${content}</blockquote>` : content ? `<p>${content}</p>` : "<p><br></p>";
  }).join("");
}
