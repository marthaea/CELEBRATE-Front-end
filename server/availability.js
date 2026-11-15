// Sample availability. Until vendors keep real calendars, each vendor is "booked" on a fixed,
// made-up set of dates (the same every time you look), plus any date already booked through the site.

function hash(text) {
  let h = 2166136261;
  for (const ch of text) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}

/** True when the sample calendar has this service taken on this ISO date. */
export function sampleBooked(serviceId, date) {
  const day = new Date(`${date}T00:00:00Z`).getUTCDay();
  const busy = day === 6 ? 10 : day === 0 || day === 5 ? 6 : 3; // Saturdays fill up first
  return hash(`${serviceId}:${date}`) % 100 < busy;
}

/** The ids, from `serviceIds`, that are not free on `date`, given the bookings made so far. */
export function unavailable(serviceIds, date, bookings = []) {
  const taken = new Set(
    bookings.filter((b) => b.event.date === date).flatMap((b) => b.quote.lines.map((line) => line.id))
  );
  return serviceIds.filter((id) => taken.has(id) || sampleBooked(id, date));
}

/** Every date in a month ("2026-12") on which the service is not free. */
export function bookedDays(serviceId, month, bookings = []) {
  const [year, m] = month.split("-").map(Number);
  const days = new Date(Date.UTC(year, m, 0)).getUTCDate();
  const all = Array.from({ length: days }, (_, i) => `${month}-${String(i + 1).padStart(2, "0")}`);
  return all.filter((date) => unavailable([serviceId], date, bookings).length > 0);
}

/** The first date on or after `date`, within about four months, on which every service is free. */
export function nextFreeDate(serviceIds, date, bookings = []) {
  const day = new Date(`${date}T00:00:00Z`);
  for (let i = 0; i < 120; i += 1) {
    const iso = day.toISOString().slice(0, 10);
    if (unavailable(serviceIds, iso, bookings).length === 0) return iso;
    day.setUTCDate(day.getUTCDate() + 1);
  }
  return null;
}
