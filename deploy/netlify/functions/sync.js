// netlify/functions/sync.js
// Backend proxy — API key never exposed to browser
// Handles GET (read) and PUT (write) for JSONBin

const BIN_ID     = process.env.JSONBIN_BIN_ID;
const MASTER_KEY = process.env.JSONBIN_MASTER_KEY;
const BIN_URL    = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

exports.handler = async (event) => {

  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS_HEADERS, body: "" };
  }

  // ── READ ──
  if (event.httpMethod === "GET") {
    try {
      const res = await fetch(`${BIN_URL}/latest`, {
        method: "GET",
        headers: {
          "X-Master-Key": MASTER_KEY,
          "X-Bin-Meta": "false",
        },
      });

      const text = await res.text();

      if (!res.ok) {
        console.error("JSONBin read error:", res.status, text);
        return {
          statusCode: res.status,
          headers: CORS_HEADERS,
          body: JSON.stringify({ error: "JSONBin read failed", status: res.status }),
        };
      }

      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: text,
      };
    } catch (err) {
      console.error("GET exception:", err);
      return {
        statusCode: 500,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: err.message }),
      };
    }
  }

  // ── WRITE ──
  if (event.httpMethod === "PUT") {
    try {
      const res = await fetch(BIN_URL, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Master-Key": MASTER_KEY,
          "X-Bin-Versioning": "false",
        },
        body: event.body,
      });

      const text = await res.text();

      if (!res.ok) {
        console.error("JSONBin write error:", res.status, text);
        return {
          statusCode: res.status,
          headers: CORS_HEADERS,
          body: JSON.stringify({ error: "JSONBin write failed", status: res.status }),
        };
      }

      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: text,
      };
    } catch (err) {
      console.error("PUT exception:", err);
      return {
        statusCode: 500,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: err.message }),
      };
    }
  }

  return {
    statusCode: 405,
    headers: CORS_HEADERS,
    body: JSON.stringify({ error: "Method not allowed" }),
  };
};
