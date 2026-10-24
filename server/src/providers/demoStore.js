const BASE = "https://dummyjson.com/products";

// Broad search terms mapped to real DummyJSON product categories.
const CATEGORY_ALIASES = {
  clothes: ["mens-shirts", "tops", "womens-dresses", "mens-shoes", "womens-shoes", "womens-bags"],
  clothing: ["mens-shirts", "tops", "womens-dresses", "mens-shoes", "womens-shoes", "womens-bags"],
  apparel: ["mens-shirts", "tops", "womens-dresses", "mens-shoes", "womens-shoes", "womens-bags"],
  fashion: ["mens-shirts", "tops", "womens-dresses", "mens-shoes", "womens-shoes", "womens-bags", "mens-watches", "womens-watches", "sunglasses"],
  electronics: ["smartphones", "laptops", "tablets", "mobile-accessories"],
  mobile: ["smartphones", "mobile-accessories"],
  mobiles: ["smartphones", "mobile-accessories"],
  phone: ["smartphones", "mobile-accessories"],
  phones: ["smartphones", "mobile-accessories"],
  computer: ["laptops"],
  computers: ["laptops"],
  makeup: ["beauty", "skin-care"],
  skincare: ["skin-care"],
  shoes: ["mens-shoes", "womens-shoes"],
  dresses: ["womens-dresses"],
  shirts: ["mens-shirts", "tops"],
  bags: ["womens-bags"],
  watches: ["mens-watches", "womens-watches"],
  jewellery: ["womens-jewellery"],
  jewelry: ["womens-jewellery"],
  home: ["furniture", "home-decoration", "kitchen-accessories"],
  furniture: ["furniture"],
  groceries: ["groceries"],
  food: ["groceries"]
};

function normalizeProduct(item) {
  return {
    id: String(item.id),
    source: "dummyjson",
    sourceName: "Demo Product Catalogue",
    title: item.title || "Untitled product",
    description: item.description || "",
    image: item.thumbnail || item.images?.[0] || "",
    price: Number(item.price) || 0,
    currency: "USD",
    rating: Number(item.rating) || null,
    reviewCount: Array.isArray(item.reviews) ? item.reviews.length : null,
    brand: item.brand || "",
    category: item.category || "",
    condition: "Demo listing",
    url: "",
    specs: [],
    retrievedAt: new Date().toISOString()
  };
}

async function getJSON(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(12000) });
  if (!response.ok) throw new Error(`Demo product API failed (${response.status}).`);
  return response.json();
}

export async function searchDemoProducts(query, limit = 20) {
  const term = String(query || "").trim().toLowerCase();
  if (!term) return { products: [], notice: null };

  const categories = CATEGORY_ALIASES[term];
  let items = [];

  if (categories) {
    // A failed category should not prevent results from other categories.
    const results = await Promise.allSettled(
      categories.map(category =>
        getJSON(`${BASE}/category/${encodeURIComponent(category)}?limit=50`)
      )
    );
    items = results
      .filter(result => result.status === "fulfilled")
      .flatMap(result => result.value.products || []);

    if (!items.length) {
      // Fall back to keyword search if category endpoints returned no data.
      const url = new URL(`${BASE}/search`);
      url.searchParams.set("q", term);
      url.searchParams.set("limit", String(Math.min(limit, 50)));
      const data = await getJSON(url.toString());
      items = data.products || [];
    }
  } else {
    const synonyms = {
      headphones: "airpods",
      headphone: "airpods",
      earphones: "airpods",
      earbuds: "airpods",
      tshirt: "shirt",
      "t-shirt": "shirt",
      trainers: "shoes",
      sneakers: "shoes"
    };
    const url = new URL(`${BASE}/search`);
    url.searchParams.set("q", synonyms[term] || term);
    url.searchParams.set("limit", String(Math.min(limit, 50)));
    const data = await getJSON(url.toString());
    items = data.products || [];
  }

  const unique = new Map();
  for (const item of items) unique.set(String(item.id), item);

  return {
    products: [...unique.values()].slice(0, Math.min(limit, 50)).map(normalizeProduct),
    notice: "Demo catalogue: product names, prices and ratings are sample data, not verified live retail offers."
  };
}

export async function getDemoProduct(id) {
  if (!/^\d+$/.test(String(id))) return null;
  try {
    return normalizeProduct(await getJSON(`${BASE}/${encodeURIComponent(id)}`));
  } catch {
    return null;
  }
}
