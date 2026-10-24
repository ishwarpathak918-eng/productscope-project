import "dotenv/config";
import express from "express";
import cors from "cors";
import { searchProducts, getProductDetails } from "./providers/index.js";
import { rankProducts, summarizeReviewText } from "./services/recommendations.js";
import { summarizeWithLanguageModel, explainRecommendations } from "./services/language.js";

const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173" }));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "ProductScope API", timestamp: new Date().toISOString() });
});

app.get("/api/search", async (req, res) => {
  const q = String(req.query.q || "").trim();
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 50);
  if (q.length < 2) return res.status(400).json({ error: "Enter at least 2 characters to search." });
  try {
    const result = await searchProducts(q, limit);
    res.json({ query: q, count: result.products.length, products: rankProducts(result.products, { query: q }), sources: result.sources, notices: result.notices, retrievedAt: new Date().toISOString() });
  } catch (error) {
    res.status(502).json({ error: "Product search is temporarily unavailable.", detail: error.message });
  }
});

app.get("/api/product/:source/:id", async (req, res) => {
  try {
    const product = await getProductDetails(req.params.source, req.params.id);
    if (!product) return res.status(404).json({ error: "Details are not available from this source." });
    res.json({ product, retrievedAt: new Date().toISOString() });
  } catch (error) {
    res.status(502).json({ error: "Could not retrieve product details.", detail: error.message });
  }
});

app.post("/api/recommend", async (req, res) => {
  const query = String(req.body?.query || "").trim();
  const budget = Number(req.body?.budget);
  const currency = String(req.body?.currency || "USD").toUpperCase();
  const useCase = String(req.body?.useCase || "").trim();
  if (query.length < 2) return res.status(400).json({ error: "Add a product or need to search for." });
  try {
    const result = await searchProducts(query, 30);
    const filtered = Number.isFinite(budget) && budget > 0
      ? result.products.filter(p => !p.price || p.currency !== currency || p.price <= budget)
      : result.products;
    const ranked = rankProducts(filtered, { query, useCase, budget, currency });
    let explanationMethod = "Transparent local ranking based on relevance, available rating, price and listing completeness.";
    try {
      const explanations = await explainRecommendations(ranked, query, useCase);
      if (Array.isArray(explanations?.items)) {
        for (const item of explanations.items) {
          if (ranked[item.index] && typeof item.reason === "string") ranked[item.index].matchReason = item.reason.slice(0, 240);
        }
        explanationMethod = "Product-fit explanations based on available listing fields.";
      }
    } catch (err) { console.warn("Optional recommendation explanations unavailable:", err.message); }
    res.json({
      query, budget: Number.isFinite(budget) && budget > 0 ? budget : null, currency, useCase,
      products: ranked, sources: result.sources, notices: result.notices,
      explanation: explanationMethod + " Missing information is not treated as a negative rating.",
      retrievedAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(502).json({ error: "Recommendations are temporarily unavailable.", detail: error.message });
  }
});

app.post("/api/compare", (req, res) => {
  const products = Array.isArray(req.body?.products) ? req.body.products.slice(0, 4) : [];
  if (products.length < 2) return res.status(400).json({ error: "Choose at least two products to compare." });
  res.json({ products, comparedAt: new Date().toISOString(), note: "Only attributes supplied by each source are compared. Blank values mean the source did not provide that detail." });
});

app.get("/api/reviews/summary", async (req, res) => {
  const text = String(req.query.text || "").slice(0, 12000);
  if (!text.trim()) return res.status(400).json({ error: "Provide review text that you are authorized to use." });
  try {
    const aiSummary = await summarizeWithLanguageModel(text);
    res.json(aiSummary || summarizeReviewText(text));
  } catch (error) {
    console.warn("Optional review summary unavailable; using local fallback:", error.message);
    res.json({ ...summarizeReviewText(text), fallback: true });
  }
});

const port = Number(process.env.PORT) || 5000;
if (process.env.MONGODB_URI) {
  const mongoose = await import("mongoose");
  try {
    await mongoose.default.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected.");
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  }
}
app.listen(port, () => console.log(`ProductScope API running on http://localhost:${port}`));
