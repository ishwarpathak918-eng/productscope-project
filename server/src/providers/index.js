
import {
  searchDemoProducts,
  getDemoProduct
} from "./demoStore.js";

import { searchEbay, getEbayItem } from "./ebay.js";

export async function searchProducts(query, limit = 20) {
  const products = [];
  const sources = [];
  const notices = [];

  // Demo catalogue works without eBay credentials.
  const jobs = [
    {
      name: "Demo Product Catalogue",
      run: () => searchDemoProducts(query, limit)
    }
  ];

  // Add eBay only when credentials have been configured.
  if (
    process.env.EBAY_CLIENT_ID &&
    process.env.EBAY_CLIENT_SECRET
  ) {
    jobs.push({
      name: "eBay",
      run: () => searchEbay(query, limit)
    });
  }

  const results = await Promise.allSettled(
    jobs.map(job => job.run())
  );

  for (let i = 0; i < results.length; i++) {
    const result = results[i];

    if (result.status === "fulfilled") {
      products.push(...result.value.products);

      if (result.value.products.length) {
        sources.push(jobs[i].name);
      }

      if (result.value.notice) {
        notices.push(result.value.notice);
      }
    } else {
      notices.push(
        `${jobs[i].name}: ${
          result.reason?.message || "Source unavailable"
        }`
      );
    }
  }

  const unique = new Map();

  for (const product of products) {
    const key = `${product.source}:${product.id}`;

    if (!unique.has(key)) {
      unique.set(key, product);
    }
  }

  if (!products.length) {
    notices.push(
      "No matching demo products were found. Try another keyword, such as phone, laptop, or beauty."
    );
  }

  return {
    products: [...unique.values()].slice(0, limit),
    sources,
    notices
  };
}

export async function getProductDetails(source, id) {
  if (source === "dummyjson") {
    return getDemoProduct(id);
  }

  if (source === "ebay") {
    return getEbayItem(id);
  }

  return null;
}
