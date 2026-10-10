/**
 * AppZed doc-pipe (managed=true). PUT documents to R2, get AI summaries,
 * metadata logged to D1.
 * Bindings: AI, DOCS (r2), DB (d1).
 */
const SCHEMA = "CREATE TABLE IF NOT EXISTS docs (key TEXT PRIMARY KEY, size INTEGER, summary TEXT, created_at TEXT DEFAULT (datetime('now')))";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/health") {
      return Response.json({ ok: true, solution: "doc-pipe" });
    }
    if (request.method === "GET" && url.pathname === "/schema") {
      return new Response(SCHEMA, { headers: { "content-type": "text/plain" } });
    }
    if (request.method === "PUT" && url.pathname.startsWith("/docs/")) {
      const key = url.pathname.slice("/docs/".length);
      if (!key || key.includes("..")) return bad("Invalid document key.");
      const text = await request.text();
      if (!text) return bad("Empty body.");
      if (text.length > 100000) return bad("Document exceeds 100KB.");
      await env.DOCS.put(key, text);
      await env.DB.exec(SCHEMA);
      let summary = "";
      try {
        const out = await env.AI.run("@cf/meta/llama-3.1-8b-instruct-fp8", {
          messages: [
            { role: "system", content: "Summarize the document in 3 bullets. Then list key amounts, dates, and names." },
            { role: "user", content: text.slice(0, 12000) },
          ],
          max_tokens: 512,
        });
        summary = out.response || "";
      } catch (err) {
        return Response.json({ error: String(err && err.message || err) }, { status: 502 });
      }
      await env.DB.prepare(
        "INSERT INTO docs (key, size, summary) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET size=excluded.size, summary=excluded.summary"
      ).bind(key, text.length, summary).run();
      return Response.json({ key, size: text.length, summary }, { status: 201 });
    }
    return new Response("Not found", { status: 404 });
  },
};

function bad(message) {
  return Response.json({ error: message }, { status: 400 });
}
