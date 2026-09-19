const PDFDocument = require("pdfkit");

function buildManifestPdf({ schedule, passengers }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: "A4" });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(18).text("Passenger Manifest", { align: "center" });
    doc.moveDown(0.5);

    const route = schedule.routeId;
    const bus = schedule.busId;
    doc
      .fontSize(11)
      .text(`Route: ${route ? `${route.departureCity} -> ${route.destinationCity}` : "N/A"}`)
      .text(`Bus: ${bus ? `${bus.registrationNumber} (${bus.busClass})` : "N/A"}`)
      .text(`Departure: ${new Date(schedule.departureTime).toLocaleString()}`)
      .text(`Total passengers: ${passengers.length}`);

    doc.moveDown();

    // Table header
    const colX = { seat: 40, name: 90, phone: 260, id: 380 };
    doc.fontSize(10).font("Helvetica-Bold");
    doc.text("Seat", colX.seat, doc.y);
    doc.text("Passenger Name", colX.name, doc.y - 12);
    doc.text("Phone", colX.phone, doc.y - 12);
    doc.text("National ID Card", colX.id, doc.y - 12);
    doc.moveDown(0.5);
    doc.font("Helvetica");

    passengers.forEach((p) => {
      const y = doc.y;
      doc.text(String(p.seatNumber), colX.seat, y);
      doc.text(p.passengerName, colX.name, y);
      doc.text(p.passengerPhone, colX.phone, y);
      doc.text(p.passengerIdCard, colX.id, y);
      doc.moveDown(0.6);
    });

    doc.moveDown();
    doc
      .fontSize(8)
      .fillColor("gray")
      .text(
        "This manifest contains sensitive personal identification data. Handle per company data-protection policy and destroy after checkpoint use where required by law.",
        { width: 500 }
      );

    doc.end();
  });
}

module.exports = { buildManifestPdf };
