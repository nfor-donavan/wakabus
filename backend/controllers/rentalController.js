const Rental = require("../models/Rental");

// --- Agency-scoped (counter/admin) ---------------------------------------
// Same pattern as every other agency controller: tenantId always comes from
// the verified JWT (req.user.tenantId), never from the request body.

// POST /api/agency/rentals — a counter agent logs a request that came in by
// phone or in person, since not every customer will use a self-service form.
exports.createRental = async (req, res) => {
  const {
    customerName,
    customerPhone,
    customerEmail,
    purpose,
    pickupLocation,
    destination,
    startDate,
    endDate,
    passengerCount,
    notes,
  } = req.body;

  if (!customerName || !customerPhone || !purpose || !pickupLocation || !destination || !startDate || !endDate) {
    return res.status(400).json({ message: "Missing required rental request fields" });
  }

  const rental = await Rental.create({
    tenantId: req.user.tenantId,
    customerName,
    customerPhone,
    customerEmail,
    purpose,
    pickupLocation,
    destination,
    startDate,
    endDate,
    passengerCount,
    notes,
    source: "Counter",
  });

  res.status(201).json(rental);
};

// GET /api/agency/rentals
exports.listRentals = async (req, res) => {
  const rentals = await Rental.find({ tenantId: req.user.tenantId })
    .populate("busId")
    .sort({ createdAt: -1 });
  res.json(rentals);
};

// PATCH /api/agency/rentals/:rentalId
// Handles status changes, quoting a price, assigning a bus, and internal
// notes all through one endpoint — the admin UI sends only what changed.
exports.updateRental = async (req, res) => {
  const { rentalId } = req.params;
  const { status, quotedPrice, busId, notes } = req.body;

  const update = {};
  if (status !== undefined) update.status = status;
  if (quotedPrice !== undefined) update.quotedPrice = quotedPrice;
  if (busId !== undefined) update.busId = busId || null;
  if (notes !== undefined) update.notes = notes;

  const rental = await Rental.findOneAndUpdate(
    { _id: rentalId, tenantId: req.user.tenantId },
    update,
    { new: true }
  ).populate("busId");

  if (!rental) return res.status(404).json({ message: "Rental request not found" });
  res.json(rental);
};

// DELETE /api/agency/rentals/:rentalId
exports.deleteRental = async (req, res) => {
  const { rentalId } = req.params;
  const result = await Rental.deleteOne({ _id: rentalId, tenantId: req.user.tenantId });
  if (result.deletedCount === 0) {
    return res.status(404).json({ message: "Rental request not found" });
  }
  res.json({ message: "Rental request deleted" });
};

// --- Public (no login) ----------------------------------------------------
// Not yet wired into a passenger-facing screen, but ready for one: a future
// "Request a bus" form (web or app) can call this directly. Kept separate
// from the counter-side creator above so a public submission is always
// tagged source: "Public" and never needs a JWT.
exports.publicCreateRentalRequest = async (req, res) => {
  const {
    tenantId,
    customerName,
    customerPhone,
    customerEmail,
    purpose,
    pickupLocation,
    destination,
    startDate,
    endDate,
    passengerCount,
  } = req.body;

  if (
    !tenantId ||
    !customerName ||
    !customerPhone ||
    !purpose ||
    !pickupLocation ||
    !destination ||
    !startDate ||
    !endDate
  ) {
    return res.status(400).json({ message: "Missing required rental request fields" });
  }

  const rental = await Rental.create({
    tenantId,
    customerName,
    customerPhone,
    customerEmail,
    purpose,
    pickupLocation,
    destination,
    startDate,
    endDate,
    passengerCount,
    source: "Public",
  });

  res.status(201).json({ message: "Request received — the company will contact you soon.", rentalId: rental._id });
};
