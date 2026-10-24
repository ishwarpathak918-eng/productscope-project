import test from "node:test";
import assert from "node:assert/strict";
import { rankProducts, summarizeReviewText } from "../src/services/recommendations.js";

test("rankProducts returns products with transparent scores", () => {
  const results = rankProducts([
    { id: "1", title: "Wireless headphones", description: "Bluetooth audio", rating: 4.8, image: "img", url: "url", category: "Audio", brand: "A" },
    { id: "2", title: "Desk lamp", description: "LED light", rating: null }
  ], { query: "wireless headphones" });
  assert.equal(results.length, 2);
  assert.ok(results[0].recommendationScore >= results[1].recommendationScore);
  assert.equal(typeof results[0].recommendationScore, "number");
});

test("review summary only uses supplied text", () => {
  const summary = summarizeReviewText("Great quality and easy to use. The device broke after one day.");
  assert.equal(summary.sentenceCount, 2);
  assert.equal(summary.positiveThemes.length, 1);
  assert.equal(summary.concerns.length, 1);
});
