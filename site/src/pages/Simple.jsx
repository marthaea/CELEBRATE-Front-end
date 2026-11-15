import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { usePlan } from "../../../src/plan.jsx";
import { PageHead } from "../components.jsx";

export function Account() {
  const plan = usePlan();
  const navigate = useNavigate();
  const [name, setName] = useState(plan.name);

  const submit = (event) => {
    event.preventDefault();
    plan.setName(name.trim());
    navigate("/");
  };

  return (
    <div className="page centre-page">
      <PageHead eyebrow="Account" title="Log in" />
      <form className="form narrow" onSubmit={submit}>
        <label className="field">
          <span className="caps">Your name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Nantongo" autoComplete="given-name" maxLength={40} required />
        </label>
        <p className="aside-note">Accounts are not set up yet. Your name is kept on this device so we can greet you and put it on your bookings.</p>
        <button className="button">Continue</button>
      </form>
    </div>
  );
}

export function Vendors() {
  return (
    <div className="page centre-page">
      <PageHead eyebrow="For vendors" title="List my business">
        <p className="quiet">Vendor sign-up is not open yet. This is where tent hire, caterers, venues and other providers will list their services and prices.</p>
      </PageHead>
      <Link to="/services" className="link-caps">See who is listed</Link>
    </div>
  );
}

export function NotFound() {
  return (
    <div className="page centre-page">
      <PageHead eyebrow="Not found" title="We could not find that page" />
      <Link to="/" className="link-caps">Back to home</Link>
    </div>
  );
}
