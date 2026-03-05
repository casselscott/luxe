// pages/api/chatbot.js

import OpenAI from "openai";
import Stripe from "stripe";
import { Langfuse } from "langfuse";
import db from "../../utils/db";
import Product from "../../models/Product";

// ─── Body size limit for image uploads ───────────────────────────────────────
export const config = {
  api: {
    bodyParser: { sizeLimit: "10mb" },
  },
};

// ─── Langfuse init (lazy — only created once) ─────────────────────────────────
let _langfuse = null;
function getLangfuse() {
  if (_langfuse) return _langfuse;
  if (!process.env.LANGFUSE_SECRET_KEY || !process.env.LANGFUSE_PUBLIC_KEY) {
    console.warn("[LUXE] Langfuse keys missing — observability disabled");
    return null;
  }
  _langfuse = new Langfuse({
    secretKey: process.env.LANGFUSE_SECRET_KEY,
    publicKey: process.env.LANGFUSE_PUBLIC_KEY,
    baseUrl: process.env.LANGFUSE_BASE_URL || "https://cloud.langfuse.com",
    flushAt: 1, // send immediately in serverless
    flushInterval: 0,
  });
  return _langfuse;
}

// ─── FIXED: Lazy init — only created when a request actually needs them ───────
let _openai = null;
let _stripe = null;

function getOpenAI() {
  if (_openai) return _openai;
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY is missing from your .env file");
  _openai = new OpenAI({ apiKey: key });
  return _openai;
}

function getStripe() {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is missing from your .env file");
  _stripe = new Stripe(key);
  return _stripe;
}

// ─── System Prompt ────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are LUXE — the personal stylist at Fashion House, a luxury boutique.
You are warm, quick, confident, and slightly excited to help. You behave like a top-performing
boutique stylist who already knows what the customer needs before they do.

═══════════════════════════════════════════════════
 YOUR PERSONALITY
═══════════════════════════════════════════════════
- Warm, decisive, excited to style people
- Confident — never hedge with "maybe" or "you might like"
- Use language like: "Oh I've got you.", "This is PERFECT for tonight.", "Trust me on this one."
- Short, punchy replies. One or two sentences before you show a product. Never a wall of text.
- You SELL confidence and emotion, not just clothes.
  Instead of: "Here is a black midi dress."
  You say: "This structured black midi is elegant without trying too hard — perfect for a dinner
  where you want to look effortlessly put together."

═══════════════════════════════════════════════════
 GUARDRAILS — STRICT
═══════════════════════════════════════════════════
- You ONLY discuss fashion, style, clothing, accessories, outfits, and occasions.
- If asked about ANYTHING else (politics, coding, general knowledge, relationships unrelated
  to dressing, etc.) respond warmly but firmly:
  "Ha, I wish I could help with that! But I'm strictly here for fashion — and I'm very good at it 😊
  Now, is there an outfit I can help you find?"
- Never discuss competitor brands or stores.
- Never make up products. Only show items from the catalog returned by search_products.
- If countInStock is 0, say it warmly and pivot: "That one just flew off the rack! Let me find
  you something just as stunning."

═══════════════════════════════════════════════════
 THE LIMITED OPTIONS RULE — CRITICAL
═══════════════════════════════════════════════════
A luxury boutique stylist does NOT bring 15 dresses. They bring the best one or two.

- FIRST suggestion: search with limit:1. Present ONE perfect look with emotional language.
- If user hesitates or wants options: search again with limit:2. Show ONE alternative only.
- MAXIMUM 2 products shown at once, ever.
- Never say "here are some options" or "here are items that match" — pick FOR them.

═══════════════════════════════════════════════════
 CONVERSATIONAL FLOW — LUXURY STYLE
═══════════════════════════════════════════════════
Ask ONE clarifying question at a time when you need more info. Then commit.

Example:
Customer: "I need something for a dinner tonight."
LUXE: "Love it 😍 Is this a relaxed dinner or somewhere a little elevated?"
[User answers]
LUXE: "Perfect. I have exactly the right look for you."
[Calls search_products, presents 1 item with emotional copy]

DO NOT ask more than 2 questions before showing a product.
If you already have enough context → skip questions, go straight to the look.

═══════════════════════════════════════════════════
 "TRUST LUXE" / STYLIST PICKS MODE
