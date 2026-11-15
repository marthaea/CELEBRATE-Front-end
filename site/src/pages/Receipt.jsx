import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { api, useLoad } from "../../../src/api.js";
import { formatDate, money, toISODate } from "../../../src/format.js";
import { daysUntil, localBookings } from "../extra.js";
import { useT } from "../i18n.jsx";
import { confetti, drumBeat } from "../party.js";
import { ErrorNote, Loading, PageHead } from "../components.jsx";

// What to do and when, counted back from the event date. `needs` limits a step to bookings with that kind of vendor.
const STEPS = [
  { before: 28, text: "Confirm the guest list and send invitations" },
  { before: 21, text: "Share the programme with your MC", needs: "MCs" },
  { before: 14, text: "Confirm the menu and final numbers with the caterer", needs: "Catering" },
  { before: 7, text: "Send directions to guests and vendors" },
  { before: 2, text: "Call each vendor to confirm arrival times" },
  { before: 1, text: "Tents and chairs go up", needs: "Tents" },
  { before: 1, text: "Sound check", needs: "Sound" },
  { before: 0, text: "Celebrate. Tukusanyukidde!" },
];

function dateBefore(iso, days) {
  const date = new Date(`${iso}T00:00:00`);
  date.setDate(date.getDate() - days);
  return toISODate(date);
}

/** Loads a booking from the server, falling back to the copy kept in this browser. */
export function useBooking(id) {
  return useLoad(async () => {
    try {
      return await api.booking(id);
    } catch (error) {
      const saved = localBookings.get(id);
      if (saved) return saved;
      throw error;
    }
  }, [id]);
}

function Checklist({ booking }) {
  const key = `celebrate.checklist.${booking.id}`;
  const [done, setDone] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(key)) ?? [];
    } catch {
      return [];
    }
  });
  const kinds = booking.vendors.map((v) => v.category);
  const steps = useMemo(() => STEPS.filter((step) => !step.needs || kinds.includes(step.needs)), [kinds.join(",")]);
  const today = toISODate(new Date());

  const toggle = (text) => {
    const next = done.includes(text) ? done.filter((x) => x !== text) : [...done, text];
    setDone(next);
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // Ticks last for this visit only.
    }
  };

  return (
    <ol className="timeline">
      {steps.map((step) => {
        const due = dateBefore(booking.event.date, step.before);
        const ticked = done.includes(step.text);
        return (
          <li key={step.text} className={`${ticked ? "done" : ""} ${!ticked && due < today ? "late" : ""}`}>
            <label>
              <input type="checkbox" checked={ticked} onChange={() => toggle(step.text)} />
              <span>{step.text}<small>{step.before === 0 ? "On the day" : `${formatDate(due)} · ${step.before} ${step.before === 1 ? "day" : "days"} before`}{!ticked && due < today ? " · overdue" : ""}</small></span>
            </label>
          </li>
        );
      })}
    </ol>
  );
}

export default function Receipt() {
  const { id } = useParams();
  const t = useT();
  const { state } = useLocation();
  const { data: booking, error, loading } = useBooking(id);
  const [making, setMaking] = useState(false);
  const [pdfError, setPdfError] = useState("");

  // Only straight after paying, not every time the receipt is opened again.
  useEffect(() => {
    if (state?.fresh && booking) {
      confetti();
      drumBeat();
      window.history.replaceState({}, "");
    }
  }, [booking?.id]);

  const download = async () => {
    setMaking(true);
    setPdfError("");
    try {
      const { downloadReceipt } = await import("../receiptPdf.js");
      await downloadReceipt(booking);
    } catch {
      setPdfError("We could not make the PDF. Check your connection and try again.");
    }
    setMaking(false);
  };

  const days = booking ? daysUntil(booking.event.date) : null;

  return (
    <div className="page centre-page">
      <PageHead eyebrow="Your event is booked" title="Webale nnyo!">
        <p className="quiet">{t("Thank you")}{booking?.customer ? `, ${booking.customer}` : ""}. Your vendors have been told, and you can follow them here.</p>
      </PageHead>
      <ErrorNote>{error}</ErrorNote>
      {loading && <Loading />}
      {booking && (
        <div className="receipt">
          <div className="countdown" role="status">
            <p className="countdown-number">{days > 0 ? days : days === 0 ? "Today" : "Done"}</p>
            <p>{days > 0 ? `${days === 1 ? "day" : t("days to go")}${days === 1 ? " to go" : ""}` : days === 0 ? "Enjoy every minute" : "We hope it was wonderful"}<small>{booking.event.type} · {formatDate(booking.event.date)} · {booking.event.district}</small></p>
          </div>

          <dl className="sums ruled">
            <div><dt>E-receipt no.</dt><dd>{booking.id}</dd></div>
            <div><dt>Paid</dt><dd>{money(booking.paid)}</dd></div>
            <div><dt>Method</dt><dd>{booking.method}</dd></div>
            <div><dt>Guests</dt><dd>{booking.event.guests.toLocaleString("en-US")}</dd></div>
          </dl>

          <button className="button" onClick={download} disabled={making}>{making ? "Making your receipt…" : "Download PDF receipt"}</button>
          <ErrorNote>{pdfError}</ErrorNote>
          <p className="quiet centre">The PDF carries a QR code. A vendor scans it on the day to check the booking.</p>

          <h2 className="caps">{t("Track your vendors")}</h2>
          <ul className="lines">
            {booking.vendors.map((v) => (
              <li key={`${v.category}-${v.vendor}`}>
                <p>{t(v.category)} <span className="quiet">· {v.vendor}</span></p>
                <span className={`state ${v.status === "Confirmed" ? "confirmed" : "waiting"}`}>{v.status}</span>
              </li>
            ))}
          </ul>

          <h2 className="caps">Your countdown checklist</h2>
          <Checklist booking={booking} />
        </div>
      )}
      <Link to="/" className="link-caps">{t("Back to home")}</Link>
    </div>
  );
}
