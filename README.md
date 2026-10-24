# ProductScope

A professional product discovery and comparison app built with React, Express, and optional MongoDB. The interface uses ordinary shopping language—no AI badges or AI-branded UI.

## What works
- Search product listings from eBay Browse API when credentials are configured.
- Search food and grocery product data from Open Food Facts.
- Normalize results into one product format.
- Compare prices and specifications where supplied by the source.
- Provide transparent recommendation ranking based on query relevance, available ratings, price and completeness.
- Produce a review summary from review text explicitly supplied to the summary endpoint. Optional Groq language-model summaries are enabled with a server-side key; a local heuristic fallback is used when no key is set. No reviews or ratings are fabricated.
- Optionally generate short product-fit explanations using only returned listing fields (Groq key required).
- Product source links and retrieval timestamps.

## Important coverage limitation
No single public API provides every product, every retailer's live price, and all customer reviews. eBay access requires an eligible developer account and credentials; API access and marketplace policies may vary. Open Food Facts is a community-maintained food product database and its data can be incomplete. The app clearly marks missing information. Do not scrape sites or bypass access restrictions. Read each source's terms before production use.

## Requirements
- Node.js 20+
- npm
- Optional: eBay Developer application keys (Client ID and Client Secret)
- Optional: MongoDB connection string (not required for basic search in this starter)

## Setup
1. Unzip the project.
2. Open a terminal in the `productscope` folder.
3. Run:
   ```bash
   npm install
   npm run install:all
   ```
4. Copy `server/.env.example` to `server/.env`.
5. Add eBay credentials if you have them. Without eBay credentials, food/grocery searches through Open Food Facts still work, but general marketplace search will return a clear setup message.
6. Run:
   ```bash
   npm run dev
   ```
7. Open the Vite URL printed in the terminal (usually http://localhost:5173).

## Environment variables
`server/.env`:
- `PORT=5000`
- `CLIENT_ORIGIN=http://localhost:5173`
- `EBAY_CLIENT_ID=` application client ID
- `EBAY_CLIENT_SECRET=` application client secret
- `EBAY_MARKETPLACE_ID=EBAY_US` (use a marketplace supported by your account)
- `MONGODB_URI=` optional; this starter does not require MongoDB to search.
- `GROQ_API_KEY=` optional key for language-model explanations and review summaries. Keep it server-side.
- `GROQ_MODEL=llama-3.3-70b-versatile` optional model name; confirm availability in your Groq account.

Keep secrets only in the server environment. Never put API secrets in React's `VITE_*` variables or commit `.env`.

## API endpoints
- `GET /api/health`
- `GET /api/search?q=wireless+headphones&limit=20`
- `GET /api/product/:source/:id` (eBay item detail when configured)
- `POST /api/recommend` with `{ "query": "...", "budget": 500, "currency": "USD", "useCase": "..." }`
- `POST /api/compare` with `{ "products": [...] }`
- `GET /api/reviews/summary?text=...` (summarizes only supplied text; optional Groq model; no review scraping)

## Architecture
React UI → Express API → source adapters (eBay + Open Food Facts) → normalized product records → transparent ranking / comparison. The server is the only place eBay credentials are used.

## Testing
```bash
npm test --prefix server
```
The tests cover normalization and recommendation scoring. For live API tests, configure eBay credentials and test queries from your region.

## Deployment
### Frontend
Deploy `client` to Vercel or Netlify. Set `VITE_API_BASE` to your deployed backend URL at build time.

### Backend
Deploy `server` to Render, Railway, or another Node-compatible host. Set the environment variables from `.env.example`; do not upload `.env` to source control. Configure `CLIENT_ORIGIN` to your deployed frontend origin.

### Production checklist
- Use HTTPS and restrictive CORS.
- Add rate limiting, request timeouts, caching and monitoring.
- Add privacy policy and terms.
- Respect each provider's attribution, licensing, image and caching requirements.
- Do not claim that ratings/reviews are universal or verified unless the source supports that.
- Configure a real database before adding user accounts, wishlists or search history.