═══════════════════════════════════════════════════
If the customer says "just pick for me", "trust luxe", "surprise me", "you choose", or 
"I don't know what to wear":
- Use any context you have from the conversation (occasion, past preferences, cart history)
- Call search_products immediately with limit:1
- Present the item as a COMPLETE styled look with full confidence
- End with: "I'd add this straight to your bag — want me to?" 
  so the customer can say yes and move straight to checkout.

═══════════════════════════════════════════════════
 BROAD CATEGORY MATCHING — CRITICAL
═══════════════════════════════════════════════════
Fashion House does NOT use generic category names like "wedding dresses". Instead we carry:
Gowns, Evening wear, Formal dresses, Maxi dresses, Co-ords, Tops, Trousers, Jackets, Shoes.

You MUST translate customer requests into what we actually carry:
- "Wedding dress" / "Bridal" → search for: "elegant gown white ivory floor-length"
  then "formal gown", then "maxi dress elegant", then "gown"
- "Prom dress" → search "ball gown evening formal"
- "Bridesmaid dress" → search "midi dress elegant floral pastel"
- "Work outfit" → search "tailored trousers blazer co-ord"
- "Party dress" → search "mini dress bodycon evening"
- "Summer outfit" → search "flowy dress linen casual"

NEVER tell a customer we don't carry something without first searching with at least 3 different
broad queries. Our inventory is extensive — if you search broadly enough you WILL find something.

After every image upload or request, your MANDATORY search cascade is:
1. Specific query (exact style/color/garment)
2. Category-only (drop color and adjectives)  
3. Occasion/vibe only (e.g. "elegant", "formal", "casual")
4. If all fail: search with query:"" and return our best featured item

═══════════════════════════════════════════════════
 IMAGE UPLOADS — MANDATORY BEHAVIOUR
═══════════════════════════════════════════════════
When a customer uploads ANY photo, you MUST:

1. IMMEDIATELY call search_products — NEVER respond without searching first.
2. Analyze the image for: silhouette, color, garment type, occasion vibe, style aesthetic.
3. TRANSLATE what you see into what Fashion House carries (see Broad Category Matching above).
4. Search query examples:
   - Sees a wedding gown → query: "white floor-length elegant gown formal"
   - Sees casual jeans + blouse → query: "relaxed wide-leg trousers silk blouse"
   - Sees a red carpet look → query: "statement gown evening glamour"
5. Present the result with a style bridge:
   "I can see you love [describe aesthetic] — this [item] gives exactly that energy..."

BANNED RESPONSES AFTER IMAGE UPLOAD (NEVER SAY THESE):
❌ "our stock is currently limited"
❌ "we don't have anything like that"
❌ "I couldn't find a match"
❌ "unfortunately we don't carry wedding dresses"

INSTEAD, ALWAYS:
✅ Search with 3 progressively broader queries
✅ Present whatever you find as "the closest match to your vibe"
✅ Style it with emotional language connecting it to what they uploaded
✅ If nothing matches at all, ask ONE question then search again immediately

FALLBACK SEARCH STRATEGY (mandatory cascade):
- Try 1: Full descriptive query from image analysis
- Try 2: Just the garment category + occasion (e.g. "gown formal")
- Try 3: Just the vibe/occasion (e.g. "elegant", "casual", "evening")
- Try 4: Return a featured item — never leave the customer empty-handed

═══════════════════════════════════════════════════
 MEMORY HINTS
═══════════════════════════════════════════════════
You will receive a CUSTOMER PROFILE section below if the customer has order history.
Use those preferences (size, colors, styles) as defaults — don't ask what you already know.

═══════════════════════════════════════════════════
 TOOLS
