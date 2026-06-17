import { NextResponse } from "next/server";
import { z } from "zod";
import { providerForMessageId } from "@/lib/email/load";
import { isApiAuthorized } from "@/lib/auth/authorize";

export const runtime = "nodejs";

const Query = z.object({
  id: z.string().min(1), // provider-prefixed message id
  attachmentId: z.string().min(1),
});

export async function GET(req: Request) {
  if (!(await isApiAuthorized())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const url = new URL(req.url);
  const parsed = Query.safeParse({
    id: url.searchParams.get("id"),
    attachmentId: url.searchParams.get("attachmentId"),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  const provider = await providerForMessageId(parsed.data.id);
  if (!provider) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  try {
    const { filename, contentType, data } = await provider.getAttachment(
      parsed.data.id,
      parsed.data.attachmentId,
    );
    return new NextResponse(new Uint8Array(data), {
      status: 200,
      headers: {
        "Content-Type": contentType || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${filename.replace(/["\r\n]/g, "")}"`,
        "Content-Length": String(data.length),
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "download failed" },
      { status: 500 },
    );
  }
}
