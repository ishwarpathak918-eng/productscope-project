export async function summarizeWithLanguageModel(text) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;
  const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      max_tokens: 450,
      messages: [
        { role: "system", content: "Summarize only the review text supplied by the user. Do not invent facts, ratings, review counts, or product specifications. Separate recurring positives from concerns. If evidence is insufficient, say so. Return concise JSON with keys summary, positives (array), concerns (array), limitations." },
        { role: "user", content: text.slice(0, 10000) }
      ],
      response_format: { type: "json_object" }
    }),
    signal: AbortSignal.timeout(20000)
  });
  if (!response.ok) throw new Error(`Review summary provider returned ${response.status}.`);
  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Review summary provider returned an empty response.");
  return { ...JSON.parse(content), method: "language-model summary of supplied review text", source: "User-provided review text" };
}

export async function explainRecommendations(products, query, useCase = "") {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || !products.length) return null;
  const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
  const safeProducts = products.slice(0, 8).map((p, index) => ({ index, title: p.title, price: p.price, currency: p.currency, rating: p.rating, brand: p.brand, category: p.category, description: p.description, availableFields: [p.price != null && "price", p.rating != null && "rating", p.description && "description"].filter(Boolean) }));
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, temperature: 0.2, max_tokens: 500, messages: [
      { role: "system", content: "You are a careful shopping research assistant. Use only supplied product fields. Never invent product specs, review details, prices, or ratings. Return JSON with items: an array of objects containing index and reason. Reasons should be one short sentence explaining fit or explicitly mentioning insufficient information. Do not claim a product is best unless the data supports it." },
      { role: "user", content: JSON.stringify({ need: query, useCase, products: safeProducts }) }
    ], response_format: { type: "json_object" } }),
    signal: AbortSignal.timeout(20000)
  });
  if (!response.ok) throw new Error(`Recommendation explanation provider returned ${response.status}.`);
  const data = await response.json();
  return JSON.parse(data.choices?.[0]?.message?.content || "{}");
}
