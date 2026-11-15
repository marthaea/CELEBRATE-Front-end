import { Link, useParams } from "react-router-dom";
import { api, useLoad } from "../../../src/api.js";
import { formatDate, money } from "../../../src/format.js";
import { ErrorNote, Loading, PageHead } from "../components.jsx";

export default function Receipt() {
  const { id } = useParams();
  const { data: booking, error, loading } = useLoad(() => api.booking(id), [id]);

  return (
    <div className="page centre-page">
      <PageHead eyebrow="Your event is booked" title="Webale nnyo!">
        <p className="quiet">Thank you{booking?.customer ? `, ${booking.customer}` : ""}. Your vendors have been told, and you can follow them here.</p>
      </PageHead>
      <ErrorNote>{error}</ErrorNote>
      {loading && <Loading />}
      {booking && (
        <div className="receipt">
          <dl className="sums ruled">
            <div><dt>E-receipt no.</dt><dd>{booking.id}</dd></div>
            <div><dt>Paid</dt><dd>{money(booking.paid)}</dd></div>
            <div><dt>Method</dt><dd>{booking.method}</dd></div>
            <div><dt>Event</dt><dd>{booking.event.type} · {formatDate(booking.event.date)} · {booking.event.district}</dd></div>
          </dl>

          <h2 className="caps">Track your vendors</h2>
          <ul className="lines">
            {booking.vendors.map((v) => (
              <li key={`${v.category}-${v.vendor}`}>
                <p>{v.category} <span className="quiet">· {v.vendor}</span></p>
                <span className={`state ${v.status === "Confirmed" ? "confirmed" : "waiting"}`}>{v.status}</span>
              </li>
            ))}
          </ul>

          <a className="button" href={`/api/bookings/${booking.id}/receipt`} download>Download e-receipt</a>
        </div>
      )}
      <Link to="/" className="link-caps">Back to home</Link>
    </div>
  );
}
