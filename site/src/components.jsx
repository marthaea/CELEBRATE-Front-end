import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Building2, CakeSlice, Camera, Gamepad2, Mic, Search, Speaker, Tent, Utensils, X } from "lucide-react";
import { discountPercent, money } from "../../src/format.js";
import { usePlan } from "../../src/plan.jsx";

const ICONS = {
  venues: Building2, tents: Tent, catering: Utensils, cakes: CakeSlice,
  sound: Speaker, photos: Camera, mcs: Mic, games: Gamepad2,
};

/**
 * Stand-in for photography: a dark, grained colour field with a fine line drawing.
 * `seed` shifts the light so neighbouring tiles do not look identical.
 */
export function Art({ category = "venues", seed = 0, className = "", label }) {
  const Icon = ICONS[category] ?? Building2;
  const x = 20 + ((seed * 37) % 60);
  const y = 15 + ((seed * 53) % 50);
  return (
    <div className={`art art-${category} ${className}`} style={{ "--lx": `${x}%`, "--ly": `${y}%` }} role="img" aria-label={label ?? "Photograph to come"}>
      <Icon strokeWidth={0.5} aria-hidden="true" />
    </div>
  );
}

export function Drum({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 200 260" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
      <ellipse cx="100" cy="46" rx="74" ry="24" />
      <path d="M26 46c4 70 16 130 34 176M174 46c-4 70-16 130-34 176" />
      <path d="M60 222c10 10 70 10 80 0" />
      <path d="M40 70l42 150M82 70l-12 150M118 70l12 150M160 70l-42 150M82 70l36 150M118 70L82 220" opacity="0.55" />
    </svg>
  );
}

export function Header({ overHero }) {
  const { items } = usePlan();
  const navigate = useNavigate();
  const [atTop, setAtTop] = useState(true);
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const onScroll = () => setAtTop(window.scrollY < window.innerHeight - 90);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const submit = (event) => {
    event.preventDefault();
    setSearching(false);
    navigate(query.trim() ? `/services?q=${encodeURIComponent(query.trim())}` : "/services");
  };

  const light = overHero && atTop && !searching;
  return (
    <header className={`header ${light ? "light" : ""}`}>
      <nav className="header-side" aria-label="Main">
        <NavLink to="/services">Services</NavLink>
        <Link to="/#offers" className="hide-small">Offers</Link>
        <NavLink to="/vendors" className="hide-small">For vendors</NavLink>
      </nav>
      <Link to="/" className={`wordmark ${overHero && atTop ? "hidden" : ""}`}>CELEBRATE</Link>
      <nav className="header-side right" aria-label="Your account">
        <button className="icon-button" onClick={() => setSearching(!searching)} aria-label={searching ? "Close search" : "Search services"} aria-expanded={searching}>
          {searching ? <X size={16} strokeWidth={1.4} /> : <Search size={16} strokeWidth={1.4} />}
        </button>
        <NavLink to="/account" className="hide-small">Account</NavLink>
        <NavLink to="/bookings" className="hide-small">Bookings</NavLink>
        <NavLink to="/plan">Plan ({items.length})</NavLink>
      </nav>
      {searching && (
        <form className="search-row" onSubmit={submit} role="search">
          <input autoFocus type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Try: tents in Mukono" aria-label="Search services" />
          <button className="link-caps">Search</button>
        </form>
      )}
    </header>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <div>
        <p className="wordmark small">CELEBRATE</p>
        <p className="quiet">Tukusanyukidde. Every event service, one platform, one grand total.</p>
      </div>
      <nav aria-label="Footer">
        <Link to="/services">Services</Link>
        <Link to="/plan">My plan</Link>
        <Link to="/bookings">Bookings</Link>
        <Link to="/account">Account</Link>
        <Link to="/vendors">List my business</Link>
      </nav>
      <p className="quiet">Kampala · Mukono · Wakiso · Entebbe · Jinja</p>
    </footer>
  );
}

/** One piece in a grid: image, name, price, vendor. */
export function ServiceCard({ service, index = 0 }) {
  const { items } = usePlan();
  const off = discountPercent(service);
  return (
    <Link to={`/service/${service.id}`} className="piece">
      <div className="piece-art">
        <Art category={service.category} seed={index + service.name.length} label={service.photoCaption} />
        {off > 0 && <span className="tag">{off}% off</span>}
        {items.includes(service.id) && <span className="tag in-plan">In my plan</span>}
        <span className="piece-view">View</span>
      </div>
      <h3>{service.name}</h3>
      <p>{money(service.price)} <span className="quiet">/ {service.unit}</span></p>
      <p className="quiet">{service.vendor} · {service.district}</p>
    </Link>
  );
}

export const Loading = ({ label = "Loading" }) => <p className="status" role="status">{label}…</p>;
export const ErrorNote = ({ children }) => (children ? <p className="error" role="alert">{children}</p> : null);

export const PageHead = ({ eyebrow, title, children }) => (
  <header className="page-head">
    {eyebrow && <p className="caps">{eyebrow}</p>}
    <h1>{title}</h1>
    {children}
  </header>
);

/** The itemised plan with every cost and the grand total. */
export function Summary({ quote, categories, onRemove }) {
  const titleFor = (id) => categories?.find((c) => c.id === id)?.title ?? "";
  return (
    <>
      <ul className="lines">
        {quote.lines.map((line) => (
          <li key={line.id}>
            <div>
              <p>{titleFor(line.category)}</p>
              <p className="quiet">{line.detail} · {line.vendor}</p>
              {onRemove && <button className="link-quiet" onClick={() => onRemove(line.id)} aria-label={`Remove ${line.name}`}>Remove</button>}
            </div>
            <p className="num">{money(line.amount)}</p>
          </li>
        ))}
      </ul>
      <dl className="sums">
        <div><dt>Item cost</dt><dd>{money(quote.itemCost)}</dd></div>
        <div><dt>Labour and setup</dt><dd>{money(quote.labour)}</dd></div>
        <div><dt>Transport</dt><dd>{money(quote.transport)}</dd></div>
        <div><dt>Platform fee ({Math.round(quote.feeRate * 100)}%)</dt><dd>{money(quote.platformFee)}</dd></div>
      </dl>
      <div className="grand">
        <p className="caps">Grand total</p>
        <p className="grand-total">{money(quote.total)}</p>
        <p className="quiet">No hidden costs. This is all you pay.</p>
      </div>
    </>
  );
}
