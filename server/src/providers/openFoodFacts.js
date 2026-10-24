const BASE = "https://world.openfoodfacts.org";

export async function searchOpenFoodFacts(query, limit = 12) {
  // The v1 search endpoint supports full-text search; keep results limited and identify the app.
  const url = new URL(`${BASE}/cgi/search.pl`);
  url.searchParams.set("search_terms", query);
  url.searchParams.set("search_simple", "1");
  url.searchParams.set("action", "process");
  url.searchParams.set("json", "1");
  url.searchParams.set("page_size", String(Math.min(limit, 20)));
  url.searchParams.set("fields", "code,product_name,brands,image_front_url,quantity,categories,stores,nutriscore_grade,url");
  const response = await fetch(url, {
    headers: { "User-Agent": "ProductScope/1.0 (product-discovery-student-project)" },
    signal: AbortSignal.timeout(12000)
  });
  if (!response.ok) throw new Error(`Open Food Facts search failed (${response.status}).`);
  const data = await response.json();
  const products = (data.products || []).filter(p => p.product_name).map(p => ({
    id: String(p.code || p.product_name),
    source: "openfoodfacts",
    sourceName: "Open Food Facts",
    title: p.product_name,
    description: [p.brands, p.quantity, p.categories].filter(Boolean).join(" · "),
    image: p.image_front_url || "",
    price: null,
    currency: "",
    rating: null,
    reviewCount: null,
    brand: p.brands || "",
    category: p.categories || "Food & grocery",
    nutritionGrade: p.nutriscore_grade || "",
    url: p.url || (p.code ? `${BASE}/product/${p.code}` : ""),
    specs: [],
    retrievedAt: new Date().toISOString()
  }));
  return { products, notice: products.length ? "Open Food Facts is community-maintained; product data may be incomplete and usually does not provide retail prices or customer reviews." : null };
}
