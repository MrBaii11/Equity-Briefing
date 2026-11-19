module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[project]/src/lib/data/seeds.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DEMO_TICKERS",
    ()=>DEMO_TICKERS,
    "SEEDS",
    ()=>SEEDS,
    "getSeed",
    ()=>getSeed
]);
const DEMO_TICKERS = [
    {
        ticker: "ORCL",
        name: "Oracle Corporation",
        exchange: "NYSE"
    },
    {
        ticker: "AAPL",
        name: "Apple Inc.",
        exchange: "NASDAQ"
    },
    {
        ticker: "CAT",
        name: "Caterpillar Inc.",
        exchange: "NYSE"
    },
    {
        ticker: "MSFT",
        name: "Microsoft Corporation",
        exchange: "NASDAQ"
    },
    {
        ticker: "JPM",
        name: "JPMorgan Chase & Co.",
        exchange: "NYSE"
    }
];
const ORCL = {
    identity: {
        ticker: "ORCL",
        name: "Oracle Corporation",
        exchange: "NYSE",
        cik: "0001341439",
        sector: "Technology",
        industry: "Software—Infrastructure",
        description: "Oracle provides database, cloud applications, and infrastructure services to enterprises worldwide, with growing emphasis on cloud infrastructure (OCI) and multi-cloud database deployments."
    },
    quote: {
        price: 185,
        marketCap: 520_000_000_000,
        peTrailing: 38,
        peForward: 28,
        psTrailing: 9.2,
        fiftyTwoWeekHigh: 198,
        fiftyTwoWeekLow: 118,
        currency: "USD",
        asOf: "2026-07-21"
    },
    periods: [
        {
            period: "FY2022",
            revenue: 42.4e9,
            grossProfit: 33.6e9,
            operatingIncome: 10.9e9,
            netIncome: 6.7e9,
            freeCashFlow: 5.0e9,
            totalDebt: 75e9,
            cash: 21e9,
            equity: 5.2e9,
            sharesOutstanding: 2.7e9
        },
        {
            period: "FY2023",
            revenue: 50.0e9,
            grossProfit: 36.4e9,
            operatingIncome: 13.1e9,
            netIncome: 8.5e9,
            freeCashFlow: 8.5e9,
            totalDebt: 86e9,
            cash: 9.8e9,
            equity: 1.9e9,
            sharesOutstanding: 2.73e9
        },
        {
            period: "FY2024",
            revenue: 53.0e9,
            grossProfit: 37.8e9,
            operatingIncome: 15.4e9,
            netIncome: 10.5e9,
            freeCashFlow: 11.8e9,
            totalDebt: 88e9,
            cash: 10.5e9,
            equity: 6.0e9,
            sharesOutstanding: 2.76e9
        },
        {
            period: "FY2025",
            revenue: 57.4e9,
            grossProfit: 40.8e9,
            operatingIncome: 17.7e9,
            netIncome: 12.4e9,
            freeCashFlow: 4.2e9,
            totalDebt: 92e9,
            cash: 11.2e9,
            equity: 10.5e9,
            sharesOutstanding: 2.8e9
        }
    ],
    news: [
        {
            id: "orcl-n1",
            title: "Oracle expands multi-cloud database agreements with hyperscalers",
            summary: "Oracle highlighted remaining performance obligations tied to cloud infrastructure and database services as demand for AI training and inference capacity rose.",
            publishedAt: "2026-07-10",
            source: "Company / wire",
            category: "orders"
        },
        {
            id: "orcl-n2",
            title: "Capex climb for OCI capacity draws investor focus",
            summary: "Analysts noted rising capital expenditure to build GPU-ready data centers, compressing near-term free cash flow while supporting longer-dated backlog conversion.",
            publishedAt: "2026-06-28",
            source: "Market commentary",
            category: "earnings"
        },
        {
            id: "orcl-n3",
            title: "Enterprise ERP renewals remain sticky amid cloud migrations",
            summary: "Customers continuing Fusion and NetSuite migrations were cited as supporting high switching costs in applications.",
            publishedAt: "2026-05-15",
            source: "Trade press",
            category: "product"
        }
    ],
    filings: [
        {
            id: "orcl-f1",
            form: "10-K",
            filedAt: "2025-06-18",
            section: "Business / Culture",
            text: "We compete on the basis of technology, standards compliance, performance, quality of product and service, and price. Our culture emphasizes engineering depth, long-term customer relationships, and delivering mission-critical reliability for databases and applications.",
            url: "https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0001341439"
        },
        {
            id: "orcl-f2",
            form: "10-K",
            filedAt: "2025-06-18",
            section: "Risk Factors",
            text: "Our business depends on our ability to keep pace with rapid technological developments and evolving industry standards. Intensifying competition in cloud infrastructure, customer concentration in large cloud contracts, and execution risk on capacity delivery could materially affect results.",
            url: "https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0001341439"
        },
        {
            id: "orcl-f3",
            form: "10-Q",
            filedAt: "2025-12-20",
            section: "MD&A — Remaining Performance Obligations",
            text: "Total remaining performance obligations were approximately $99 billion, with a substantial portion expected to be recognized as revenue over multi-year cloud infrastructure and license support contracts if customers take capacity as contracted.",
            url: "https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0001341439"
        }
    ],
    peers: [
        {
            ticker: "MSFT",
            pe: 35,
            ps: 12
        },
        {
            ticker: "SAP",
            pe: 40,
            ps: 8
        },
        {
            ticker: "CRM",
            pe: 45,
            ps: 7
        }
    ]
};
const AAPL = {
    identity: {
        ticker: "AAPL",
        name: "Apple Inc.",
        exchange: "NASDAQ",
        cik: "0000320193",
        sector: "Technology",
        industry: "Consumer Electronics",
        description: "Apple designs and sells consumer electronics, software, and services anchored by the iPhone ecosystem."
    },
    quote: {
        price: 214,
        marketCap: 3.2e12,
        peTrailing: 33,
        peForward: 29,
        psTrailing: 8.1,
        fiftyTwoWeekHigh: 260,
        fiftyTwoWeekLow: 169,
        currency: "USD",
        asOf: "2026-07-21"
    },
    periods: [
        {
            period: "FY2022",
            revenue: 394e9,
            grossProfit: 170e9,
            netIncome: 99e9,
            freeCashFlow: 111e9,
            totalDebt: 120e9,
            cash: 48e9,
            equity: 50e9,
            sharesOutstanding: 16e9
        },
        {
            period: "FY2023",
            revenue: 383e9,
            grossProfit: 169e9,
            netIncome: 97e9,
            freeCashFlow: 99e9,
            totalDebt: 111e9,
            cash: 61e9,
            equity: 62e9,
            sharesOutstanding: 15.5e9
        },
        {
            period: "FY2024",
            revenue: 391e9,
            grossProfit: 180e9,
            netIncome: 93e9,
            freeCashFlow: 108e9,
            totalDebt: 106e9,
            cash: 65e9,
            equity: 56e9,
            sharesOutstanding: 15.1e9
        },
        {
            period: "FY2025",
            revenue: 400e9,
            grossProfit: 186e9,
            netIncome: 97e9,
            freeCashFlow: 110e9,
            totalDebt: 100e9,
            cash: 55e9,
            equity: 58e9,
            sharesOutstanding: 14.9e9
        }
    ],
    news: [
        {
            id: "aapl-n1",
            title: "Services revenue mix continues to rise",
            summary: "Higher-margin services offset hardware cycle softness in several regions.",
            publishedAt: "2026-07-01",
            source: "Earnings coverage",
            category: "earnings"
        },
        {
            id: "aapl-n2",
            title: "Regulatory scrutiny on App Store terms persists",
            summary: "Antitrust and DMA-related actions remain a headline risk for services margins.",
            publishedAt: "2026-06-12",
            source: "Regulatory news",
            category: "regulatory"
        }
    ],
    filings: [
        {
            id: "aapl-f1",
            form: "10-K",
            filedAt: "2025-11-01",
            section: "Business",
            text: "The Company is committed to bringing the best user experience through innovative hardware, software, and services. Design, privacy, and ecosystem integration are central to how teams operate across product groups."
        },
        {
            id: "aapl-f2",
            form: "10-K",
            filedAt: "2025-11-01",
            section: "Risk Factors",
            text: "The Company faces intense competition, supply chain concentration, and increasing regulatory obligations that could adversely affect Services and App Store economics."
        }
    ],
    peers: [
        {
            ticker: "MSFT",
            pe: 35,
            ps: 12
        },
        {
            ticker: "GOOGL",
            pe: 22,
            ps: 6
        },
        {
            ticker: "AMZN",
            pe: 38,
            ps: 3.2
        }
    ]
};
const CAT = {
    identity: {
        ticker: "CAT",
        name: "Caterpillar Inc.",
        exchange: "NYSE",
        cik: "0000018230",
        sector: "Industrials",
        industry: "Farm & Heavy Construction Machinery",
        description: "Caterpillar manufactures construction and mining equipment, engines, and related services with a global dealer network."
    },
    quote: {
        price: 390,
        marketCap: 190e9,
        peTrailing: 18,
        peForward: 17,
        psTrailing: 2.8,
        fiftyTwoWeekHigh: 420,
        fiftyTwoWeekLow: 280,
        currency: "USD",
        asOf: "2026-07-21"
    },
    periods: [
        {
            period: "FY2022",
            revenue: 59e9,
            netIncome: 6.7e9,
            freeCashFlow: 5.1e9,
            totalDebt: 37e9,
            cash: 7e9,
            equity: 16e9,
            sharesOutstanding: 0.52e9
        },
        {
            period: "FY2023",
            revenue: 67e9,
            netIncome: 10.3e9,
            freeCashFlow: 8.2e9,
            totalDebt: 38e9,
            cash: 7e9,
            equity: 19e9,
            sharesOutstanding: 0.51e9
        },
        {
            period: "FY2024",
            revenue: 64e9,
            netIncome: 10.8e9,
            freeCashFlow: 9.0e9,
            totalDebt: 36e9,
            cash: 5.5e9,
            equity: 20e9,
            sharesOutstanding: 0.49e9
        },
        {
            period: "FY2025",
            revenue: 63e9,
            netIncome: 10.0e9,
            freeCashFlow: 8.5e9,
            totalDebt: 35e9,
            cash: 5e9,
            equity: 21e9,
            sharesOutstanding: 0.48e9
        }
    ],
    news: [
        {
            id: "cat-n1",
            title: "Mining and energy project backlog supports equipment demand",
            summary: "Dealers reported healthy orders in mining while construction mixed by region.",
            publishedAt: "2026-06-20",
            source: "Industry press",
            category: "orders"
        }
    ],
    filings: [
        {
            id: "cat-f1",
            form: "10-K",
            filedAt: "2025-02-14",
            section: "Business",
            text: "Our strategy is to provide products, services and solutions that help customers build a better, more sustainable world. Dealer partnerships and product support are core cultural strengths."
        },
        {
            id: "cat-f2",
            form: "10-K",
            filedAt: "2025-02-14",
            section: "Risk Factors",
            text: "Our business is subject to cyclical demand tied to commodity prices, construction activity, and global trade policy."
        }
    ],
    peers: [
        {
            ticker: "DE",
            pe: 16,
            ps: 2.2
        },
        {
            ticker: "CMI",
            pe: 15,
            ps: 1.8
        }
    ]
};
const SEEDS = {
    ORCL,
    AAPL,
    CAT
};
function getSeed(ticker) {
    return SEEDS[ticker.toUpperCase()] ?? null;
}
}),
"[project]/src/lib/data/resolve.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "resolveCompany",
    ()=>resolveCompany,
    "searchCompanies",
    ()=>searchCompanies
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$data$2f$seeds$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/data/seeds.ts [app-route] (ecmascript)");
;
const YAHOO_SEARCH = "https://query1.finance.yahoo.com/v1/finance/search";
async function searchCompanies(query) {
    const q = query.trim();
    if (!q) return __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$data$2f$seeds$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["DEMO_TICKERS"];
    const local = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$data$2f$seeds$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["DEMO_TICKERS"].filter((t)=>t.ticker.toLowerCase().includes(q.toLowerCase()) || t.name.toLowerCase().includes(q.toLowerCase()));
    try {
        const url = `${YAHOO_SEARCH}?q=${encodeURIComponent(q)}&quotesCount=8&newsCount=0`;
        const res = await fetch(url, {
            headers: {
                "User-Agent": "equity-briefing/0.1"
            },
            next: {
                revalidate: 3600
            }
        });
        if (!res.ok) throw new Error(`search ${res.status}`);
        const data = await res.json();
        const remote = (data.quotes ?? []).filter((x)=>x.symbol && (x.quoteType === "EQUITY" || !x.quoteType)).map((x)=>({
                ticker: x.symbol.toUpperCase(),
                name: x.longname || x.shortname || x.symbol,
                exchange: x.exchange || "US"
            }));
        const merged = [
            ...local,
            ...remote
        ];
        const seen = new Set();
        return merged.filter((r)=>{
            if (seen.has(r.ticker)) return false;
            seen.add(r.ticker);
            return true;
        }).slice(0, 10);
    } catch  {
        return local.length ? local : __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$data$2f$seeds$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["DEMO_TICKERS"].slice(0, 5);
    }
}
async function resolveCompany(tickerOrName) {
    const raw = tickerOrName.trim();
    const asTicker = raw.toUpperCase().replace(/[^A-Z0-9.-]/g, "");
    const seed = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$data$2f$seeds$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getSeed"])(asTicker);
    if (seed) return {
        ...seed.identity
    };
    const results = await searchCompanies(raw);
    const match = results.find((r)=>r.ticker === asTicker) || results.find((r)=>r.name.toLowerCase().includes(raw.toLowerCase())) || results[0];
    if (!match) {
        throw new Error(`Could not resolve company: ${raw}`);
    }
    return {
        ticker: match.ticker,
        name: match.name,
        exchange: match.exchange,
        description: undefined
    };
}
}),
"[project]/src/app/api/search/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$data$2f$resolve$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/data/resolve.ts [app-route] (ecmascript)");
;
async function GET(request) {
    const q = request.nextUrl.searchParams.get("q") || "";
    const results = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$data$2f$resolve$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["searchCompanies"])(q);
    return Response.json({
        results
    });
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__1y492jo._.js.map