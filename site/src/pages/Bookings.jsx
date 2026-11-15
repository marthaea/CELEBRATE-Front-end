import { Link } from "react-router-dom";
import { api, useLoad } from "../../../src/api.js";
import { formatDate, money } from "../../../src/format.js";
import { ErrorNote, Loading, PageHead } from "../components.jsx";
import { daysUntil, localBookings } from "../extra.js";
import { useT } from "../i18n.jsx";

export default function Bookings() {
  const t = useT();
  // The server's list, plus any bookings made in this browser that the server no longer has.
  const { data, error, loading } = useLoad(async () => {
    const mine = localBookings.all();
    try {
      const all = await api.bookings();
      return [...all, ...mine.filter((b) => !all.some((x) => x.id === b.id))];
    } catch (problem) {
      if (mine.length) return mine;
      throw problem;
    }
  }, []);
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
                  <span>{booking.event.type} · {formatDate(booking.event.date)}<small className="quiet">{booking.id} · {booking.event.district} · {money(booking.paid)}{daysUntil(booking.event.date) > 0 ? ` · ${daysUntil(booking.event.date)} ${t("days to go")}` : ""}</small></span>
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
