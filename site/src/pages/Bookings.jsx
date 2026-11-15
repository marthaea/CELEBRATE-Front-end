import { Link } from "react-router-dom";
import { api, useLoad } from "../../../src/api.js";
import { formatDate, money } from "../../../src/format.js";
import { ErrorNote, Loading, PageHead } from "../components.jsx";
import { useT } from "../i18n.jsx";

export default function Bookings() {
  const t = useT();
  const { data, error, loading } = useLoad(api.bookings, []);
  return (
    <div className="page centre-page wide">
      <PageHead eyebrow={t("Bookings")} title={t("Your events")} />
      <ErrorNote>{error}</ErrorNote>
      {loading && <Loading />}
      {data && data.length === 0 && (
        <>
          <p className="quiet">No bookings yet. Once you pay for a plan, its receipt and vendor updates appear here.</p>
          <Link to="/services" className="button fit">{t("Browse services")}</Link>
        </>
      )}
      {data && data.length > 0 && (
        <ul className="lines bookings">
          {data.map((booking) => {
            const waiting = booking.vendors.filter((v) => v.status !== "Confirmed").length;
            return (
              <li key={booking.id}>
                <Link to={`/receipt/${booking.id}`}>
                  <span>{booking.event.type} · {formatDate(booking.event.date)}<small className="quiet">{booking.id} · {booking.event.district} · {money(booking.paid)}</small></span>
                  <span className={`state ${waiting ? "waiting" : "confirmed"}`}>{waiting ? `${waiting} waiting` : "Confirmed"}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
