function normalize(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function rankProducts(products, { query = "", useCase = "", budget, currency } = {}) {
  const terms = normalize(`${query} ${useCase}`).split(/\s+/).filter(t => t.length > 2);
  return products.map(product => {
    const title = normalize(product.title);
    const description = normalize(`${product.description} ${product.brand} ${product.category}`);
    const matches = terms.length ? terms.filter(t => title.includes(t) || description.includes(t)).length / terms.length : 0;
    const ratingScore = Number.isFinite(product.rating) ? Math.max(0, Math.min(1, product.rating / 5)) : null;
    const priceKnown = Number.isFinite(product.price) && product.price > 0;
    const withinBudget = priceKnown && budget > 0 && product.currency === currency ? product.price <= budget : null;
    const completeness = [product.image, product.description, product.url, product.category, product.brand].filter(Boolean).length / 5;
    // Missing ratings are neutral, not zero. Reweight the score using available signals.
    const signals = [{ value: matches, weight: 0.55 }, { value: completeness, weight: 0.20 }];
    if (ratingScore !== null) signals.push({ value: ratingScore, weight: 0.25 });
    if (withinBudget === true) signals.push({ value: 1, weight: 0.08 });
    const weightTotal = signals.reduce((sum, s) => sum + s.weight, 0);
    const score = signals.reduce((sum, s) => sum + s.value * s.weight, 0) / weightTotal;
    return {
      ...product,
      recommendationScore: Math.round(score * 100),
      matchReason: matches >= 0.5 ? "Matches several terms in your search" : "Related result from an available source",
      dataQuality: completeness >= 0.8 ? "More listing details available" : "Some details are not provided by the source"
    };
  }).sort((a, b) => b.recommendationScore - a.recommendationScore);
}

export function summarizeReviewText(text) {
  const sentences = String(text).split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 12);
  const positive = ["good", "great", "excellent", "love", "easy", "comfortable", "fast", "value", "reliable", "recommend", "quality", "useful"];
  const negative = ["bad", "poor", "broken", "broke", "slow", "expensive", "issue", "problem", "return", "disappointed", "defect", "uncomfortable", "waste"];
  const score = sentence => {
    const s = normalize(sentence);
    return positive.filter(w => s.includes(w)).length - negative.filter(w => s.includes(w)).length;
  };
  const scored = sentences.map(sentence => ({ sentence, score: score(sentence) }));
  return {
    source: "User-provided review text",
    sentenceCount: sentences.length,
    positiveThemes: scored.filter(s => s.score > 0).slice(0, 3).map(s => s.sentence),
    concerns: scored.filter(s => s.score < 0).slice(0, 3).map(s => s.sentence),
    note: "This is a lightweight text-based summary, not a verified sentiment measurement. Use only review text you have permission to process."
  };
}
