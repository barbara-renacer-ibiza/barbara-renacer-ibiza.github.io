import type { ReactNode } from "react";

function inline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|\[[^\]]+\]\((https:\/\/[^\s)]+)\))/g;
  let cursor = 0;
  let match: RegExpExecArray | null;
  let index = 0;
  while ((match = pattern.exec(text))) {
    if (match.index > cursor) nodes.push(text.slice(cursor, match.index));
    const token = match[0];
    if (token.startsWith("**")) {
      nodes.push(<strong key={`${keyPrefix}-b-${index}`}>{token.slice(2, -2)}</strong>);
    } else {
      const link = token.match(/^\[([^\]]+)\]\((https:\/\/[^\s)]+)\)$/);
      if (link) {
        nodes.push(
          <a key={`${keyPrefix}-a-${index}`} href={link[2]} target="_blank" rel="noreferrer">
            {link[1]}
          </a>
        );
      } else nodes.push(token);
    }
    cursor = match.index + token.length;
    index += 1;
  }
  if (cursor < text.length) nodes.push(text.slice(cursor));
  return nodes;
}

export function plainArticleText(text: string) {
  return text
    .replace(/^#{1,2}\s+/gm, "")
    .replace(/^>\s?/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\[([^\]]+)\]\(https:\/\/[^\s)]+\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

export function articleExcerpt(text: string, wordCount = 36) {
  const words = plainArticleText(text).split(" ").filter(Boolean);
  return words.length > wordCount ? `${words.slice(0, wordCount).join(" ")}…` : words.join(" ");
}

export function renderArticleMarkup(text: string): ReactNode[] {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let paragraph: string[] = [];
  let blockIndex = 0;
  const flush = () => {
    const value = paragraph.join("\n").trim();
    if (value) {
      blocks.push(
        <p key={`p-${blockIndex++}`}>
          {value.split("\n").map((line, index) => (
            <span key={`line-${index}`}>
              {index > 0 ? <br /> : null}
              {inline(line, `p-${blockIndex}-${index}`)}
            </span>
          ))}
        </p>
      );
    }
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
      blocks.push(
        <aside className="article-callout" key={`quote-${blockIndex++}`}>
          {inline(trimmed.replace(/^>\s?/, ""), `q-${blockIndex}`)}
        </aside>
      );
      return;
    }
    paragraph.push(line);
  });
  flush();
  return blocks;
}
