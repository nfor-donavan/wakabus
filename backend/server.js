require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const startReservationExpiryJob = require("./jobs/reservationExpiry");

const authRoutes = require("./routes/authRoutes");
const superAdminRoutes = require("./routes/superAdminRoutes");
const agencyRoutes = require("./routes/agencyRoutes");
const passengerRoutes = require("./routes/passengerRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/superadmin", superAdminRoutes);
app.use("/api/agency", agencyRoutes);
app.use("/api/passenger", passengerRoutes);
app.use("/api/payments", paymentRoutes);

// Central error handler — catches tenantScope plugin violations and anything
// else that bubbles up, so an isolation bug fails loudly as a 500 in dev
// rather than silently leaking data.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Server error", error: err.message });
});

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  startReservationExpiryJob();
  app.listen(PORT, () => console.log(`Bus platform API running on port ${PORT}`));
});
