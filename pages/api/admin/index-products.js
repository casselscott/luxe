// pages/api/admin/index-products.js
// ═══════════════════════════════════════════════════════════════════════════════
//  LUXE SEMANTIC INDEX — ONE-TIME SETUP + INCREMENTAL RE-INDEX
// ═══════════════════════════════════════════════════════════════════════════════
//
//  What this does:
//  ───────────────
//  Generates an OpenAI embedding vector (text-embedding-3-small, 1536 dims)
//  for every product in your MongoDB catalogue and stores it back on the
//  document.  The chatbot then does cosine-similarity search in-process
//  instead of flaky regex matching — "strappy gold heels" finds heels,
//  not dresses.
//
//  How to run (ONE TIME after first deploy, or after adding new products):
//  ───────────────────────────────────────────────────────────────────────
//  curl -X POST https://your-domain.com/api/admin/index-products \
//       -H "x-admin-secret: YOUR_ADMIN_SECRET"
//
//  Or open in browser (GET is also supported for convenience):
//  https://your-domain.com/api/admin/index-products?secret=YOUR_ADMIN_SECRET
//
//  Add ADMIN_SECRET=some_long_random_string to your .env file.
//  If you don't set it, the endpoint is DISABLED for safety.
//
//  Cost estimate:
//  ──────────────
//  text-embedding-3-small = $0.00002 / 1K tokens
//  Average product text ~80 tokens → ~$0.0000016 per product
//  1000 products ≈ $0.0016 (less than half a cent)
//
//  Re-indexing:
//  ────────────
//  Pass ?force=true to regenerate ALL embeddings (e.g. after changing buildText).
//  Without it, only products with null embeddings are processed (incremental).
// ═══════════════════════════════════════════════════════════════════════════════

import OpenAI from "openai";
import db from "../../../utils/db";
import Product from "../../../models/Product";

export const config = { api: { bodyParser: true } };

// ── Build the text we embed for each product ──────────────────────────────────
// Richer = more accurate retrieval. Include everything a stylist would say.
function buildProductText(p) {
  const parts = [
    `${p.name}`,
    p.brand ? `by ${p.brand}` : "",
    p.category ? `Category: ${p.category}` : "",
    p.color ? `Color: ${p.color}` : "",
    p.occasion ? `Occasion: ${p.occasion}` : "",
    Array.isArray(p.tags) && p.tags.length ? `Tags: ${p.tags.join(", ")}` : "",
    p.description || "",
  ];
  return parts.filter(Boolean).join(". ").replace(/\s+/g, " ").trim();
}

// ── Batch embed with rate-limit protection ────────────────────────────────────
// text-embedding-3-small supports up to 2048 inputs per call but we keep
// batches small to stay well inside the 1M token/min rate limit.
const BATCH_SIZE = 50;
const DELAY_MS = 300; // pause between batches

async function embedBatch(openai, texts) {
  const res = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: texts,
  });
  return res.data.map((d) => d.embedding); // array of float arrays
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── DB connection helper ───────────────────────────────────────────────────────
async function connectDB() {
  try {
    if (typeof db.connect === "function") await db.connect();
    else if (typeof db.dbConnect === "function") await db.dbConnect();
    else if (typeof db.connectDB === "function") await db.connectDB();
    else if (typeof db.default === "function") await db.default();
    else await db();
  } catch (err) {
    if (!err.message?.includes("already")) throw err;
  }
}

// ── Handler ───────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  // ── Auth check ─────────────────────────────────────────────────────────────
  const adminSecret = process.env.ADMIN_SECRET;
  if (!adminSecret) {
    return res.status(503).json({
      error:
        "ADMIN_SECRET is not set in .env — indexing endpoint is disabled for safety.",
    });
  }

  const provided =
    req.headers["x-admin-secret"] || req.query.secret || req.body?.secret;

  if (provided !== adminSecret) {
    return res.status(401).json({ error: "Unauthorized — wrong secret." });
  }

  // ── OpenAI key check ────────────────────────────────────────────────────────
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    return res.status(503).json({ error: "OPENAI_API_KEY missing from .env" });
  }

  const openai = new OpenAI({ apiKey: openaiKey });
  const force = req.query.force === "true" || req.body?.force === true;

  try {
    await connectDB();

    // Fetch products that need (re)indexing
    const filter = force
      ? {}
      : { $or: [{ embedding: null }, { embedding: { $exists: false } }] };

    const products = await Product.find(filter)
      .select(
        "_id name brand category color occasion tags description embedding",
      )
      .lean();

    if (products.length === 0) {
      return res.status(200).json({
        message: "All products already indexed. Pass ?force=true to re-index.",
        indexed: 0,
        total: await Product.countDocuments(),
      });
    }

    console.log(`[LUXE Indexer] Indexing ${products.length} products…`);

    let indexed = 0;
    let errors = 0;

    // Process in batches
    for (let i = 0; i < products.length; i += BATCH_SIZE) {
      const batch = products.slice(i, i + BATCH_SIZE);
      const texts = batch.map(buildProductText);

      let embeddings;
      try {
        embeddings = await embedBatch(openai, texts);
      } catch (err) {
        console.error(
          `[LUXE Indexer] Batch ${i}–${i + BATCH_SIZE} failed:`,
          err.message,
        );
        errors += batch.length;
        await sleep(DELAY_MS * 3);
        continue;
      }

      // Write back to MongoDB in parallel
      const writes = batch.map((p, j) =>
        Product.updateOne(
          { _id: p._id },
          {
            $set: {
              embedding: embeddings[j],
              embeddingUpdatedAt: new Date(),
            },
          },
        ),
      );

      await Promise.all(writes);
      indexed += batch.length;

      console.log(`[LUXE Indexer] ${indexed}/${products.length} indexed…`);

      if (i + BATCH_SIZE < products.length) await sleep(DELAY_MS);
    }

    const total = await Product.countDocuments();

    return res.status(200).json({
      message: `✅ Indexing complete — ${indexed} products embedded.`,
      indexed,
      errors,
      total,
      model: "text-embedding-3-small",
      dims: 1536,
    });
  } catch (err) {
    console.error("[LUXE Indexer Error]", err);
    return res.status(500).json({ error: err.message });
  }
}
