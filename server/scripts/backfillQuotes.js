import mongoose from "mongoose";
import dotenv from "dotenv";
import Quote from "../models/Quote.js";
import {
  calculateQuoteTotals,
  DEFAULT_TAX_RATE,
  roundCurrency,
} from "../utils/quoteCalculations.js";

dotenv.config();

async function backfillQuotes() {
  await mongoose.connect(process.env.MONGO_URI);

  // This selector makes the migration safe to rerun: quotes already carrying
  // the new identity and summary fields are left unchanged.
  const quotes = await Quote.find({
    $or: [
      { quoteNumber: { $exists: false } },
      { partsSubtotal: { $exists: false } },
    ],
  });

  for (const quote of quotes) {
    const laborItems = (quote.laborItems || []).map((item) => ({
      description: item.description,
      hours: Number(item.hours),
      hourlyRate: roundCurrency(item.hourlyRate),
      total: roundCurrency(Number(item.hours) * Number(item.hourlyRate)),
    }));
    const totals = calculateQuoteTotals({
      items: quote.items,
      laborItems,
      taxRate: quote.taxRate ?? DEFAULT_TAX_RATE,
    });

    // Legacy timestamps and the final ObjectId characters produce a readable,
    // stable quote number instead of generating a different value on each run.
    quote.quoteNumber =
      quote.quoteNumber ||
      `QT-${new Date(quote.createdAt).getTime()}-${quote._id
        .toString()
        .slice(-4)
        .toUpperCase()}`;
    quote.laborItems = laborItems;
    quote.partsSubtotal = totals.partsSubtotal;
    quote.laborTotal = totals.laborTotal;
    quote.subtotal = totals.subtotal;
    quote.taxRate = totals.taxRate;
    quote.taxAmount = totals.taxAmount;
    quote.total = totals.grandTotal;
    await quote.save();
  }

  console.log(`Updated ${quotes.length} legacy quote(s)`);

  // Scripts exit more reliably when their database connection is explicitly
  // closed after all writes finish.
  await mongoose.disconnect();
}

backfillQuotes().catch(async (error) => {
  console.error("Quote migration failed:", error.message);
  await mongoose.disconnect();
  process.exitCode = 1;
});
