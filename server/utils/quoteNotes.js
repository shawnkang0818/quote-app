export const MAX_QUOTE_NOTE_LENGTH = 1000;

function normalizeNote(value, label) {
  const note = String(value || "").trim();
  if (note.length > MAX_QUOTE_NOTE_LENGTH) {
    const error = new Error(
      `${label} must be ${MAX_QUOTE_NOTE_LENGTH} characters or fewer`
    );
    error.status = 400;
    throw error;
  }
  return note;
}

// Keep user-facing requests and internal technician observations separate.
export function normalizeQuoteNotes(notes = {}) {
  return {
    customerRequest: normalizeNote(notes.customerRequest, "Customer request"),
    technicianNotes: normalizeNote(notes.technicianNotes, "Technician notes"),
  };
}
