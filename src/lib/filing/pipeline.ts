import type { FilingStreamEvent } from "../types";
import { parsePdfBuffer, parsePlainText } from "./parsePdf";
import { extractFiling } from "./extract";
import { validateExtract } from "./validate";
import { buildDeck } from "./buildDeck";
import { SAMPLE_FILING_NAME, SAMPLE_FILING_TEXT } from "./sample";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function* generateFilingDeckStream(input: {
  buffer?: ArrayBuffer;
  text?: string;
  fileName: string;
  mimeType?: string;
  companyName?: string;
  ticker?: string;
  useSample?: boolean;
}): AsyncGenerator<FilingStreamEvent> {
  try {
    yield {
      type: "status",
      message: "Reading document…",
      messageZh: "正在读取文件…",
    };

    let fileName = input.fileName;
    let doc;
    if (input.useSample) {
      fileName = SAMPLE_FILING_NAME;
      doc = parsePlainText(SAMPLE_FILING_TEXT);
    } else if (input.text != null) {
      doc = parsePlainText(input.text);
    } else if (input.buffer) {
      const isPdf =
        input.mimeType === "application/pdf" ||
        fileName.toLowerCase().endsWith(".pdf");
      if (isPdf) {
        yield {
          type: "status",
          message: "Extracting PDF text layer…",
          messageZh: "正在提取 PDF 文本层…",
        };
        doc = await parsePdfBuffer(input.buffer);
      } else {
        const decoded = new TextDecoder().decode(input.buffer);
        doc = parsePlainText(decoded);
      }
    } else {
      throw new Error("No document provided");
    }

    if (!doc.text || doc.text.replace(/\s/g, "").length < 80) {
      throw new Error(
        "Could not extract usable text. If this is a scanned PDF, OCR is planned for v2 — try a text-based PDF or the sample filing.",
      );
    }

    await sleep(120);
    yield {
      type: "status",
      message: `Parsed ${doc.pageCount} page(s). Extracting line items…`,
      messageZh: `已解析 ${doc.pageCount} 页。正在抽取科目…`,
    };

    const { extract: raw, evidence } = extractFiling(doc, fileName, {
      companyName: input.companyName,
      ticker: input.ticker,
    });
    const { extract } = validateExtract(raw);

    yield {
      type: "status",
      message: "Validating figures & assembling deck…",
      messageZh: "正在校验数字并组装简报页…",
    };
    await sleep(100);

    const deck = buildDeck(extract, evidence, fileName);

    yield { type: "meta", meta: deck.meta };
    yield { type: "evidence", evidence: Object.values(deck.evidence) };

    for (const slide of deck.slides) {
      yield {
        type: "status",
        message: `Slide ${slide.index + 1}/${deck.slides.length}: ${slide.title}`,
        messageZh: `第 ${slide.index + 1}/${deck.slides.length} 页：${slide.titleZh}`,
      };
      yield { type: "slide", slide };
      await sleep(90);
    }

    yield { type: "done", deck };
  } catch (err) {
    yield {
      type: "error",
      message: err instanceof Error ? err.message : "Filing analysis failed",
      messageZh:
        err instanceof Error ? err.message : "财报分析失败",
    };
  }
}
