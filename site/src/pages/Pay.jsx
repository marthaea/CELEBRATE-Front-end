import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { api, useLoad } from "../../../src/api.js";
import { money } from "../../../src/format.js";
import { usePlan } from "../../../src/plan.jsx";
import { ErrorNote, Loading, PageHead, Summary } from "../components.jsx";
import { useT } from "../i18n.jsx";

export default function Pay() {
  const plan = usePlan();
  const t = useT();
  const navigate = useNavigate();
  const { event, items } = plan;
  const meta = useLoad(api.meta, []);
  const quote = useLoad(() => (items.length ? api.quote(event, items) : Promise.resolve(null)), []);
  const [method, setMethod] = useState("mtn");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [paying, setPaying] = useState(false);

  if (!items.length && !paying) return <Navigate to="/plan" replace />;

  const chosen = meta.data?.paymentMethods.find((m) => m.id === method);
  const total = quote.data?.total;

  const pay = async (e) => {
    e.preventDefault();
    setError("");
    setPaying(true);
    try {
      const booking = await api.book({ event, items, payment: { method, phone }, customer: plan.name });
      plan.clearItems();
      navigate(`/receipt/${booking.id}`, { replace: true });
    } catch (err) {
      setError(err.message);
      setPaying(false);
    }
  };

  return (
    <div className="page">
      <PageHead eyebrow="Step 4 of 4 · Payment" title={t("Pay your way")}>
        <p className="quiet">{total ? `Amount due: ${money(total)}` : "Working out the amount due…"}</p>
      </PageHead>

      <div className="split">
        <form className="form" onSubmit={pay} noValidate>
          <ErrorNote>{meta.error || quote.error}</ErrorNote>
          {meta.loading && <Loading />}
          {meta.data && (
            <>
              <fieldset className="choices">
                <legend className="caps">{t("Choose how to pay")}</legend>
                {meta.data.paymentMethods.map((option) => (
                  <label key={option.id} className={`choice ${method === option.id ? "on" : ""}`}>
                    <input type="radio" name="method" checked={method === option.id} onChange={() => { setMethod(option.id); setError(""); }} />
                    <span className="dot" aria-hidden="true" />
                    <span>{option.name}<small>{option.hint}</small></span>
                  </label>
                ))}
              </fieldset>

              {chosen?.needsPhone ? (
                <>
                  <label className="field">
                    <span className="caps">Mobile money number</span>
                    <input type="tel" inputMode="tel" autoComplete="tel" placeholder="0770 000 000" value={phone} onChange={(e) => { setPhone(e.target.value); setError(""); }} />
                  </label>
                  <p className="aside-note">You will get a prompt on your phone. Enter your PIN there to approve. CELEBRATE never sees or stores your PIN.</p>
                </>
              ) : (
                <p className="aside-note">
                  {method === "bank"
                    ? "We will show the bank details and your payment reference on the receipt."
                    : "You will enter your card details on the card provider's secure page."}
                </p>
              )}

              <ErrorNote>{error}</ErrorNote>
              <button className="button" disabled={!total || paying}>{paying ? "Confirming…" : total ? `Pay ${money(total)}` : "Pay"}</button>
              <p className="quiet centre">By paying you accept the terms and privacy policy.</p>
            </>
          )}
        </form>

        <aside className="summary" aria-label="Order summary">
          <div className="block-head">
            <h2 className="caps">{t("Your plan")}</h2>
            <Link to="/plan" className="link-quiet">Edit</Link>
          </div>
          {quote.loading && <Loading label="Adding it all up" />}
          {quote.data && <Summary quote={quote.data} categories={meta.data?.categories} />}
        </aside>
      </div>
    </div>
  );
}
