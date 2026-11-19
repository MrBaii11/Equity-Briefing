import type { NewsItem } from "../types";
import { getSeed } from "./seeds";

type YahooNews = {
  news?: {
    uuid?: string;
    title?: string;
    publisher?: string;
    link?: string;
    providerPublishTime?: number;
    summary?: string;
  }[];
};

function categorize(title: string): NewsItem["category"] {
  const t = title.toLowerCase();
  if (/lawsuit|litigation|sue|settlement/.test(t)) return "litigation";
  if (/sec|doj|regulator|antitrust|fda|ftc/.test(t)) return "regulatory";
  if (/backlog|order|contract|deal|rpo|booking/.test(t)) return "orders";
  if (/buyback|repurchase|dividend/.test(t)) return "buyback";
  if (/earnings|revenue|guidance|eps|profit/.test(t)) return "earnings";
  if (/product|launch|cloud|ai|chip|model/.test(t)) return "product";
  return "other";
}

export async function fetchNews(ticker: string, name: string): Promise<NewsItem[]> {
  const seed = getSeed(ticker);
  try {
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(ticker)}&quotesCount=0&newsCount=12`;
    const res = await fetch(url, {
      headers: { "User-Agent": "equity-briefing/0.1" },
      next: { revalidate: 1800 },
    });
    if (!res.ok) throw new Error("news fetch failed");
    const data = (await res.json()) as YahooNews;
    const items: NewsItem[] = (data.news ?? []).map((n, i) => ({
      id: n.uuid || `${ticker}-news-${i}`,
      title: n.title || "Untitled",
      summary: n.summary || n.title || "",
      publishedAt: n.providerPublishTime
        ? new Date(n.providerPublishTime * 1000).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10),
      source: n.publisher || "Yahoo Finance",
      url: n.link,
      category: categorize(n.title || ""),
    }));

    if (items.length) {
      // Prefer live news; append unique seed items for demo depth
      const titles = new Set(items.map((x) => x.title.toLowerCase()));
      const extras = (seed?.news ?? []).filter(
        (s) => !titles.has(s.title.toLowerCase()),
      );
      return [...items, ...extras].slice(0, 15);
    }
  } catch {
    // fall through
  }

  if (seed?.news) return [...seed.news];

  return [
    {
      id: `${ticker}-fallback-news`,
      title: `${name} — limited live news available`,
      summary:
        "Live news feed was unavailable. Analysis uses filings and financial statements; refresh later for catalysts.",
      publishedAt: new Date().toISOString().slice(0, 10),
      source: "system",
      category: "other",
    },
  ];
}
