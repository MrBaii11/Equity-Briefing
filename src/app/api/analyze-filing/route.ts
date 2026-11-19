import { generateFilingDeckStream } from "@/lib/filing/pipeline";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 20 * 1024 * 1024; // 20MB

export async function POST(req: Request) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) => {
        controller.enqueue(encoder.encode(`${JSON.stringify(obj)}\n`));
      };

      try {
        const contentType = req.headers.get("content-type") || "";
        let useSample = false;
        let fileName = "filing.txt";
        let mimeType: string | undefined;
        let buffer: ArrayBuffer | undefined;
        let text: string | undefined;
        let companyName: string | undefined;
        let ticker: string | undefined;

        if (contentType.includes("multipart/form-data")) {
          const form = await req.formData();
          useSample = form.get("sample") === "1" || form.get("sample") === "true";
          companyName = String(form.get("companyName") || "") || undefined;
          ticker = String(form.get("ticker") || "") || undefined;
          const file = form.get("file");
          if (!useSample && file && typeof file === "object" && "arrayBuffer" in file) {
            const f = file as File;
            fileName = f.name || fileName;
            mimeType = f.type || undefined;
            if (f.size > MAX_BYTES) {
              send({
                type: "error",
                message: "File too large (max 20MB).",
                messageZh: "文件过大（上限 20MB）。",
              });
              controller.close();
              return;
            }
            buffer = await f.arrayBuffer();
          } else if (!useSample) {
            send({
              type: "error",
              message: "Please upload a PDF/TXT file or use the sample filing.",
              messageZh: "请上传 PDF/TXT，或使用示例财报。",
            });
            controller.close();
            return;
          }
        } else {
          const body = (await req.json().catch(() => ({}))) as {
            sample?: boolean;
            text?: string;
            fileName?: string;
            companyName?: string;
            ticker?: string;
          };
          useSample = Boolean(body.sample);
          text = body.text;
          fileName = body.fileName || fileName;
          companyName = body.companyName;
          ticker = body.ticker;
          if (!useSample && !text) {
            send({
              type: "error",
              message: "Expected multipart file upload or { sample: true }.",
              messageZh: "需要 multipart 上传或 { sample: true }。",
            });
            controller.close();
            return;
          }
        }

        for await (const event of generateFilingDeckStream({
          buffer,
          text,
          fileName,
          mimeType,
          companyName,
          ticker,
          useSample,
        })) {
          send(event);
        }
      } catch (err) {
        send({
          type: "error",
          message: err instanceof Error ? err.message : "Upload failed",
          messageZh: err instanceof Error ? err.message : "上传失败",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}
