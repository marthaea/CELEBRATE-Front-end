import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BadgeCheck, CalendarCheck, Wallet } from "lucide-react";
import { usePlan } from "../../../src/plan.jsx";
import { api, useLoad } from "../../../src/api.js";
import { more } from "../extra.js";
import { Art, ErrorNote, Mark, PageHead } from "../components.jsx";
import { useT } from "../i18n.jsx";

/** Two halves: a photograph with a message on the left, the page's content on the right. */
function Split({ photo, heading, line, children }) {
  return (
    <div className="auth">
      <div className="auth-art">
        <Art photo={photo} eager />
        <div className="auth-art-text">
          <Mark />
          <p className="auth-heading">{heading}</p>
          <p>{line}</p>
        </div>
      </div>
      <div className="auth-side">{children}</div>
    </div>
  );
}

/** Cloudflare Turnstile: a check that the visitor is a person. Calls onToken with the proof, or "" when it lapses. */
function HumanCheck({ siteKey, onToken, onProblem }) {
  const box = useRef(null);
  useEffect(() => {
    if (!siteKey) return undefined;
    let widget;
    let gone = false;
    const show = () => {
      if (gone || !box.current || !window.turnstile) return;
      widget = window.turnstile.render(box.current, {
        sitekey: siteKey,
        callback: onToken,
        "expired-callback": () => onToken(""),
        "error-callback": () => onProblem("The security check could not run. Check your connection and reload the page."),
      });
    };
    if (window.turnstile) show();
    else {
      let script = document.getElementById("turnstile-script");
      if (!script) {
        script = document.createElement("script");
        script.id = "turnstile-script";
        script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        script.async = true;
        document.head.append(script);
      }
      script.addEventListener("load", show);
      script.addEventListener("error", () => onProblem("The security check could not load. Check your connection and reload the page."));
    }
    return () => {
      gone = true;
      if (widget !== undefined) window.turnstile?.remove(widget);
    };
  }, [siteKey]);
  return <div ref={box} className="human-check" />;
}

export function Account() {
  const plan = usePlan();
  const t = useT();
  const navigate = useNavigate();
  const meta = useLoad(api.meta, []);
  const [name, setName] = useState(plan.name);
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setSending(true);
    try {
      const result = await more.login({ name, token });
      plan.setName(result.name);
      navigate("/");
    } catch (err) {
      setError(err.message);
      setSending(false);
    }
  };

  return (
    <Split photo="hero-left" heading="Tukusanyukidde." line="Plan the whole celebration in one place and see the full cost before you pay.">
      <PageHead eyebrow={t("Account")} title={plan.name ? `Welcome back, ${plan.name}` : t("Log in")}>
        <p className="quiet">Tell us who is planning, and we will greet you and put your name on your bookings.</p>
      </PageHead>
      <form className="form" onSubmit={submit}>
        <label className="field">
          <span className="caps">{t("Your name")}</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Nantongo" autoComplete="given-name" maxLength={40} required />
        </label>
        <div className="field">
          <span className="caps">Security check</span>
          <HumanCheck siteKey={meta.data?.turnstile.siteKey} onToken={setToken} onProblem={setError} />
          <small className="quiet">Cloudflare confirms you are a person before you are let in.{meta.data?.turnstile.test ? " Running with Cloudflare's test keys, which always pass." : ""}</small>
        </div>
        <ErrorNote>{error || meta.error}</ErrorNote>
        <button className="button" disabled={!token || sending}>{sending ? "Checking…" : t("Continue")}</button>
        <p className="aside-note">Accounts are not connected yet: only your name is kept, on this device. See our <Link to="/privacy" className="link-quiet">privacy policy</Link>.</p>
      </form>
      <p className="quiet">Run an events business? <Link to="/vendors" className="link-quiet">List it on Celebrate</Link></p>
    </Split>
  );
}

const REASONS = [
  { icon: CalendarCheck, title: "Bookings come to you", text: "Families planning a kwanjula, wedding, graduation or party find you by district and date." },
  { icon: Wallet, title: "Clear prices, paid up front", text: "Customers see your price, labour and transport in one total, and pay before the day." },
  { icon: BadgeCheck, title: "A verified badge", text: "Verified vendors are shown first and marked on every listing." },
];

export function Vendors() {
  const t = useT();
  return (
    <Split photo="cat:catering" heading="Bring your business to the celebration." line="Tent hire, caterers, venues, cakes, sound, photographers, MCs and games.">
      <PageHead eyebrow={t("For vendors")} title={t("List my business")}>
        <p className="quiet">Vendor sign-up is not open yet. This is what listing on Celebrate will give you.</p>
      </PageHead>
      <ul className="reasons">
        {REASONS.map(({ icon: Icon, title, text }) => (
          <li key={title}>
            <span className="reason-icon"><Icon size={20} aria-hidden="true" /></span>
            <div><h2>{title}</h2><p className="quiet">{text}</p></div>
          </li>
        ))}
      </ul>
      <Link to="/services" className="button outline">See who is listed</Link>
    </Split>
  );
}

export function NotFound() {
  const t = useT();
  return (
    <div className="page centre-page">
      <Mark className="big" />
      <PageHead eyebrow="Not found" title="We could not find that page" />
      <Link to="/" className="button fit">{t("Back to home")}</Link>
    </div>
  );
}
