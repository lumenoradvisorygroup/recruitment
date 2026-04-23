// netlify/functions/ai.js
// Proxies AI requests to Anthropic API server-side
// API key stays secret — never exposed to browser

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS_HEADERS, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: CORS_HEADERS, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  if (!ANTHROPIC_KEY) {
    return { statusCode: 500, headers: CORS_HEADERS, body: JSON.stringify({ error: "ANTHROPIC_API_KEY not set in Netlify env vars" }) };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: "Invalid JSON body" }) };
  }

  const { prompt, mode } = body;

  if (!prompt) {
    return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: "Missing prompt" }) };
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: mode === "score" ? 256 : 512,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Anthropic error:", data);
      return { statusCode: response.status, headers: CORS_HEADERS, body: JSON.stringify({ error: data.error?.message || "Anthropic API error" }) };
    }

    const text = data.content?.map(b => b.text || "").join("") || "";
    return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ result: text }) };

  } catch (err) {
    console.error("AI function error:", err);
    return { statusCode: 500, headers: CORS_HEADERS, body: JSON.stringify({ error: err.message }) };
  }
};