═══════════════════════════════════════════════════
- search_products: call this whenever a fashion item, occasion, or style comes up
- When customer says "buy", "add to bag", "I'll take it", "checkout" → reply with
  enthusiasm and tell them to tap the bag icon to checkout. Do NOT call create_checkout.`;

// ─── Tool Definitions ─────────────────────────────────────────────────────────
const tools = [
  {
    type: "function",
    function: {
      name: "search_products",
      description:
        "Search the Fashion House catalog. ALWAYS call with limit:1 for first suggestion. Only use limit:2 if customer asks for alternatives. NEVER return more than 2 products.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description:
              "Rich descriptive search: silhouette, vibe, occasion e.g. 'structured black midi dinner elegant', 'flowy boho summer dress casual'",
          },
          category: {
            type: "string",
            description:
              "Category: 'Gowns', 'Tops', 'Trousers', 'Jackets', 'Shoes', 'Co-ords'",
          },
          color: {
            type: "string",
            description: "Color e.g. 'black', 'red', 'nude', 'white', 'gold'",
          },
          occasion: {
            type: "string",
            description:
              "Occasion e.g. 'gala', 'dinner', 'casual', 'office', 'date night', 'wedding'",
          },
          styleVibe: {
            type: "string",
            description:
              "Style aesthetic for similarity matching e.g. 'minimalist', 'bohemian', 'classic', 'edgy', 'romantic', 'streetwear'",
          },
          maxPrice: { type: "number", description: "Maximum price in USD" },
          minPrice: { type: "number", description: "Minimum price in USD" },
          inStockOnly: {
            type: "boolean",
            description: "Only return in-stock products — default true",
          },
          limit: {
            type: "number",
            description:
              "MAXIMUM 2. Use 1 for first pick, 2 only if showing alternatives.",
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_checkout",
      description:
        "Create a Stripe payment session when the customer wants to buy.",
      parameters: {
        type: "object",
        properties: {
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                price: { type: "number" },
                quantity: { type: "number" },
                imageUrl: { type: "string" },
                slug: { type: "string" },
              },
              required: ["name", "price", "quantity"],
            },
          },
        },
        required: ["items"],
      },
    },
  },
];

// ─── Safe db connection helper ────────────────────────────────────────────────
async function connectDB() {
  try {
    if (typeof db.connect === "function") {
      await db.connect();
    } else if (typeof db.dbConnect === "function") {
      await db.dbConnect();
    } else if (typeof db.connectDB === "function") {
      await db.connectDB();
    } else if (typeof db.default === "function") {
      await db.default();
    } else {
      await db();
    }
  } catch (err) {
    if (!err.message?.includes("already")) throw err;
  }
}

// ─── Cosine similarity ────────────────────────────────────────────────────────
function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0,
    normA = 0,
    normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

// ─── Category guard rules ─────────────────────────────────────────────────────
const CATEGORY_GUARD_RULES = [
  {
    pattern:
      /\b(shoes?|heels?|boots?|sandals?|sneakers?|pumps?|mules?|loafers?|stilettos?)\b/i,
    category: /shoes|heels|boots|footwear|sandals|pumps|mules/i,
  },
  {
    pattern: /\b(bag|bags|purse|handbag|clutch|tote)\b/i,
    category: /bag|purse|handbag|clutch|accessories/i,
  },
  {
    pattern: /\b(jacket|coat|blazer|outerwear|overcoat|trench|cardigan)\b/i,
    category: /jacket|coat|blazer|outerwear|knitwear/i,
  },
  {
    pattern: /\b(trouser|trousers|pants|slacks|wide.leg|palazzos?)\b/i,
    category: /trouser|pants|bottoms/i,
  },
  {
    pattern: /\b(top|blouse|shirt|camisole|bustier|corset)\b/i,
    category: /top|blouse|shirt/i,
  },
  {
    pattern: /\b(skirt|mini.?skirt|midi.?skirt|maxi.?skirt)\b/i,
    category: /skirt/i,
  },
  {
    pattern:
      /\b(dress|gown|midi|maxi.?dress|mini.?dress|bodycon|sundress|ball.?gown|evening.?gown)\b/i,
    category: /dress|gown|eveningwear|evening wear/i,
  },
  {
    pattern: /\b(co.?ord|co.?ord.?set|two.piece|matching.set)\b/i,
    category: /co.?ord|two.piece|sets/i,
  },
  {
    pattern: /\b(jumpsuit|playsuit|romper)\b/i,
    category: /jumpsuit|playsuit|romper/i,
  },
];

function detectCategoryConstraint(queryText) {
  if (!queryText) return null;
  for (const rule of CATEGORY_GUARD_RULES) {
    if (rule.pattern.test(queryText)) return rule.category;
  }
  return null;
}

let _embeddingsIndexed = null;
async function hasEmbeddings() {
  if (_embeddingsIndexed !== null) return _embeddingsIndexed;
  const sample = await Product.findOne({
    embedding: { $ne: null, $exists: true },
  })
    .select("_id embedding")
    .lean();
  _embeddingsIndexed =
    sample !== null &&
    Array.isArray(sample.embedding) &&
    sample.embedding.length > 0;
  return _embeddingsIndexed;
}

async function embedQuery(text) {
  const openai = getOpenAI();
  const res = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text.trim().slice(0, 1000),
  });
  return res.data[0].embedding;
}

async function semanticSearch({
  queryText,
  categoryConstraint,
  inStockOnly = true,
  limit = 1,
  priceMin,
  priceMax,
}) {
  const hardLimit = Math.min(Number(limit) || 1, 2);
  const baseFilter = {};
  if (inStockOnly !== false) baseFilter.countInStock = { $gt: 0 };
  if (categoryConstraint) baseFilter.category = categoryConstraint;
  if (priceMin !== undefined || priceMax !== undefined) {
    baseFilter.price = {};
    if (priceMin !== undefined) baseFilter.price.$gte = priceMin;
    if (priceMax !== undefined) baseFilter.price.$lte = priceMax;
  }
  const candidates = await Product.find(baseFilter)
    .select(
      "name slug category brand price countInStock description image images rating numReviews isFeatured color occasion tags embedding",
    )
    .lean();
  if (candidates.length === 0) return [];
  const queryVec = await embedQuery(queryText);
  const withEmbeddings = candidates.filter(
    (p) => Array.isArray(p.embedding) && p.embedding.length > 0,
  );
  if (withEmbeddings.length === 0) return [];
  const scored = withEmbeddings
    .map((p) => ({
      product: p,
      score: cosineSimilarity(queryVec, p.embedding),
    }))
    .sort((a, b) => b.score - a.score);
  const boosted = scored
    .map((s) => ({ ...s, score: s.score + (s.product.isFeatured ? 0.01 : 0) }))
    .sort((a, b) => b.score - a.score);
  return boosted.slice(0, hardLimit).map((s) => formatProduct(s.product));
}

async function textSearch({
  queryText,
  categoryConstraint,
  inStockOnly = true,
  limit = 1,
  priceMin,
  priceMax,
}) {
  const hardLimit = Math.min(Number(limit) || 1, 2);
  const filter = { $text: { $search: queryText } };
  if (inStockOnly !== false) filter.countInStock = { $gt: 0 };
  if (categoryConstraint) filter.category = categoryConstraint;
  if (priceMin !== undefined || priceMax !== undefined) {
    filter.price = {};
    if (priceMin !== undefined) filter.price.$gte = priceMin;
    if (priceMax !== undefined) filter.price.$lte = priceMax;
  }
  const products = await Product.find(filter, { score: { $meta: "textScore" } })
    .select(
      "name slug category brand price countInStock description image images rating numReviews isFeatured color occasion tags",
    )
    .sort({ score: { $meta: "textScore" }, isFeatured: -1, rating: -1 })
    .limit(hardLimit)
    .lean();
  return products.map(formatProduct);
}

async function regexSearch({
  queryText,
  categoryConstraint,
  inStockOnly = true,
  limit = 1,
  priceMin,
  priceMax,
}) {
  const hardLimit = Math.min(Number(limit) || 1, 2);
  const andClauses = [];
  if (queryText) {
    const words = queryText.split(/\s+/).filter((w) => w.length > 2);
    if (words.length > 0) {
      andClauses.push({
        $or: words.map((word) => ({
          $or: [
            { name: { $regex: word, $options: "i" } },
            { description: { $regex: word, $options: "i" } },
            { category: { $regex: word, $options: "i" } },
            { brand: { $regex: word, $options: "i" } },
            { color: { $regex: word, $options: "i" } },
            { occasion: { $regex: word, $options: "i" } },
            { tags: { $in: [new RegExp(word, "i")] } },
          ],
        })),
      });
    }
  }
  if (inStockOnly !== false) andClauses.push({ countInStock: { $gt: 0 } });
  if (categoryConstraint) andClauses.push({ category: categoryConstraint });
  if (priceMin !== undefined || priceMax !== undefined) {
    const priceClause = {};
    if (priceMin !== undefined) priceClause.$gte = priceMin;
    if (priceMax !== undefined) priceClause.$lte = priceMax;
    andClauses.push({ price: priceClause });
  }
  const filter =
    andClauses.length > 0 ? { $and: andClauses } : { countInStock: { $gt: 0 } };
  const products = await Product.find(filter)
    .select(
      "name slug category brand price countInStock description image images rating numReviews isFeatured color occasion tags",
    )
    .sort({ isFeatured: -1, rating: -1 })
    .limit(hardLimit)
    .lean();
  return products.map(formatProduct);
}

function formatProduct(p) {
  return {
    _id: p._id.toString(),
    name: p.name || "",
    slug: p.slug || "",
    brand: p.brand || "",
    category: p.category || "",
    description: p.description || "",
    price: p.price || 0,
    countInStock: p.countInStock ?? 0,
    rating: p.rating || 0,
    numReviews: p.numReviews || 0,
    isFeatured: p.isFeatured || false,
    imageUrl:
      typeof p.image === "string"
        ? p.image
        : Array.isArray(p.images) && p.images[0]
          ? p.images[0]
          : null,
  };
}

async function searchProducts({
  query,
  category,
  color,
  occasion,
  styleVibe,
  maxPrice,
  minPrice,
  inStockOnly = true,
  limit = 1,
}) {
  await connectDB();
  const hardLimit = Math.min(Number(limit) || 1, 2);
  const queryText = [query, styleVibe, color, occasion]
    .filter(Boolean)
    .join(" ")
    .trim();
  const priceOpts = { priceMin: minPrice, priceMax: maxPrice };
  let categoryConstraint = null;
  if (category) {
    categoryConstraint = new RegExp(category, "i");
  } else {
    categoryConstraint = detectCategoryConstraint(queryText);
  }
  const indexed = await hasEmbeddings();
  if (indexed && queryText) {
    try {
      const results = await semanticSearch({
        queryText,
        categoryConstraint,
        inStockOnly,
        limit: hardLimit,
        ...priceOpts,
      });
      if (results.length > 0) return results;
      if (categoryConstraint) {
        const relaxed = await semanticSearch({
          queryText,
          categoryConstraint: null,
          inStockOnly,
          limit: hardLimit,
          ...priceOpts,
        });
        if (relaxed.length > 0) return relaxed;
      }
    } catch (embErr) {
      console.warn(
        "[LUXE Search] Embedding failed, falling back:",
        embErr.message,
      );
    }
  }
  if (queryText) {
    try {
      const results = await textSearch({
        queryText,
        categoryConstraint,
        inStockOnly,
        limit: hardLimit,
        ...priceOpts,
      });
      if (results.length > 0) return results;
    } catch {
      /* text index may not exist yet */
    }
  }
  if (queryText) {
    const results = await regexSearch({
      queryText,
      categoryConstraint,
      inStockOnly,
      limit: hardLimit,
      ...priceOpts,
    });
    if (results.length > 0) return results;
  }
  const featured = await Product.find({ countInStock: { $gt: 0 } })
    .select(
      "name slug category brand price countInStock description image images rating numReviews isFeatured color occasion tags",
    )
    .sort({ isFeatured: -1, rating: -1 })
    .limit(hardLimit)
    .lean();
  return featured.map(formatProduct);
}

async function createCheckout(items) {
  const stripe = getStripe();
  const lineItems = items.map((item) => ({
    price_data: {
      currency: "usd",
      unit_amount: Math.round(Number(item.price) * 100),
      product_data: {
        name: item.name,
        ...(item.imageUrl?.startsWith("https")
          ? { images: [item.imageUrl] }
          : {}),
      },
    },
    quantity: Number(item.quantity) || 1,
  }));
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: lineItems,
    mode: "payment",
    success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/`,
    shipping_address_collection: {
      allowed_countries: ["US", "CA", "GB", "NG", "ZA", "AE", "GH", "KE"],
    },
    allow_promotion_codes: true,
    metadata: { source: "luxe_chatbot" },
  });
  return { checkoutUrl: session.url, sessionId: session.id };
}

