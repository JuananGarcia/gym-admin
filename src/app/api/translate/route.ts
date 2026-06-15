import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const apiKey = process.env.DEEPL_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "DEEPL_API_KEY not configured" }, { status: 500 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { texts, source = "ES", target = "EN" } = body as {
    texts: string[];
    source?: string;
    target?: string;
  };

  if (!Array.isArray(texts) || texts.length === 0) {
    return NextResponse.json({ error: "texts must be a non-empty array" }, { status: 400 });
  }

  const params = new URLSearchParams();
  params.set("source_lang", source.toUpperCase());
  params.set("target_lang", target.toUpperCase() === "EN" ? "EN-US" : target.toUpperCase());
  for (const t of texts) {
    params.append("text", t);
  }

  const res = await fetch("https://api-free.deepl.com/v2/translate", {
    method: "POST",
    headers: {
      Authorization: `DeepL-Auth-Key ${apiKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: `DeepL error: ${err}` }, { status: res.status });
  }

  const data = (await res.json()) as { translations: { text: string }[] };
  const translations = data.translations.map((t) => t.text);

  return NextResponse.json({ translations });
}
