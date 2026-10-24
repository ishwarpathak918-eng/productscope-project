let tokenCache = { token: null, expiresAt: 0 };

function credentialsReady() {
  return Boolean(process.env.EBAY_CLIENT_ID && process.env.EBAY_CLIENT_SECRET);
}

async function getToken() {
  if (!credentialsReady()) throw new Error("eBay credentials are not configured.");
  if (tokenCache.token && tokenCache.expiresAt > Date.now() + 60_000) return tokenCache.token;

  const basic = Buffer.from(`${process.env.EBAY_CLIENT_ID}:${process.env.EBAY_CLIENT_SECRET}`).toString("base64");
  const response = await fetch("https://api.ebay.com/identity/v1/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({ grant_type: "client_credentials", scope: "https://api.ebay.com/oauth/api_scope" }),
    signal: AbortSignal.timeout(12000)
  });
  if (!response.ok) throw new Error(`eBay token request failed (${response.status}). Check developer credentials and API access.`);
  const data = await response.json();
  tokenCache = { token: data.access_token, expiresAt: Date.now() + (Number(data.expires_in) || 7200) * 1000 };
  return tokenCache.token;
}

export async function searchEbay(query, limit = 20) {
  if (!credentialsReady()) return { products: [], notice: "eBay search is not enabled yet. Add EBAY_CLIENT_ID and EBAY_CLIENT_SECRET to server/.env." };
  const token = await getToken();
  const url = new URL("https://api.ebay.com/buy/browse/v1/item_summary/search");
  url.searchParams.set("q", query);
  url.searchParams.set("limit", String(Math.min(limit, 50)));
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "X-EBAY-C-MARKETPLACE-ID": process.env.EBAY_MARKETPLACE_ID || "EBAY_US"
    },
    signal: AbortSignal.timeout(15000)
  });
  if (!response.ok) throw new Error(`eBay search failed (${response.status}). Check API access, marketplace and usage limits.`);
  const data = await response.json();
  return { products: (data.itemSummaries || []).map(normalizeEbay) };
}

export async function getEbayItem(itemId) {
  if (!credentialsReady()) throw new Error("eBay credentials are not configured.");
  const token = await getToken();
  const response = await fetch(`https://api.ebay.com/buy/browse/v1/item/${encodeURIComponent(itemId)}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "X-EBAY-C-MARKETPLACE-ID": process.env.EBAY_MARKETPLACE_ID || "EBAY_US"
    },
    signal: AbortSignal.timeout(12000)
  });
  if (!response.ok) throw new Error(`eBay detail request failed (${response.status}).`);
  const data = await response.json();
  return normalizeEbay(data);
}

function normalizeEbay(item) {
  const price = item.price?.value != null ? Number(item.price.value) : null;
  return {
    id: item.itemId || item.legacyItemId || String(item.title || "item"),
    source: "ebay",
    sourceName: "eBay",
    title: item.title || "Untitled listing",
    description: item.shortDescription || "",
    image: item.image?.imageUrl || item.thumbnailImages?.[0]?.imageUrl || "",
    price,
    currency: item.price?.currency || "",
    rating: item.reviewRating?.averageRating ? Number(item.reviewRating.averageRating) : null,
    reviewCount: item.reviewRating?.reviewCount != null ? Number(item.reviewRating.reviewCount) : null,
    condition: item.condition || "",
    brand: item.brand || "",
    category: item.categories?.[0]?.categoryName || "",
    url: item.itemWebUrl || "",
    specs: item.localizedAspects || [],
    retrievedAt: new Date().toISOString()
  };
}
