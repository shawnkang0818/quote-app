import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";
import { calculateQuoteTotals } from "./calculateQuoteTotals";

const DEFAULT_COMPANY = {
  name: "Auto Parts Quote System",
  address: "Brooklyn, NY",
  phone: "(555) 123-4567",
  email: "sales@example.com",
  quoteValidityDays: 30,
  quoteNotes:
    "Thank you for your business. Prices are subject to change without notice.",
};

export function generateQuotePDF({
  businessSettings = {},
  customer = {},
  customerName,
  laborItems = [],
  notes = {},
  quoteItems = [],
  quoteNumber: savedQuoteNumber,
  quoteDate,
  taxRate,
  vehicle = {},
}) {
  if (quoteItems.length === 0 && laborItems.length === 0) {
    throw new Error("Add at least one part or labor item.");
  }

  const doc = new jsPDF();
  // A saved quote keeps its permanent number. Unsaved previews are clearly
  // marked as drafts so they cannot be mistaken for stored records.
  const quoteNumber = savedQuoteNumber || `DRAFT-${Date.now()}`;
  const company = {
    ...DEFAULT_COMPANY,
    ...businessSettings,
    name: businessSettings.companyName || DEFAULT_COMPANY.name,
  };
  const issuedDate = quoteDate ? new Date(quoteDate) : new Date();
  const validUntil = new Date(issuedDate);
  validUntil.setDate(
    validUntil.getDate() + Number(company.quoteValidityDays || 30)
  );
  const contact = [company.phone, company.email].filter(Boolean).join(" | ");
  const displayCustomerName = customer.name || customerName || "Walk-in Customer";
  const customerContact = [customer.phone, customer.email]
    .filter(Boolean)
    .join(" | ");
  const vehicleText = [vehicle.year, vehicle.make, vehicle.model]
    .filter(Boolean)
    .join(" ");

  const totals = calculateQuoteTotals({ quoteItems, laborItems, taxRate });

  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(company.name, 14, 20);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  if (company.address) doc.text(company.address, 14, 27);
  if (contact) doc.text(contact, 14, 33);

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Quotation", 150, 20);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Quote No: ${quoteNumber}`, 150, 28);
  doc.text(`Date: ${issuedDate.toLocaleDateString()}`, 150, 34);
  doc.text(`Valid Until: ${validUntil.toLocaleDateString()}`, 150, 40);

  doc.setFont("helvetica", "bold");
  doc.text("Bill To:", 14, 48);
  doc.setFont("helvetica", "normal");
  doc.text(displayCustomerName, 14, 54);
  if (customerContact) doc.text(customerContact, 14, 60);

  doc.setFont("helvetica", "bold");
  doc.text("Vehicle:", 14, 68);
  doc.setFont("helvetica", "normal");
  doc.text(vehicleText || "Not specified", 14, 74);
  const vehicleDetails = [
    vehicle.licensePlate && `Plate: ${vehicle.licensePlate}`,
    vehicle.vin && `VIN: ${vehicle.vin}`,
    vehicle.mileage !== undefined && vehicle.mileage !== "" &&
      `Mileage: ${Number(vehicle.mileage).toLocaleString()}`,
  ]
    .filter(Boolean)
    .join(" | ");
  if (vehicleDetails) doc.text(vehicleDetails, 14, 80);

  // Parts and labor share one client-facing table, while their separate source
  // arrays are preserved for accurate subtotal calculations and history data.
  const tableBody = quoteItems.map((item, index) => [
    index + 1,
    item.name,
    `$${Number(item.price).toFixed(2)}`,
    item.quoteQuantity,
    `$${(Number(item.price) * item.quoteQuantity).toFixed(2)}`,
  ]);

  laborItems.forEach((item, index) => {
    tableBody.push([
      quoteItems.length + index + 1,
      `Labor: ${item.description}`,
      `$${Number(item.hourlyRate).toFixed(2)}/hr`,
      Number(item.hours),
      `$${(Number(item.hourlyRate) * Number(item.hours)).toFixed(2)}`,
    ]);
  });

  autoTable(doc, {
    startY: 88,
    head: [["#", "Part / Labor", "Unit Price", "Qty/Hrs", "Line Total"]],
    body: tableBody,
    theme: "grid",
    styles: {
      fontSize: 10,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [41, 128, 185],
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 12 },
      2: { halign: "right" },
      3: { halign: "center", cellWidth: 18 },
      4: { halign: "right" },
    },
  });

  const finalY = doc.lastAutoTable.finalY || 80;
  const pageHeight = doc.internal.pageSize.height;

  doc.setFont("helvetica", "normal");
  doc.text(`Parts: $${totals.partsSubtotal.toFixed(2)}`, 140, finalY + 12);
  doc.text(`Labor: $${totals.laborTotal.toFixed(2)}`, 140, finalY + 20);
  doc.text(`Tax: $${totals.taxAmount.toFixed(2)}`, 140, finalY + 28);

  doc.setFont("helvetica", "bold");
  doc.text(`Total: $${totals.grandTotal.toFixed(2)}`, 140, finalY + 38);

  let noteY = finalY + 20;

  const writeNoteSection = (title, content) => {
    if (!content) return;
    const lines = doc.splitTextToSize(String(content), 112);
    const requiredHeight = 8 + lines.length * 5;

    // Long quotes can push notes onto a fresh page instead of clipping them.
    if (noteY + requiredHeight > pageHeight - 18) {
      doc.addPage();
      noteY = 20;
    }

    doc.setFont("helvetica", "bold");
    doc.text(title, 14, noteY);
    doc.setFont("helvetica", "normal");
    doc.text(lines, 14, noteY + 6);
    noteY += requiredHeight;
  };

  writeNoteSection("Customer Request:", notes.customerRequest);
  writeNoteSection("Technician Notes:", notes.technicianNotes);
  writeNoteSection("Terms & Notes:", company.quoteNotes);

  // Apply a consistent footer to every page, including pages added for notes.
  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated by ${company.name}`, 14, pageHeight - 10);
    doc.text(`Page ${page} of ${pageCount}`, 176, pageHeight - 10);
  }

  doc.save(`${quoteNumber}.pdf`);
  return quoteNumber;
}
