import express from "express";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { CATEGORIES, DISTRICTS, EVENT_TYPES, OFFER_IDS, PAYMENT_METHODS, SERVICES } from "./data.js";
import { buildQuote, validateEvent } from "./pricing.js";

const app = express();
app.use(express.json({ limit: "50kb" }));

const byId = new Map(SERVICES.map((service) => [service.id, service]));
const categoryById = new Map(CATEGORIES.map((category) => [category.id, category]));

// Bookings live in memory: they are lost when the server restarts.
const bookings = [];
let nextReceipt = 123;

const money = (n) => `UGX ${n.toLocaleString("en-US")}`;

function resolveItems(ids) {
  if (!Array.isArray(ids) || ids.length === 0) return { error: "Your plan is empty." };
  const unique = [...new Set(ids)];
  const services = unique.map((id) => byId.get(id));
  if (services.some((service) => !service)) return { error: "A service in your plan is no longer available." };
  return { services };
}

app.get("/api/meta", (_req, res) => {
  res.json({ eventTypes: EVENT_TYPES, districts: DISTRICTS, categories: CATEGORIES, paymentMethods: PAYMENT_METHODS });
});

app.get("/api/services", (req, res) => {
  const { category, filter } = req.query;
  const q = String(req.query.q ?? "").trim().toLowerCase();
  let list = SERVICES;
  if (category) list = list.filter((service) => service.category === category);
  if (q) {
    // Every word must appear somewhere; "in" and "near" are ignored so "tents in Mukono" works.
    const words = q.split(/\s+/).filter((word) => !["in", "near", "at", "for", "a", "the"].includes(word));
    list = list.filter((service) => {
      const haystack = [service.name, service.vendor, service.district, service.category, categoryById.get(service.category).title].join(" ").toLowerCase();
      return words.every((word) => haystack.includes(word));
    });
  }
  if (filter === "under500k") list = list.filter((service) => service.price < 500000);
  if (filter === "top") list = list.filter((service) => service.rating >= 4.7);
  if (filter === "offers") list = list.filter((service) => service.wasPrice);
  res.json(list);
});

app.get("/api/services/:id", (req, res) => {
  const service = byId.get(req.params.id);
  if (!service) return res.status(404).json({ error: "We could not find that service." });
  res.json(service);
});

app.get("/api/offers", (_req, res) => {
  res.json(OFFER_IDS.map((id) => byId.get(id)));
});

app.post("/api/quote", (req, res) => {
  const { event, items } = req.body ?? {};
  const errors = validateEvent(event);
  if (errors.length) return res.status(400).json({ error: errors.join(" ") });
  const { services, error } = resolveItems(items);
  if (error) return res.status(400).json({ error });
  res.json(buildQuote(services, event));
});

app.post("/api/bookings", (req, res) => {
  const { event, items, payment, customer } = req.body ?? {};
  const errors = validateEvent(event);
  if (errors.length) return res.status(400).json({ error: errors.join(" ") });
  const { services, error } = resolveItems(items);
  if (error) return res.status(400).json({ error });

  const method = PAYMENT_METHODS.find((m) => m.id === payment?.method);
  if (!method) return res.status(400).json({ error: "Choose how to pay." });
  const phone = String(payment?.phone ?? "").replace(/\s+/g, "");
  if (method.needsPhone && !/^(0|\+?256)7\d{8}$/.test(phone)) {
    return res.status(400).json({ error: "Enter a valid mobile money number, like 0770 000 000." });
  }

  // No money moves here. Connect a payment provider (MTN MoMo, Airtel Money, a card gateway) at this point.
  const quote = buildQuote(services, event);
  const booking = {
    id: `CLB-${String(nextReceipt++).padStart(6, "0")}`,
    createdAt: new Date().toISOString(),
    customer: String(customer ?? "").slice(0, 60),
    event,
    quote,
    paid: quote.total,
    method: method.name,
    vendors: services.map((service) => ({
      category: categoryById.get(service.category).name,
      vendor: service.vendor,
      status: service.instantConfirm ? "Confirmed" : "Waiting",
    })),
  };
  bookings.unshift(booking);
  res.status(201).json(booking);
});

app.get("/api/bookings", (_req, res) => res.json(bookings));

app.get("/api/bookings/:id", (req, res) => {
  const booking = bookings.find((b) => b.id === req.params.id);
  if (!booking) return res.status(404).json({ error: "We could not find that booking." });
  res.json(booking);
});

app.get("/api/bookings/:id/receipt", (req, res) => {
  const booking = bookings.find((b) => b.id === req.params.id);
  if (!booking) return res.status(404).json({ error: "We could not find that booking." });
  const { quote, event } = booking;
  const row = (label, value) => `${label.padEnd(44, " ")}${value.padStart(16, " ")}`;
  const text = [
    "CELEBRATE · Tukusanyukidde",
    "E-RECEIPT",
    "",
    row("E-receipt no.", booking.id),
    row("Paid", money(booking.paid)),
    row("Method", booking.method),
    row("Event", `${event.type}, ${event.date}`),
    row("District", event.district),
    row("Guests", String(event.guests)),
    "",
    ...quote.lines.map((line) => row(`${line.name} (${line.vendor})`.slice(0, 43), money(line.amount))),
    "",
    row("Item cost", money(quote.itemCost)),
    row("Labour and setup", money(quote.labour)),
    row("Transport", money(quote.transport)),
    row(`Platform fee (${Math.round(quote.feeRate * 100)}%)`, money(quote.platformFee)),
    row("GRAND TOTAL", money(quote.total)),
    "",
    "Webale nnyo!",
    "",
  ].join("\n");
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${booking.id}.txt"`);
  res.send(text);
});

app.use("/api", (_req, res) => res.status(404).json({ error: "Not found." }));

// In production the same server also serves the built React app.
// STATIC_DIR picks which front end to serve: the phone app (dist, the default) or the website (site/dist).
const dist = process.env.STATIC_DIR
  ? path.resolve(process.env.STATIC_DIR)
  : path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "dist");
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get("*", (_req, res) => res.sendFile(path.join(dist, "index.html")));
}

const port = Number(process.env.PORT) || 3001;
app.listen(port, () => console.log(`CELEBRATE API listening on http://localhost:${port}`));
