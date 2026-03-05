// models/Product.js
// ✅ UPDATED: Added `embedding` field for semantic vector search
// Run /api/admin/index-products once after deploying to populate embeddings

import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    rating: { type: Number, required: true },
    comment: { type: String, required: true },
  },
  { timestamps: true },
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    category: { type: String, required: true },
    brand: { type: String, required: true },
    image: { type: String, required: true },
    images: [String],
    price: { type: Number, required: true },
    countInStock: { type: Number, required: true, default: 0 },
    description: { type: String, required: true },
    rating: { type: Number, required: true, default: 0 },
    numReviews: { type: Number, required: true, default: 0 },
    isFeatured: { type: Boolean, default: false },
    // Optional enrichment fields — used to build the embedding text
    color: { type: String, default: "" },
    occasion: { type: String, default: "" },
    tags: [String],
    reviews: [reviewSchema],

    // ── Semantic search vector ─────────────────────────────────────────────
    // 1536-float array produced by text-embedding-3-small.
    // Populated by POST /api/admin/index-products
    // null = not yet indexed
    // NOTE: select:false removed — we need +embedding syntax which is fragile.
    // The embedding array is large (~6KB) but only fetched in semantic search
    // queries via the admin index route. Normal product list queries don't
    // include this field because they use .select() with explicit field lists.
    embedding: {
      type: [Number],
      default: null,
    },

    // Tracks when embedding was last generated so you can re-index on edits
    embeddingUpdatedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// ── Indexes ────────────────────────────────────────────────────────────────────
// Standard text index for the legacy keyword fallback path
productSchema.index(
  {
    name: "text",
    description: "text",
    category: "text",
    brand: "text",
    tags: "text",
  },
  { weights: { name: 10, category: 8, brand: 6, tags: 5, description: 3 } },
);

productSchema.index({ slug: 1 });
productSchema.index({ category: 1, countInStock: 1 });
productSchema.index({ isFeatured: -1, rating: -1 });
// Sparse index so null embeddings don't bloat it
productSchema.index({ embeddingUpdatedAt: 1 }, { sparse: true });

const Product =
  mongoose.models.Product || mongoose.model("Product", productSchema);

export default Product;