function buildUserMessage(message, imageBase64, imageMimeType) {
  if (!imageBase64) return { role: "user", content: message };
  return {
    role: "user",
    content: [
      {
        type: "image_url",
        image_url: {
          url: `data:${imageMimeType || "image/jpeg"};base64,${imageBase64}`,
          detail: "high",
        },
      },
      {
        type: "text",
        text:
          message?.trim() ||
          "Analyze this outfit and find similar or complementary products for me.",
      },
    ],
  };
}

// ─── Route Handler ────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // ── Langfuse: start a trace for this request ──────────────────────────────
  const langfuse = getLangfuse();
  const trace = langfuse?.trace({
    name: "luxe-chat",
    sessionId: req.headers["x-luxe-session"] || `session-${Date.now()}`,
    metadata: {
      app: "fashion-house",
      feature: "luxe-chatbot",
      environment: process.env.NODE_ENV,
      hasImage: !!req.body?.imageBase64,
    },
  });

  const requestStart = Date.now();

  try {
    const {
      message,
      history = [],
      cart = [],
      imageBase64,
      imageMimeType,
    } = req.body;

    if (!message?.trim() && !imageBase64) {
      return res.status(400).json({ error: "Message or image is required" });
    }

    // Update trace with user input (redact image binary)
    trace?.update({
      input: {
        message,
        cartSize: cart.length,
        historyLength: history.length,
        hasImage: !!imageBase64,
      },
    });

    const openai = getOpenAI();

    const cartSummary =
      cart.length > 0
        ? `\n\n═══ CUSTOMER'S CURRENT BAG ═══\n` +
          cart.map((i) => `- ${i.name} x${i.qty || 1} @ $${i.price}`).join("\n")
        : "";

    const historyText = history
      .map((m) => m.text || "")
      .join(" ")
      .toLowerCase();
    const mentionedSizes = [
      ...new Set(
        historyText.match(
          /\b(xs|s\b|m\b|l\b|xl|xxl|size \d+|uk \d+|eu \d+)/gi,
        ) || [],
      ),
    ];
    const mentionedColors = [
      ...new Set(
        historyText.match(
          /\b(black|white|red|blue|green|nude|beige|brown|pink|gold|silver|navy|grey|gray|cream|ivory)\b/gi,
        ) || [],
      ),
    ];
    const profileHint =
      mentionedSizes.length || mentionedColors.length
        ? `\n\n═══ CUSTOMER PROFILE (this session) ═══\n` +
          (mentionedSizes.length
            ? `Sizes mentioned: ${mentionedSizes.join(", ")}\n`
            : "") +
          (mentionedColors.length
            ? `Colors preferred: ${mentionedColors.join(", ")}`
            : "")
        : "";

    const messages = [
      { role: "system", content: SYSTEM_PROMPT + cartSummary + profileHint },
      ...history
        .filter(
          (m) =>
            (m.role === "user" || m.role === "assistant") && m.text?.trim(),
        )
        .map((m) => ({ role: m.role, content: m.text })),
      buildUserMessage(message, imageBase64, imageMimeType),
    ];

    let allProducts = [];
    let checkoutUrl = null;
    let finalReply = "";
    let totalTokensUsed = 0;
    let toolCallCount = 0;
    const MAX_LOOPS = 5;

    // ── Langfuse: span for the full LLM loop ─────────────────────────────────
    const llmSpan = trace?.span({
      name: "gpt4o-agent-loop",
      input: { message, historyLength: history.length },
    });

    for (let i = 0; i < MAX_LOOPS; i++) {
      // ── Langfuse: individual generation span per LLM call ─────────────────
      const genSpan = trace?.generation({
        name: `gpt4o-call-${i + 1}`,
        model: "gpt-4o",
        input: messages,
        modelParameters: { temperature: 0.7, max_tokens: 600 },
      });

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages,
        tools,
        tool_choice: "auto",
        temperature: 0.7,
        max_tokens: 600,
      });

      const choice = completion.choices[0];
      const reply = choice.message;

      // Track token usage
      const usage = completion.usage;
      totalTokensUsed += usage?.total_tokens || 0;

      // End generation span with token usage
      genSpan?.end({
        output: reply,
        usage: {
          promptTokens: usage?.prompt_tokens,
          completionTokens: usage?.completion_tokens,
          totalTokens: usage?.total_tokens,
        },
      });

      if (choice.finish_reason === "tool_calls" && reply.tool_calls?.length) {
        messages.push(reply);

        for (const toolCall of reply.tool_calls) {
          const fnName = toolCall.function.name;
          let fnArgs = {};
          try {
            fnArgs = JSON.parse(toolCall.function.arguments || "{}");
          } catch {
            fnArgs = {};
          }

          toolCallCount++;

          // ── Langfuse: span per tool call ────────────────────────────────
          const toolSpan = trace?.span({
            name: `tool:${fnName}`,
            input: fnArgs,
            metadata: { toolCallIndex: toolCallCount },
          });

          let fnResult = {};

          if (fnName === "search_products") {
            const products = await searchProducts(fnArgs);
            allProducts = [...allProducts, ...products];
            fnResult = {
              found: products.length,
              products: products.map((p) => ({
                name: p.name,
                brand: p.brand,
                price: p.price,
                category: p.category,
                countInStock: p.countInStock,
                description: p.description,
                rating: p.rating,
              })),
              instruction:
                products.length > 0
                  ? "Present with full confidence and enthusiasm. Bridge any style gap with warm editorial language."
                  : "No products found. Ask ONE clarifying question, then call search_products again with a broader query.",
            };

            // Log product search results to Langfuse
            toolSpan?.end({
              output: {
                found: products.length,
                topResult: products[0]?.name || "none",
                query: fnArgs.query,
              },
            });
          }

          if (fnName === "create_checkout") {
            const result = await createCheckout(fnArgs.items || []);
            checkoutUrl = result.checkoutUrl;
            fnResult = { success: true, sessionId: result.sessionId };

            // Log checkout event — useful for conversion tracking
            toolSpan?.end({
              output: { success: true, itemCount: fnArgs.items?.length || 0 },
            });

            // ── Langfuse: score this as a checkout conversion event ────────
            trace?.score({
              name: "checkout-initiated",
              value: 1,
              comment: `Cart: ${fnArgs.items?.map((i) => i.name).join(", ")}`,
            });
          }

          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(fnResult),
          });
        }

        continue;
      }

      finalReply = reply.content || "";
      break;
    }

    // End the LLM loop span
    llmSpan?.end({
      output: { reply: finalReply, productsFound: allProducts.length },
      metadata: { totalTokens: totalTokensUsed, toolCalls: toolCallCount },
    });

    const seen = new Set();
    const unique = allProducts
      .filter((p) => {
        if (seen.has(p._id)) return false;
        seen.add(p._id);
        return true;
      })
      .slice(0, 2);

    // ── Langfuse: close the top-level trace ───────────────────────────────
    trace?.update({
      output: {
        reply: finalReply,
        productsReturned: unique.length,
        checkoutInitiated: !!checkoutUrl,
      },
      metadata: {
        latencyMs: Date.now() - requestStart,
        totalTokens: totalTokensUsed,
        toolCalls: toolCallCount,
      },
    });

    // CRITICAL for Vercel: flush before the serverless fn terminates
    await langfuse?.flushAsync();

    return res.status(200).json({
      reply: finalReply,
      products: unique,
      checkoutUrl,
      stripeEnabled: !!process.env.STRIPE_SECRET_KEY,
    });
  } catch (err) {
    console.error("[LUXE Chatbot Error]", err.message);
    console.error(err.stack);

    // ── Langfuse: log the error on the trace ─────────────────────────────
    trace?.update({
      output: { error: err.message },
      metadata: { latencyMs: Date.now() - requestStart, status: "error" },
      level: "ERROR",
    });
    await langfuse?.flushAsync();

    let userMessage = "I had a little hiccup — please try again in a moment!";
    if (err.message?.includes("OPENAI_API_KEY")) {
      userMessage =
        "Configuration issue — please check your OPENAI_API_KEY in .env";
    } else if (
      err.message?.includes("quota") ||
      err.message?.includes("rate limit")
    ) {
      userMessage =
        "I'm getting a lot of requests right now — please try again in a moment!";
    } else if (
      err.message?.includes("network") ||
      err.message?.includes("ECONNREFUSED")
    ) {
      userMessage =
        "Connection issue — please check your database and try again.";
    }

    return res.status(500).json({
      reply: userMessage,
      products: [],
      _debug: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
}
