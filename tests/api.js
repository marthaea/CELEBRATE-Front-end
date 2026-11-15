import test from "node:test";
import assert from "node:assert/strict";
import app from "../server/app.js";
import { nextFreeDate } from "../server/availability.js";

// Runs the real API on a spare port and calls it the way the website does.
const server = app.listen(0);
const base = `http://localhost:${server.address().port}/api`;
test.after(() => server.close());

const call = async (path, data) => {
  const response = await fetch(base + path, data && { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  return { status: response.status, body: await response.json() };
};

const items = ["lakeside-hall-gardens", "draped-tent-100", "buffet", "pa-dj", "photo-full-day"];
const date = nextFreeDate(items, "2027-03-01");
const event = { type: "Kwanjula", guests: 250, tents: 6, date, district: "Mukono", setup: "vendor" };
const payment = { method: "mtn", phone: "0770 000 000" };

test("a booking takes a 30% deposit, then the balance, and the date is then taken", async () => {
  const made = await call("/bookings", { event, items, payment, customer: "Nantongo", deposit: true });
  assert.equal(made.status, 201);
  assert.equal(made.body.total, 16995000);
  assert.equal(made.body.paid, 5098500);
  assert.equal(made.body.balance, 11896500);

  const again = await call("/bookings", { event, items: ["buffet"], payment, deposit: true });
  assert.equal(again.status, 409);

  const badPhone = await call(`/bookings/${made.body.id}/balance`, { payment: { method: "mtn", phone: "123" } });
  assert.equal(badPhone.status, 400);
  const settled = await call(`/bookings/${made.body.id}/balance`, { payment });
  assert.equal(settled.body.paid, 16995000);
  assert.equal(settled.body.balance, 0);
  assert.equal((await call(`/bookings/${made.body.id}/balance`, { payment })).status, 400);
});

test("without the deposit option the whole amount is paid, as the phone app expects", async () => {
  const other = { ...event, date: nextFreeDate(["party-cake"], "2027-04-01") };
  const made = await call("/bookings", { event: other, items: ["party-cake"], payment });
  assert.equal(made.status, 201);
  assert.equal(made.body.balance, 0);
  assert.equal(made.body.paid, made.body.quote.total);
});

test("messages reach only vendors on the booking and lose phone numbers", async () => {
  const other = { ...event, date: nextFreeDate(["luwombo"], "2027-05-01") };
  const { body: booking } = await call("/bookings", { event: other, items: ["luwombo"], payment, deposit: true });
  assert.equal((await call(`/bookings/${booking.id}/messages`, { serviceId: "buffet", text: "Hello" })).status, 400);
  const sent = await call(`/bookings/${booking.id}/messages`, { serviceId: "luwombo", text: "Ring 0770 123 456" });
  assert.equal(sent.status, 201);
  assert.equal(sent.body[0].text, "Ring [number removed]");
  assert.equal(sent.body[1].from, "system");
  assert.equal((await call(`/bookings/${booking.id}/messages`)).body.length, 2);
});

test("an appointment takes its time slot, and cancelling frees it", async () => {
  const day = nextFreeDate(["bridal-gown"], "2027-02-01");
  const before = (await call(`/services/bridal-gown/slots?date=${day}`)).body;
  assert.equal(before.kind, "Fitting");
  assert.equal(before.free.length, 7);
  const visit = await call("/appointments", { serviceId: "bridal-gown", date: day, time: "10:00", name: "Nantongo" });
  assert.equal(visit.status, 201);
  assert.equal((await call("/appointments", { serviceId: "bridal-gown", date: day, time: "10:00", name: "Other" })).status, 409);
  assert.equal((await call(`/services/bridal-gown/slots?date=${day}`)).body.free.length, 6);
  assert.equal((await call("/appointments", { serviceId: "bridal-gown", date: "2020-01-01", time: "10:00", name: "A" })).status, 400);
  await call(`/appointments/${visit.body.id}/cancel`, {});
  assert.equal((await call(`/services/bridal-gown/slots?date=${day}`)).body.free.length, 7);
});

test("logging in needs a name and the security check", async () => {
  assert.equal((await call("/login", { name: "", token: "x" })).status, 400);
  assert.equal((await call("/login", { name: "Nantongo", token: "" })).status, 400);
});
