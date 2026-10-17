const Booking = require("../models/Booking");

// GET /api/agency/reports/sales?from=<ISO>&to=<ISO>&agentId=<id>
// Counter sales for end-of-day reconciliation. The browser sends the start and end of
// the day in the user's own time zone (Cameroon is UTC+1), so "today" means today there.
// A cashier (counter_agent) only ever sees their own sales; an admin can view everyone
// or filter by cashier.
exports.salesReport = async (req, res) => {
  const start = new Date(req.query.from);
  const end = new Date(req.query.to);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
    return res.status(400).json({ message: "from and to must be valid dates" });
  }

  const filter = {
    tenantId: req.user.tenantId,
    bookingSource: "Counter",
    createdAt: { $gte: start, $lte: end },
    paymentStatus: { $in: ["Paid", "Cancelled", "Refunded"] },
  };
  const agentFilter = req.user.role === "counter_agent" ? req.user.id : req.query.agentId;
  if (agentFilter) filter.soldBy = agentFilter;

  const bookings = await Booking.find(filter)
    .sort({ createdAt: -1 })
    .limit(2000)
    .populate({ path: "scheduleId", populate: { path: "routeId" } });

  const totals = { count: 0, amount: 0, cash: 0, mobileMoney: 0, voidedCount: 0, voidedAmount: 0 };
  const byAgentMap = new Map();

  const sales = bookings.map((b) => {
    const method = b.paymentReference === "CASH" ? "Cash" : "Mobile_Money";
    const isPaid = b.paymentStatus === "Paid";
    const key = b.soldBy ? String(b.soldBy) : "unknown";

    if (!byAgentMap.has(key)) {
      byAgentMap.set(key, {
        agentId: key === "unknown" ? null : key,
        name: b.soldByName || null,
        count: 0,
        amount: 0,
        cash: 0,
        mobileMoney: 0,
      });
    }
    const agentRow = byAgentMap.get(key);

    if (isPaid) {
      totals.count += 1;
      totals.amount += b.farePaid;
      agentRow.count += 1;
      agentRow.amount += b.farePaid;
      if (method === "Cash") {
        totals.cash += b.farePaid;
        agentRow.cash += b.farePaid;
      } else {
        totals.mobileMoney += b.farePaid;
        agentRow.mobileMoney += b.farePaid;
      }
    } else {
      totals.voidedCount += 1;
      totals.voidedAmount += b.farePaid;
    }

    const route = b.scheduleId?.routeId;
    return {
      _id: b._id,
      createdAt: b.createdAt,
      ticketCode: b.ticketCode,
      seatNumber: b.seatNumber,
      passengerName: b.passengerName,
      farePaid: b.farePaid,
      paymentStatus: b.paymentStatus,
      method,
      soldByName: b.soldByName || null,
      trip: route ? `${route.departureCity} - ${route.destinationCity}` : "",
      departureTime: b.scheduleId?.departureTime || null,
    };
  });

  res.json({ totals, byAgent: [...byAgentMap.values()], sales });
};
