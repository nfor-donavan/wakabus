const cron = require("node-cron");
const Booking = require("../models/Booking");
const Schedule = require("../models/Schedule");

/**
 * Fix #1: seat-hold expiry.
 * Every minute, find Pending bookings whose hold has lapsed, mark them
 * Expired, and push the seat back into the schedule's availableSeats so it
 * can be sold to someone else. This is what keeps a wave of abandoned
 * Mobile Money attempts from permanently shrinking a bus's inventory.
 */
function startReservationExpiryJob() {
  cron.schedule("* * * * *", async () => {
    try {
      const now = new Date();
      const expired = await Booking.find({
        paymentStatus: "Pending",
        holdExpiresAt: { $lt: now },
      }).setOptions({ skipTenantScope: true });

      for (const booking of expired) {
        booking.paymentStatus = "Expired";
        await booking.save();

        await Schedule.findOneAndUpdate(
          { _id: booking.scheduleId },
          { $addToSet: { availableSeats: booking.seatNumber } }
        ).setOptions({ skipTenantScope: true });
      }

      if (expired.length) {
        console.log(`Released ${expired.length} expired seat hold(s).`);
      }
    } catch (err) {
      console.error("Reservation expiry job failed:", err.message);
    }
  });
}

module.exports = startReservationExpiryJob;
