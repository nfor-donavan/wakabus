const path = require("path");
const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");

const COLORS = { navy: "#0B2E8A", ink: "#1F2937", muted: "#6B7280", line: "#D8DDE8", white: "#FFFFFF" };
const EMBLEM = path.join(__dirname, "..", "assets", "nexus-emblem.png");

const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
const fmtTime = (d) => new Date(d).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

/**
 * One boarding ticket on an A6 page — small enough for a counter printer or to
 * be shown on a phone. The QR code carries the same HMAC-signed payload the
 * passenger app uses, so counter tickets validate exactly like app tickets.
 * The passenger's national ID number is deliberately never printed here.
 */
async function buildTicketPdf({ booking, schedule, tenant }) {
  const qrBuffer = await QRCode.toBuffer(booking.signedQrPayload, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 280,
  });

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A6", margin: 0 });
    const chunks = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const W = doc.page.width;
    const pad = 22;
    const route = schedule.routeId;
    const bus = schedule.busId;

    // Header
    doc.rect(0, 0, W, 64).fill(COLORS.navy);
    doc
      .fillColor(COLORS.white)
      .font("Helvetica-Bold")
      .fontSize(14)
      .text(tenant?.companyName || "Transport Company", pad, 16, { width: W - pad * 2, lineBreak: false });
    doc
      .font("Helvetica")
      .fontSize(8.5)
      .fillColor("#C9D6FF")
      .text("BOARDING TICKET  |  BILLET D'EMBARQUEMENT", pad, 38, { width: W - pad * 2, lineBreak: false });

    // From / To
    let y = 82;
    const half = (W - pad * 2) / 2;
    [
      ["FROM / DE", route?.departureCity || "-"],
      ["TO / À", route?.destinationCity || "-"],
    ].forEach(([label, value], i) => {
      const x = pad + i * half;
      doc.font("Helvetica").fontSize(7.5).fillColor(COLORS.muted).text(label, x, y, { width: half - 8 });
      doc.font("Helvetica-Bold").fontSize(15).fillColor(COLORS.ink).text(value, x, y + 11, { width: half - 8, height: 20, ellipsis: true, lineBreak: false });
    });

    // Date / time / seat
    y += 46;
    doc.moveTo(pad, y - 8).lineTo(W - pad, y - 8).lineWidth(0.6).strokeColor(COLORS.line).stroke();
    const third = (W - pad * 2) / 3;
    [
      ["DATE", fmtDate(schedule.departureTime)],
      ["TIME / HEURE", fmtTime(schedule.departureTime)],
      ["SEAT / SIÈGE", String(booking.seatNumber)],
    ].forEach(([label, value], i) => {
      const x = pad + i * third;
      doc.font("Helvetica").fontSize(7.5).fillColor(COLORS.muted).text(label, x, y, { width: third - 6 });
      doc
        .font("Helvetica-Bold")
        .fontSize(i === 2 ? 20 : 10.5)
        .fillColor(i === 2 ? COLORS.navy : COLORS.ink)
        .text(value, x, y + 11, { width: third - 6, lineBreak: false });
    });

    // Passenger
    y += 46;
    doc.font("Helvetica").fontSize(7.5).fillColor(COLORS.muted).text("PASSENGER / PASSAGER", pad, y);
    doc.font("Helvetica-Bold").fontSize(12).fillColor(COLORS.ink).text(booking.passengerName, pad, y + 11, { width: W - pad * 2, height: 16, ellipsis: true, lineBreak: false });
    doc
      .font("Helvetica")
      .fontSize(8.5)
      .fillColor(COLORS.muted)
      .text(`Bus ${bus?.registrationNumber || "-"} (${bus?.busClass || "-"})   |   Fare / Tarif: ${(booking.farePaid || 0).toLocaleString("en-US")} XAF`, pad, y + 29, {
        width: W - pad * 2,
        lineBreak: false,
      });

    // QR + code
    y += 54;
    doc.image(qrBuffer, (W - 118) / 2, y, { fit: [118, 118] });
    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor(COLORS.ink)
      .text(booking.ticketCode, 0, y + 124, { width: W, align: "center", characterSpacing: 1.2 });
    doc
      .font("Helvetica")
      .fontSize(7.5)
      .fillColor(COLORS.muted)
      .text("Present this ticket at boarding. / Présentez ce billet à l'embarquement.", pad, y + 142, {
        width: W - pad * 2,
        align: "center",
      });

    // Footer
    const fy = doc.page.height - 30;
    doc.moveTo(pad, fy - 6).lineTo(W - pad, fy - 6).lineWidth(0.5).strokeColor(COLORS.line).stroke();
    try {
      doc.image(EMBLEM, pad, fy - 2, { fit: [16, 16] });
    } catch (e) {
      /* decorative only */
    }
    doc
      .font("Helvetica")
      .fontSize(7)
      .fillColor(COLORS.muted)
      .text("Issued by WakaBus  |  Powered by Nexus Tech Labs", pad + 22, fy + 3, { width: W - pad * 2 - 22, lineBreak: false });

    doc.end();
  });
}

module.exports = { buildTicketPdf };
