import { extractText, getDocumentProxy } from "unpdf";

export type ParsedDocument = {
  text: string;
  pageCount: number;
  pages: string[];
};

export async function parsePdfBuffer(buffer: ArrayBuffer): Promise<ParsedDocument> {
  const data = new Uint8Array(buffer);
  const pdf = await getDocumentProxy(data);
  const pageCount = pdf.numPages || 0;
  const result = await extractText(pdf, { mergePages: false });
  const pages = (result.text || []).map((p) => (typeof p === "string" ? p : String(p)));
  const text = pages.join("\n\n---PAGE BREAK---\n\n");
  return { text, pageCount: pageCount || pages.length, pages };
}

export function parsePlainText(raw: string): ParsedDocument {
  const cleaned = raw.replace(/\r\n/g, "\n").trim();
  const pages = cleaned
    .split(/\n\s*---PAGE BREAK---\s*\n|\f/)
    .map((p) => p.trim())
    .filter(Boolean);
  return {
    text: cleaned,
    pageCount: Math.max(1, pages.length),
    pages: pages.length ? pages : [cleaned],
  };
}
