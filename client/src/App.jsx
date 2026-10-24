
import { useMemo, useState } from "react";
import {
  Search, ArrowUpRight, SlidersHorizontal, Scale, Bookmark, Check, X,
  ChevronDown, ExternalLink, PackageSearch, ShieldCheck, Clock3
} from "lucide-react";

import "./styles.css";

const API = import.meta.env.VITE_API_BASE || "http://localhost:5000";

const categories = [
  "All products", "Electronics", "Home", "Fashion",
  "Food & grocery", "Books", "Gaming"
];

function money(price, currency) {
  if (price == null || !currency) return "Price unavailable";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency", currency, maximumFractionDigits: 2
    }).format(price);
  } catch {
    return `${currency} ${price}`;
  }
}

/* PRODUCT DETAILS POPUP */
function ProductDetailsModal({ product, onClose }) {
  if (!product) return null;

  return (
    <div className="product-modal-backdrop" onClick={onClose}>
      <section
        className="product-modal"
        role="dialog"
        aria-modal="true"
        aria-label={`${product.title} details`}
        onClick={e => e.stopPropagation()}
      >
        <button
          type="button"
          className="product-modal-close"
          onClick={onClose}
          aria-label="Close product details"
        >
          <X size={20} />
        </button>

        <div className="product-modal-image-wrap">
          {product.image ? (
            <img
              className="product-modal-image"
              src={product.image}
              alt={product.title}
              onError={e => { e.currentTarget.style.display = "none"; }}
            />
          ) : (
            <div className="image-placeholder">
              <PackageSearch size={40} />
              <span>Image unavailable</span>
            </div>
          )}
        </div>

        <div className="product-modal-content">
          <span className="source-chip">
            {product.sourceName || product.source || "Product source"}
          </span>

          <p className="product-modal-meta">
            {product.brand || product.category || "Product"}
            {product.rating != null && (
              <span className="rating">
                {" "}★ {Number(product.rating).toFixed(1)}
                {product.reviewCount != null
                  ? ` (${product.reviewCount} reviews)` : ""}
              </span>
            )}
          </p>

          <h2>{product.title}</h2>

          <div className="product-modal-price">
            {money(product.price, product.currency)}
          </div>

          {product.condition && (
            <p><strong>Condition:</strong> {product.condition}</p>
          )}

          <h3>Product description</h3>
          <p className="product-modal-description">
            {product.description ||
              "The source has not supplied a description for this product."}
          </p>

          {product.category && (
            <p><strong>Category:</strong> {product.category}</p>
          )}

          {product.matchReason && (
            <p><strong>Why it matches:</strong> {product.matchReason}</p>
          )}

          {Array.isArray(product.specs) && product.specs.length > 0 && (
            <div className="product-modal-specs">
              <h3>Specifications</h3>
              <ul>
                {product.specs.map((spec, index) => (
                  <li key={index}>
                    {typeof spec === "string"
                      ? spec
                      : `${spec.name || spec.key || "Detail"}: ${spec.value ?? ""}`}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="product-modal-actions">
            {product.url ? (
              <a
                className="primary-link"
                href={product.url}
                target="_blank"
                rel="noreferrer"
                onClick={e => e.stopPropagation()}
              >
                View listing <ExternalLink size={16} />
              </a>
            ) : (
              <span className="muted">
                No external listing link is available.
              </span>
            )}

            <button
              type="button"
              className="text-button"
              onClick={onClose}
            >
              Close details
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

/* CLICKABLE PRODUCT CARD */
function ProductCard({
  product, saved, onSave, onCompare, compared, onDetails
}) {
  function handleKeyDown(e) {
    if (e.target !== e.currentTarget) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onDetails(product);
    }
  }

  return (
    <article
      className="product-card"
      role="button"
      tabIndex={0}
      aria-label={`View details for ${product.title}`}
      onClick={() => onDetails(product)}
      onKeyDown={handleKeyDown}
    >
      <div className="product-image">
        {product.image ? (
          <img
            src={product.image}
            alt={product.title}
            loading="lazy"
            onError={e => { e.currentTarget.style.display = "none"; }}
          />
        ) : (
          <div className="image-placeholder">
            <PackageSearch size={34} />
            <span>Image unavailable</span>
          </div>
        )}

        <button
          type="button"
          className={`save-button ${saved ? "is-saved" : ""}`}
          aria-label={saved ? "Remove saved product" : "Save product"}
          onClick={e => {
            e.stopPropagation();
            onSave(product);
          }}
        >
          <Bookmark
            size={17}
            fill={saved ? "currentColor" : "none"}
          />
        </button>

        <span className="source-chip">
          {product.sourceName || product.source || "Product"}
        </span>
      </div>

      <div className="product-info">
        <div className="product-meta">
          <span>{product.brand || product.category || "Product"}</span>
          {product.rating != null && (
            <span className="rating">
              ★ {Number(product.rating).toFixed(1)}
              {product.reviewCount != null
                ? ` (${product.reviewCount})` : ""}
            </span>
          )}
        </div>

        <h3>{product.title}</h3>

        <p className="product-description">
          {product.description || "The source has not supplied a description."}
        </p>

        <div className="price-row">
          <strong>{money(product.price, product.currency)}</strong>
          {product.condition && <span>{product.condition}</span>}
        </div>

        <div className="reason">
          <Check size={14} />
          {product.matchReason || "Relevant search result"}
        </div>

        <div className="card-actions">
          <button
            type="button"
            className="primary-link"
            onClick={e => {
              e.stopPropagation();
              onDetails(product);
            }}
          >
            View details <ArrowUpRight size={15} />
          </button>

          <button
            type="button"
            className={`compare-button ${compared ? "selected" : ""}`}
            onClick={e => {
              e.stopPropagation();
              onCompare(product);
            }}
          >
            {compared ? <Check size={15} /> : <Scale size={15} />}
            {compared ? "Selected" : "Compare"}
          </button>
        </div>
      </div>
    </article>
  );
}

export default function App() {
  const [query, setQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [sources, setSources] = useState([]);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState([]);
  const [compare, setCompare] = useState([]);
  const [category, setCategory] = useState("All products");
  const [sort, setSort] = useState("recommended");
  const [budget, setBudget] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [view, setView] = useState("discover");
  const [details, setDetails] = useState(null);

  async function searchProducts(term = query) {
    const q = term.trim();

    if (q.length < 2) {
      setError("Enter at least two characters to search.");
      return;
    }

    setLoading(true);
    setError("");
    setActiveQuery(q);
    setQuery(q);
    setView("discover");
    setDetails(null);

    try {
      const response = await fetch(
        `${API}/api/search?q=${encodeURIComponent(q)}&limit=30`
      );
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Search failed.");

      setProducts(data.products || []);
      setSources(data.sources || []);
      setNotices(data.notices || []);
    } catch (e) {
      setProducts([]);
      setSources([]);
      setNotices([]);
      setError(`${e.message}. Make sure the backend is running at ${API}.`);
    } finally {
      setLoading(false);
    }
  }

  async function getRecommendations() {
    const q = query.trim();

    if (q.length < 2) {
      setError('Enter what you need, such as "wireless headphones for travel".');
      return;
    }

    setLoading(true);
    setError("");
    setActiveQuery(q);
    setView("recommend");
    setDetails(null);

    try {
      const response = await fetch(`${API}/api/recommend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: q,
          budget: budget ? Number(budget) : undefined
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not build recommendations.");
      }

      setProducts(data.products || []);
      setSources(data.sources || []);
      setNotices(data.notices || []);
    } catch (e) {
      setError(e.message || "Could not build recommendations.");
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    let list = [...products];

    if (category !== "All products") {
      const c = category.toLowerCase();

      list = list.filter(p =>
        `${p.category || ""} ${p.title || ""} ${p.description || ""}`
          .toLowerCase()
          .includes(c.replace(" & grocery", "")) ||
        (c === "electronics" &&
          /phone|laptop|headphone|camera|tablet|computer|monitor|speaker|watch/i.test(p.title || "")) ||
        (c === "gaming" &&
          /game|gaming|console|controller/i.test(p.title || "")) ||
        (c === "fashion" &&
          /shirt|shoe|dress|jacket|bag|clothing/i.test(p.title || "")) ||
        (c === "home" &&
          /home|kitchen|lamp|chair|table|furniture/i.test(p.title || "")) ||
        (c === "books" &&
          /book|novel|paperback/i.test(p.title || ""))
      );
    }

    if (budget) {
      list = list.filter(p => p.price == null || p.price <= Number(budget));
    }

    if (sort === "price-asc") {
      list.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
    }
    if (sort === "price-desc") {
      list.sort((a, b) => (b.price ?? -Infinity) - (a.price ?? -Infinity));
    }
    if (sort === "rating") {
      list.sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1));
    }

    return list;
  }, [products, category, budget, sort]);

  function toggleSave(product) {
    setSaved(old =>
      old.some(p => p.source === product.source && p.id === product.id)
        ? old.filter(p => !(p.source === product.source && p.id === product.id))
        : [...old, product]
    );
  }

  function toggleCompare(product) {
    const exists = compare.some(
      p => p.source === product.source && p.id === product.id
    );

    if (exists) {
      setCompare(old =>
        old.filter(p => !(p.source === product.source && p.id === product.id))
      );
    } else if (compare.length < 4) {
      setCompare(old => [...old, product]);
    } else {
      setError("You can compare up to four products at a time.");
    }
  }

  const savedSet = product =>
    saved.some(p => p.source === product.source && p.id === product.id);

  const comparedSet = product =>
    compare.some(p => p.source === product.source && p.id === product.id);

  function card(product) {
    return (
      <ProductCard
        key={`${product.source}:${product.id}`}
        product={product}
        saved={savedSet(product)}
        onSave={toggleSave}
        onCompare={toggleCompare}
        compared={comparedSet(product)}
        onDetails={setDetails}
      />
    );
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a
          className="brand"
          href="#"
          onClick={e => {
            e.preventDefault();
            setDetails(null);
            setView("discover");
          }}
        >
          <span className="brand-mark">p.</span>
          <span>product<span className="brand-light">scope</span></span>
        </a>

        <nav>
          <button
            className={view === "discover" ? "nav-active" : ""}
            onClick={() => setView("discover")}
          >
            Discover
          </button>
          <button
            className={view === "recommend" ? "nav-active" : ""}
            onClick={getRecommendations}
          >
            For you
          </button>
          <button onClick={() => { setDetails(null); setView("saved"); }}>
            Saved <span className="nav-count">{saved.length}</span>
          </button>
        </nav>

        <button
          className="compare-top"
          onClick={() => { setDetails(null); setView("compare"); }}
        >
          <Scale size={16} /> Compare <span>{compare.length}</span>
        </button>
      </header>

      <main>
        {view !== "saved" && view !== "compare" && (
          <section className="hero">
            <div className="eyebrow">
              <span className="eyebrow-line"></span> A clearer way to shop
            </div>
            <h1>Good choices start<br />with <em>better information.</em></h1>
            <p className="hero-copy">
              Search products, explore the details, and compare your options — all in one place.
            </p>

            <form
              className="search-box"
              onSubmit={e => {
                e.preventDefault();
                searchProducts();
              }}
            >
              <Search size={21} />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Try wireless headphones"
              />
              <button type="submit" disabled={loading}>
                {loading ? "Searching…" : "Search"} <ArrowUpRight size={16} />
              </button>
            </form>

            <div className="quick-search">
              <span>Popular searches</span>
              {["wireless headphones", "laptop", "coffee", "running shoes"].map(s => (
                <button key={s} onClick={() => searchProducts(s)}>{s}</button>
              ))}
            </div>
          </section>
        )}

        {view !== "saved" && view !== "compare" && (
          <section className="category-strip">
            {categories.map(c => (
              <button
                key={c}
                className={category === c ? "category-active" : ""}
                onClick={() => setCategory(c)}
              >
                {c}
              </button>
            ))}
          </section>
        )}

        {error && (
          <div className="alert">
            <span>{error}</span>
            <button onClick={() => setError("")} aria-label="Dismiss">
              <X size={16} />
            </button>
          </div>
        )}

        {view === "compare" ? (
          <section className="results-section">
            <div className="section-heading">
              <div>
                <div className="eyebrow">SIDE BY SIDE</div>
                <h2>Compare your shortlist</h2>
                <p>Choose two to four products from search results.</p>
              </div>
              <button className="text-button" onClick={() => setView("discover")}>
                Back to search
              </button>
            </div>

            {compare.length < 2 ? (
              <div className="empty-state">
                <Scale size={34} />
                <h3>Your comparison is waiting</h3>
                <p>
                  Search for a product, select Compare on at least two cards, then return here.
                </p>
                <button className="solid-button" onClick={() => setView("discover")}>
                  Explore products
                </button>
              </div>
            ) : (
              <div className="compare-table-wrap">
                <table className="compare-table">
                  <thead>
                    <tr>
                      <th>Details</th>
                      {compare.map(p => (
                        <th key={p.source + p.id}>
                          <div className="compare-product-name">{p.title}</div>
                          <button
                            className="remove-compare"
                            onClick={() => toggleCompare(p)}
                          >
                            Remove
                          </button>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["Price", p => money(p.price, p.currency)],
                      ["Rating", p => p.rating == null
                        ? "Not provided"
                        : `★ ${p.rating}${p.reviewCount != null ? ` (${p.reviewCount} reviews)` : ""}`],
                      ["Brand", p => p.brand || "Not provided"],
                      ["Category", p => p.category || "Not provided"],
                      ["Condition", p => p.condition || "Not provided"],
                      ["Description", p => p.description || "Not provided"],
                      ["Source", p => p.sourceName || p.source]
                    ].map(([label, format]) => (
                      <tr key={label}>
                        <th>{label}</th>
                        {compare.map(p => (
                          <td key={p.source + p.id}>{format(p)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ) : view === "saved" ? (
          <section className="results-section">
            <div className="section-heading">
              <div>
                <div className="eyebrow">YOUR SHORTLIST</div>
                <h2>Saved products</h2>
                <p>Keep the options you want to come back to.</p>
              </div>
            </div>

            {saved.length ? (
              <div className="product-grid">{saved.map(card)}</div>
            ) : (
              <div className="empty-state">
                <Bookmark size={34} />
                <h3>Nothing saved yet</h3>
                <p>Save products from your search results to build a shortlist.</p>
                <button className="solid-button" onClick={() => setView("discover")}>
                  Discover products
                </button>
              </div>
            )}
          </section>
        ) : (
          <section className="results-section">
            <div className="section-heading">
              <div>
                <div className="eyebrow">
                  {activeQuery ? "SEARCH RESULTS" : "START EXPLORING"}
                </div>
                <h2>
                  {view === "recommend"
                    ? "Options worth a closer look"
                    : activeQuery
                      ? "Results for " + activeQuery
                      : "Find your next favourite"}
                </h2>
                <p>
                  {activeQuery
                    ? filtered.length + " results from available sources"
                    : "Search any product to see matching listings and available details."}
                </p>
              </div>

              <div className="result-controls">
                <button
                  className="filter-toggle"
                  onClick={() => setShowFilters(v => !v)}
                >
                  <SlidersHorizontal size={16} /> Filters <ChevronDown size={14} />
                </button>
                <select
                  aria-label="Sort results"
                  value={sort}
                  onChange={e => setSort(e.target.value)}
                >
                  <option value="recommended">Recommended</option>
                  <option value="price-asc">Price: low to high</option>
                  <option value="price-desc">Price: high to low</option>
                  <option value="rating">Highest rating</option>
                </select>
              </div>
            </div>

            {showFilters && (
              <div className="filter-panel">
                <label>
                  Maximum price
                  <input
                    type="number"
                    min="0"
                    placeholder="No limit"
                    value={budget}
                    onChange={e => setBudget(e.target.value)}
                  />
                </label>
                <button
                  className="text-button"
                  onClick={() => {
                    setBudget("");
                    setCategory("All products");
                  }}
                >
                  Clear filters
                </button>
                <p>
                  Prices in different currencies are not converted. Listings without a price remain visible.
                </p>
              </div>
            )}

            {sources.length > 0 && (
              <div className="source-line">
                <ShieldCheck size={15} />
                Data received from {sources.join(" and ")}
                <span>·</span>
                <Clock3 size={14} />
                Updated {new Date().toLocaleTimeString([], {
                  hour: "2-digit", minute: "2-digit"
                })}
              </div>
            )}

            {notices.length > 0 && (
              <div className="notice-list">
                {notices.map((n, i) => <p key={i}>{n}</p>)}
              </div>
            )}

            {loading ? (
              <div className="loading-grid">
                {[1, 2, 3, 4].map(n => (
                  <div className="skeleton-card" key={n}>
                    <div /><span /><span /><span />
                  </div>
                ))}
              </div>
            ) : filtered.length ? (
              <div className="product-grid">{filtered.map(card)}</div>
            ) : (
              <div className="empty-state">
                <PackageSearch size={36} />
                <h3>
                  {activeQuery ? "No matching listings found" : "What are you looking for?"}
                </h3>
                <p>
                  {activeQuery
                    ? "Try a broader search, another spelling, or a different product source."
                    : "Start with a product name, brand, or the job you need it to do."}
                </p>
                {activeQuery && (
                  <button
                    className="solid-button"
                    onClick={() => searchProducts(activeQuery)}
                  >
                    Try search again
                  </button>
                )}
              </div>
            )}
          </section>
        )}

        <section className="trust-strip">
          <div>
            <ShieldCheck size={19} />
            <span>
              <strong>Source-aware information</strong>
              <small>Details are shown when a provider supplies them.</small>
            </span>
          </div>
          <div>
            <Scale size={19} />
            <span>
              <strong>Compare what matters</strong>
              <small>See differences before you decide.</small>
            </span>
          </div>
          <div>
            <Bookmark size={19} />
            <span>
              <strong>Your own shortlist</strong>
              <small>Save options while you research.</small>
            </span>
          </div>
        </section>
      </main>

      <footer>
        <a className="brand footer-brand" href="#">
          <span className="brand-mark">p.</span>
          <span>product<span className="brand-light">scope</span></span>
        </a>
        <p>Better-informed choices, one search at a time.</p>
        <span>
          Product data is provided by third-party sources. Availability and accuracy may vary.
        </span>
      </footer>

      {compare.length > 0 && view !== "compare" && (
        <button className="compare-float" onClick={() => setView("compare")}>
          <Scale size={17} /> Compare shortlist <span>{compare.length}</span>
        </button>
      )}

      {details && (
        <ProductDetailsModal
          product={details}
          onClose={() => setDetails(null)}
        />
      )}
    </div>
  );
}
