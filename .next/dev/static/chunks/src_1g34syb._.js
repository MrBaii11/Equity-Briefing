(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/lib/i18n.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "messages",
    ()=>messages
]);
const messages = {
    en: {
        brand: "Equity Briefing",
        tagline: "Upload a filing or enter a ticker — get an evidence-linked analyst deck, not black-box tips.",
        heroSupport: "V1 Agent reads your PDF/TXT 10-K style filing, extracts substance into tables and charts, and streams a PPT-like briefing with clickable evidence.",
        placeholder: "Ticker or company name (e.g. ORCL, Apple)",
        generate: "Generate briefing",
        generating: "Generating…",
        newBriefing: "← New briefing",
        refresh: "Refresh",
        allEvidence: "All evidence",
        evidence: "Evidence",
        sourcesFigures: "Sources & figures",
        close: "Close",
        noEvidence: "No evidence selected.",
        openSource: "Open source",
        accessChannel: "Access",
        asOf: "as of",
        starting: "Starting…",
        cached: "cached 24h",
        evidenceItems: "evidence items",
        modeUpload: "Upload filing",
        modeTicker: "Ticker research",
        uploadHint: "PDF or TXT · max 20MB · text-layer PDFs work best",
        uploadCta: "Analyze filing",
        uploadDrop: "Drop a filing here, or click to choose",
        trySample: "Try sample 10-K excerpt",
        optionalTicker: "Ticker (optional)",
        optionalCompany: "Company name (optional)",
        deckPages: "Deck pages",
        parseConfidence: "Parse confidence",
        pages: "pages",
        waitingSlides: "Slides will appear as the agent finishes each page…",
        prevSlide: "Previous",
        nextSlide: "Next",
        slideEvidence: "Evidence on this slide",
        mgmtNarrative: "Management narrative",
        numbersCheck: "Numbers check",
        filingFailed: "Filing analysis failed",
        analyzingFiling: "Analyzing filing…",
        sectionProfile: "1. Company profile",
        sectionProfileSub: "History, culture, segments",
        sectionQuant: "2. Quantitative checkup",
        sectionNews: "3. News & catalysts",
        sectionNewsSub: "Clustered headlines with takeaways",
        sectionMoat: "4. Moat map",
        sectionMoatSub: "Business / product advantages + erosion risks",
        sectionValuation: "5–6. Outlook & valuation",
        sectionValuationSub: "Scenarios, relative multiples, today vs forward optionality",
        sectionRisk: "7. Risk rating",
        sectionAdvice: "8. Investment advice",
        sectionAdviceSub: "Conditional — not a buy/sell shout",
        history: "History & positioning",
        culture: "Culture & operating style",
        segments: "Segments",
        trends: "Trends & interpretation",
        redFlags: "Red flags",
        growthTable: "Period growth & margins",
        chartRevenue: "Revenue trend",
        chartEarnings: "Earnings & free cash flow",
        chartRange: "52-week price position",
        chartScenarios: "Scenario implied price bands",
        chartPeers: "P/E vs peers",
        erosion: "Erosion / stress tests",
        relativeVal: "Relative valuation",
        todayFund: "Today’s price vs fundamentals",
        forwardOpt: "Forward optionality (not the same as ‘cheap today’)",
        investorFit: "Investor fit:",
        footer: "Equity Briefing is a research prototype. Uploaded filings stay in your analysis session; figures may be incomplete for scanned PDFs. Always verify against primary sources.",
        langToggle: "中文",
        period: "Period",
        revenue: "Revenue",
        netIncome: "Net income",
        fcf: "FCF",
        grossMargin: "Gross margin",
        roe: "ROE",
        debtEquity: "D/E",
        revYoY: "Rev YoY",
        niYoY: "NI YoY",
        conf: "conf",
        strength: "strength",
        multiples: "Multiples",
        peerMedianPe: "peer median P/E",
        reportFailed: "Report request failed"
    },
    zh: {
        brand: "Equity Briefing",
        tagline: "上传财报或输入代码——生成证据绑定的分析师 Deck，而非黑盒荐股。",
        heroSupport: "V1 Agent 读取你的 PDF/TXT（10-K 风格），抽取实质信息为表格与图表，并流式输出可翻页的 PPT 式简报，结论可点开追溯证据。",
        placeholder: "输入代码或公司名（如 ORCL、Apple）",
        generate: "生成简报",
        generating: "生成中…",
        newBriefing: "← 新简报",
        refresh: "刷新",
        allEvidence: "全部证据",
        evidence: "证据",
        sourcesFigures: "来源与数据",
        close: "关闭",
        noEvidence: "未选择证据。",
        openSource: "打开来源",
        accessChannel: "访问渠道",
        asOf: "截至",
        starting: "正在启动…",
        cached: "24小时缓存",
        evidenceItems: "条证据",
        modeUpload: "上传财报",
        modeTicker: "代码研究",
        uploadHint: "PDF 或 TXT · 最大 20MB · 文本层 PDF 效果最佳",
        uploadCta: "分析财报",
        uploadDrop: "拖入财报，或点击选择文件",
        trySample: "试用示例 10-K 摘录",
        optionalTicker: "股票代码（可选）",
        optionalCompany: "公司名（可选）",
        deckPages: "简报页",
        parseConfidence: "解析置信度",
        pages: "页",
        waitingSlides: "Agent 完成每一页后将在此出现…",
        prevSlide: "上一页",
        nextSlide: "下一页",
        slideEvidence: "本页证据",
        mgmtNarrative: "管理层叙事",
        numbersCheck: "数字核对",
        filingFailed: "财报分析失败",
        analyzingFiling: "正在分析财报…",
        sectionProfile: "1. 公司画像",
        sectionProfileSub: "沿革、文化、业务分部",
        sectionQuant: "2. 定量体检",
        sectionNews: "3. 新闻与催化",
        sectionNewsSub: "按主题聚类的要闻与结论",
        sectionMoat: "4. 护城河地图",
        sectionMoatSub: "业务/产品优势与侵蚀风险",
        sectionValuation: "5–6. 前景与估值",
        sectionValuationSub: "情景、相对估值、今日基本面 vs 远期期权价值",
        sectionRisk: "7. 风险等级",
        sectionAdvice: "8. 投资建议",
        sectionAdviceSub: "条件化建议——非无条件喊单",
        history: "沿革与定位",
        culture: "企业文化与经营风格",
        segments: "业务分部",
        trends: "趋势与解读",
        redFlags: "风险信号",
        growthTable: "分年增长与利润率",
        chartRevenue: "营收趋势",
        chartEarnings: "利润与自由现金流",
        chartRange: "52周价格位置",
        chartScenarios: "情景隐含股价区间",
        chartPeers: "市盈率同行对比",
        erosion: "侵蚀 / 压力测试",
        relativeVal: "相对估值",
        todayFund: "今日价格 vs 基本面",
        forwardOpt: "远期期权价值（≠今日一定便宜）",
        investorFit: "适合投资者：",
        footer: "Equity Briefing 为研究原型。上传财报用于当次分析；扫描件 PDF 可能抽取不全。决策前请核对原始文件。",
        langToggle: "EN",
        period: "期间",
        revenue: "营收",
        netIncome: "净利润",
        fcf: "自由现金流",
        grossMargin: "毛利率",
        roe: "ROE",
        debtEquity: "资产负债率(D/E)",
        revYoY: "营收同比",
        niYoY: "净利同比",
        conf: "置信度",
        strength: "强度",
        multiples: "估值倍数",
        peerMedianPe: "同行中位 P/E",
        reportFailed: "简报请求失败"
    }
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/LocaleProvider.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "LocaleProvider",
    ()=>LocaleProvider,
    "useLocale",
    ()=>useLocale
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$i18n$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/i18n.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
"use client";
;
;
const LocaleContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])(null);
function LocaleProvider({ children }) {
    _s();
    const [locale, setLocaleState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("zh");
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "LocaleProvider.useEffect": ()=>{
            try {
                const saved = localStorage.getItem("eb-locale");
                if (saved === "en" || saved === "zh") setLocaleState(saved);
            } catch  {
            /* ignore */ }
        }
    }["LocaleProvider.useEffect"], []);
    const setLocale = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "LocaleProvider.useCallback[setLocale]": (l)=>{
            setLocaleState(l);
            try {
                localStorage.setItem("eb-locale", l);
            } catch  {
            /* ignore */ }
        }
    }["LocaleProvider.useCallback[setLocale]"], []);
    const toggleLocale = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "LocaleProvider.useCallback[toggleLocale]": ()=>{
            setLocale(locale === "zh" ? "en" : "zh");
        }
    }["LocaleProvider.useCallback[toggleLocale]"], [
        locale,
        setLocale
    ]);
    const t = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "LocaleProvider.useCallback[t]": (key)=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$i18n$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["messages"][locale][key] ?? __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$i18n$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["messages"].en[key]
    }["LocaleProvider.useCallback[t]"], [
        locale
    ]);
    const value = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "LocaleProvider.useMemo[value]": ()=>({
                locale,
                setLocale,
                toggleLocale,
                t
            })
    }["LocaleProvider.useMemo[value]"], [
        locale,
        setLocale,
        toggleLocale,
        t
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(LocaleContext.Provider, {
        value: value,
        children: children
    }, void 0, false, {
        fileName: "[project]/src/components/LocaleProvider.tsx",
        lineNumber: 58,
        columnNumber: 5
    }, this);
}
_s(LocaleProvider, "S/SxgS5tvRI3RKfAulZlBTBta60=");
_c = LocaleProvider;
function useLocale() {
    _s1();
    const ctx = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(LocaleContext);
    if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
    return ctx;
}
_s1(useLocale, "/dMy7t63NXD4eYACoT93CePwGrg=");
var _c;
__turbopack_context__.k.register(_c, "LocaleProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=src_1g34syb._.js.map