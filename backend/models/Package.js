const mongoose = require("mongoose");
const tenantScope = require("./plugins/tenantScope");
const { encrypt, decrypt } = require("../utils/crypto");

const PackageSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true },
    assignedScheduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Schedule",
      required: true, // Binds the package directly to a specific bus trip
    },
    trackingCode: { type: String, unique: true, required: true },

    sender: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
    },
    recipient: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
    },
    packageDetails: {
      description: { type: String, required: true },
      weightKg: Number,
      priceXAF: { type: Number, required: true },
    },

    status: {
      type: String,
      enum: ["Received_At_Origin", "Loaded_On_Bus", "Arrived_At_Destination", "Collected"],
      default: "Received_At_Origin",
    },

    // Stored encrypted (AES-256-GCM, same utility as national ID numbers) —
    // never plain text at rest. Unlike a password hash, this has to be
    // reversible: the whole point is to SEND the real code to the recipient
    // once the package arrives, which a one-way hash could never allow.
    securePickupOTPEncrypted: { type: String, required: true },
    pickupAttempts: { type: Number, default: 0 },
    pickupLocked: { type: Boolean, default: false }, // true after repeated failed OTP attempts

    statusLogs: [
      {
        updatedAt: { type: Date, default: Date.now },
        status: String,
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Agent" },
      },
    ],
  },
  { timestamps: true }
);

PackageSchema.methods.setPickupOTP = function (rawOtp) {
  this.securePickupOTPEncrypted = encrypt(rawOtp);
};

// Only for authorized use: sending the "arrived" SMS, and verifying a
// handover. Never returned in a normal API response.
PackageSchema.methods.getDecryptedOTP = function () {
  return decrypt(this.securePickupOTPEncrypted);
};

PackageSchema.plugin(tenantScope);

module.exports = mongoose.model("Package", PackageSchema);
