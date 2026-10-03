const crypto = require("crypto");
const Package = require("../models/Package");
const Schedule = require("../models/Schedule");
const Tenant = require("../models/Tenant");
const { generateTrackingCode } = require("../utils/trackingCode");
const { sendMockSms } = require("../utils/mockSms");

// Packages move through these statuses strictly in order via PUT /status.
// "Collected" is deliberately NOT reachable that way — it only happens
// through verify-pickup, which is the one path that checks the OTP. Letting
// a plain status update skip straight to Collected would bypass the entire
// point of having a pickup code.
const STATUS_ORDER = ["Received_At_Origin", "Loaded_On_Bus", "Arrived_At_Destination", "Collected"];

// POST /api/agency/packages
exports.createPackage = async (req, res) => {
  const { assignedScheduleId, sender, recipient, packageDetails } = req.body;

  if (
    !assignedScheduleId ||
    !sender?.name ||
    !sender?.phone ||
    !recipient?.name ||
    !recipient?.phone ||
    !packageDetails?.description ||
    !packageDetails?.priceXAF
  ) {
    return res.status(400).json({ message: "Missing required package fields" });
  }

  const schedule = await Schedule.findOne({ _id: assignedScheduleId, tenantId: req.user.tenantId });
  if (!schedule) return res.status(404).json({ message: "Schedule not found for this tenant" });

  const tenant = await Tenant.findById(req.user.tenantId);
  const trackingCode = await generateTrackingCode(Package, req.user.tenantId, tenant?.companyName);
  const rawOtp = crypto.randomInt(0, 10000).toString().padStart(4, "0");

  const pkg = new Package({
    tenantId: req.user.tenantId,
    assignedScheduleId,
    trackingCode,
    sender,
    recipient,
    packageDetails,
    statusLogs: [{ status: "Received_At_Origin", updatedBy: req.user.id }],
  });
  pkg.setPickupOTP(rawOtp);
  await pkg.save();

  // Deliberately not returning the OTP here — it's only ever revealed via
  // the "arrived" SMS, which is the whole point of gating pickup on it.
  res.status(201).json(pkg);
};

// GET /api/agency/packages
exports.listPackages = async (req, res) => {
  const packages = await Package.find({ tenantId: req.user.tenantId })
    .populate("assignedScheduleId")
    .sort({ createdAt: -1 });
  res.json(packages);
};

// GET /api/agency/schedules/:scheduleId/packages
// Powers the manifest split-view: passengers (listBookingsForSchedule)
// alongside parcels for that same trip.
exports.listPackagesForSchedule = async (req, res) => {
  const { scheduleId } = req.params;
  const packages = await Package.find({
    tenantId: req.user.tenantId,
    assignedScheduleId: scheduleId,
  }).sort({ createdAt: -1 });
  res.json(packages);
};

// GET /api/agency/packages/:trackingCode
// Used by the scanner flow to show package details right after a scan,
// before the dispatcher picks the next action.
exports.getPackageByTrackingCode = async (req, res) => {
  const { trackingCode } = req.params;
  const pkg = await Package.findOne({ tenantId: req.user.tenantId, trackingCode }).populate(
    "assignedScheduleId"
  );
  if (!pkg) return res.status(404).json({ message: "Package not found" });
  res.json(pkg);
};

// PUT /api/agency/packages/:packageId/status
exports.updatePackageStatus = async (req, res) => {
  const { packageId } = req.params;
  const { status } = req.body;

  if (status === "Collected") {
    return res.status(400).json({
      message: "Use POST /verify-pickup to mark a package Collected — it requires the pickup OTP.",
    });
  }
  if (!STATUS_ORDER.includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  const pkg = await Package.findOne({ _id: packageId, tenantId: req.user.tenantId });
  if (!pkg) return res.status(404).json({ message: "Package not found" });

  const currentIndex = STATUS_ORDER.indexOf(pkg.status);
  const nextIndex = STATUS_ORDER.indexOf(status);
  if (nextIndex !== currentIndex + 1) {
    return res.status(400).json({
      message: `Invalid transition: ${pkg.status} -> ${status}. Packages move through statuses in order, one step at a time.`,
    });
  }

  pkg.status = status;
  pkg.statusLogs.push({ status, updatedBy: req.user.id });
  await pkg.save();

  if (status === "Loaded_On_Bus") {
    sendMockSms(
      pkg.recipient.phone,
      `Your package (${pkg.trackingCode}) is now in transit. We'll text you again when it arrives.`
    );
  }

  if (status === "Arrived_At_Destination") {
    const otp = pkg.getDecryptedOTP();
    sendMockSms(
      pkg.recipient.phone,
      `Your package (${pkg.trackingCode}) has arrived. Pickup code: ${otp}. Bring this code and an ID to the counter.`
    );
  }

  res.json(pkg);
};

// POST /api/agency/packages/verify-pickup
// Body: { trackingCode, otp }
exports.verifyPickup = async (req, res) => {
  const { trackingCode, otp } = req.body;
  if (!trackingCode || !otp) {
    return res.status(400).json({ message: "trackingCode and otp are required" });
  }

  const pkg = await Package.findOne({ tenantId: req.user.tenantId, trackingCode });
  if (!pkg) return res.status(404).json({ message: "Package not found" });

  if (pkg.status === "Collected") {
    return res.status(400).json({ message: "This package was already collected" });
  }
  if (pkg.status !== "Arrived_At_Destination") {
    return res.status(400).json({ message: `Cannot collect yet — current status is ${pkg.status}` });
  }
  if (pkg.pickupLocked) {
    return res.status(403).json({
      message: "Too many failed attempts on this package. An agency admin needs to unlock it first.",
    });
  }

  const actualOtp = pkg.getDecryptedOTP();
  if (String(otp).trim() !== actualOtp) {
    pkg.pickupAttempts += 1;
    if (pkg.pickupAttempts >= 5) pkg.pickupLocked = true;
    await pkg.save();
    return res.status(400).json({
      message: pkg.pickupLocked
        ? "Incorrect code. This package is now locked after too many attempts — an agency admin must unlock it."
        : "Incorrect pickup code",
      attemptsRemaining: Math.max(0, 5 - pkg.pickupAttempts),
    });
  }

  pkg.status = "Collected";
  pkg.pickupAttempts = 0;
  pkg.statusLogs.push({ status: "Collected", updatedBy: req.user.id });
  await pkg.save();

  res.json({ message: "Package handed over successfully", trackingCode: pkg.trackingCode });
};

// PATCH /api/agency/packages/:packageId/unlock — agency_admin only (wired in routes)
exports.unlockPickup = async (req, res) => {
  const { packageId } = req.params;
  const pkg = await Package.findOneAndUpdate(
    { _id: packageId, tenantId: req.user.tenantId },
    { pickupLocked: false, pickupAttempts: 0 },
    { new: true }
  );
  if (!pkg) return res.status(404).json({ message: "Package not found" });
  res.json(pkg);
};
