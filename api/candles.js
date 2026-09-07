// Vercel serverless proxy for candle data.
// The Railway upstream does not expose CORS headers to Capacitor's origin.
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const query = new URLSearchParams();
  for (const key of ["symbol", "interval", "limit", "before"]) {
    const value = req.query?.[key];
    if (value != null && value !== "") query.set(key, String(value));
  }

  try {
    const upstream = await fetch(`https://raina-ai-production-b247.up.railway.app/candles?${query.toString()}`);
    const body = await upstream.text();
    res.setHeader("Content-Type", upstream.headers.get("content-type") || "application/json");
    return res.status(upstream.status).send(body);
  } catch (error) {
    return res.status(502).json({ error: "Candle upstream unavailable", detail: error?.message || "Unknown error" });
  }
}
