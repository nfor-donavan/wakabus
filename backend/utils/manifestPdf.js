const path = require("path");
const PDFDocument = require("pdfkit");

/**
 * Checkpoint manifest: one A4 document per bus run, listing every paid
 * passenger and every parcel (colis) loaded for that trip. Bilingual
 * (English / French) because it is shown at road checkpoints.
 *
 * Note: pdfkit's built-in fonts cover Latin accents (é, è, ç…) but not arrows,
 * so route direction is shown as From / To columns instead of "A → B".
 */
const COLORS = {
  navy: "#0B2E8A",
  ink: "#1F2937",
  muted: "#6B7280",
  line: "#D8DDE8",
  zebra: "#F3F5FA",
  white: "#FFFFFF",
};
const MARGIN = 40;
const FOOTER_RESERVE = 54; // space kept clear at the bottom of every page for the footer
const EMBLEM = path.join(__dirname, "..", "assets", "nexus-emblem.png");

// Short labels so the status always fits its column.
const PARCEL_STATUS = {
  Received_At_Origin: "Received",
  Loaded_On_Bus: "Loaded",
  Arrived_At_Destination: "Arrived",
  Collected: "Collected",
};

const fmtDateTime = (d) =>
  new Date(d).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

function buildManifestPdf({ schedule, tenant, passengers, packages = [] }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: MARGIN, size: "A4", bufferPages: true });
    const chunks = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const contentWidth = doc.page.width - MARGIN * 2;
    const route = schedule.routeId;
    const bus = schedule.busId;
    const reference = `MAN-${String(schedule._id).slice(-6).toUpperCase()}`;
    const bottomLimit = () => doc.page.height - FOOTER_RESERVE;

    // ---- Header band ------------------------------------------------------
    doc.rect(0, 0, doc.page.width, 92).fill(COLORS.navy);
    doc
      .fillColor(COLORS.white)
      .font("Helvetica-Bold")
      .fontSize(19)
      .text(tenant?.companyName || "Transport Company", MARGIN, 26, { width: contentWidth * 0.62 });
    doc
      .font("Helvetica")
      .fontSize(9.5)
      .fillColor("#C9D6FF")
      .text("PASSENGER & PARCEL MANIFEST  |  MANIFESTE PASSAGERS & COLIS", MARGIN, 54, {
        width: contentWidth * 0.7,
      });
    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor(COLORS.white)
      .text(reference, MARGIN, 26, { width: contentWidth, align: "right" });
    doc
      .font("Helvetica")
      .fontSize(8.5)
      .fillColor("#C9D6FF")
      .text(`Generated / Généré : ${fmtDateTime(new Date())}`, MARGIN, 42, {
        width: contentWidth,
        align: "right",
      });

    // ---- Trip summary grid -------------------------------------------------
    const confirmedSeats = passengers.length;
    const capacity = bus?.totalSeats ?? "-";
    const cells = [
      ["FROM / DE", route?.departureCity || "-"],
      ["TO / À", route?.destinationCity || "-"],
      ["DEPARTURE / DÉPART", fmtDateTime(schedule.departureTime)],
      ["BUS", bus ? `${bus.registrationNumber} (${bus.busClass})` : "-"],
      ["PASSENGERS / PASSAGERS", `${confirmedSeats} / ${capacity}`],
      ["PARCELS / COLIS", String(packages.length)],
    ];
    const colW = contentWidth / 3;
    const boxH = 44;
    const gridY = 110;
    cells.forEach(([label, value], i) => {
      const x = MARGIN + (i % 3) * colW;
      const cy = gridY + Math.floor(i / 3) * boxH;
      doc.rect(x, cy, colW, boxH).lineWidth(0.6).strokeColor(COLORS.line).stroke();
      doc.font("Helvetica").fontSize(7.5).fillColor(COLORS.muted).text(label, x + 9, cy + 8, { width: colW - 18 });
      doc
        .font("Helvetica-Bold")
        .fontSize(11)
        .fillColor(COLORS.ink)
        .text(value, x + 9, cy + 21, { width: colW - 18, height: 16, ellipsis: true, lineBreak: false });
    });
    let y = gridY + boxH * 2 + 22;

    // ---- Generic table drawer (repeats its header on every new page) ------
    function drawTable({ title, columns, rows, emptyText }) {
      const rowH = 21;
      const headerH = 22;

      const drawHeader = () => {
        doc.rect(MARGIN, y, contentWidth, headerH).fill(COLORS.navy);
        let x = MARGIN;
        columns.forEach((col) => {
          doc
            .font("Helvetica-Bold")
            .fontSize(8)
            .fillColor(COLORS.white)
            .text(col.label, x + 6, y + 7, { width: col.width - 10, lineBreak: false });
          x += col.width;
        });
        y += headerH;
      };

      if (y + 70 > bottomLimit()) {
        doc.addPage();
        y = MARGIN;
      }
      doc.font("Helvetica-Bold").fontSize(11).fillColor(COLORS.ink).text(title, MARGIN, y);
      y += 18;
      drawHeader();

      if (rows.length === 0) {
        doc.font("Helvetica-Oblique").fontSize(9).fillColor(COLORS.muted).text(emptyText, MARGIN + 6, y + 7);
        y += rowH;
      }

      rows.forEach((row, idx) => {
        if (y + rowH > bottomLimit()) {
          doc.addPage();
          y = MARGIN;
          drawHeader();
        }
        if (idx % 2 === 0) doc.rect(MARGIN, y, contentWidth, rowH).fill(COLORS.zebra);
        let x = MARGIN;
        columns.forEach((col, ci) => {
          doc
            .font(col.bold ? "Helvetica-Bold" : "Helvetica")
            .fontSize(8.5)
            .fillColor(COLORS.ink)
            .text(String(row[ci] ?? ""), x + 6, y + 6.5, {
              width: col.width - 10,
              height: rowH - 6,
              ellipsis: true,
              lineBreak: false,
            });
          x += col.width;
        });
        y += rowH;
      });
      doc.moveTo(MARGIN, y).lineTo(MARGIN + contentWidth, y).lineWidth(0.6).strokeColor(COLORS.line).stroke();
      y += 22;
    }

    // ---- Passengers -------------------------------------------------------
    drawTable({
      title: "Passengers / Passagers",
      columns: [
        { label: "No.", width: 28 },
        { label: "SEAT / SIÈGE", width: 62, bold: true },
        { label: "NAME / NOM", width: 126 },
        { label: "PHONE / TÉL.", width: 82 },
        { label: "ID CARD / CNI", width: 82 },
        { label: "TICKET / BILLET", width: 85 },
        { label: "BAGS", width: 50 },
      ],
      rows: passengers.map((p, i) => [
        i + 1,
        p.seatNumber,
        p.passengerName,
        p.passengerPhone,
        p.passengerIdCard,
        p.ticketCode,
        p.luggageCount ? String(p.luggageCount) : "-",
      ]),
      emptyText: "No confirmed passengers on this trip. / Aucun passager confirmé sur ce trajet.",
    });

    // ---- Parcels (only when the trip carries any) -------------------------
    if (packages.length > 0) {
      drawTable({
        title: "Parcels / Colis",
        columns: [
          { label: "TRACKING / SUIVI", width: 82, bold: true },
          { label: "SENDER / EXPÉD.", width: 96 },
          { label: "RECIPIENT / DEST.", width: 96 },
          { label: "CONTENT / CONTENU", width: 134 },
          { label: "KG", width: 36 },
          { label: "STATUS / ÉTAT", width: 71 },
        ],
        rows: packages.map((p) => [
          p.trackingCode,
          p.sender?.name,
          p.recipient?.name,
          p.packageDetails?.description,
          p.packageDetails?.weightKg ?? "-",
          PARCEL_STATUS[p.status] || String(p.status || "").replace(/_/g, " "),
        ]),
        emptyText: "",
      });
    }

    // ---- Signatures -------------------------------------------------------
    if (y + 80 > bottomLimit()) {
      doc.addPage();
      y = MARGIN;
    }
    const sigW = (contentWidth - 30) / 3;
    ["Agent / Agent", "Driver / Chauffeur", "Checkpoint / Poste de contrôle"].forEach((label, i) => {
      const x = MARGIN + i * (sigW + 15);
      doc.font("Helvetica-Bold").fontSize(8.5).fillColor(COLORS.ink).text(label, x, y, { width: sigW, lineBreak: false });
      doc.moveTo(x, y + 46).lineTo(x + sigW, y + 46).lineWidth(0.7).strokeColor(COLORS.ink).stroke();
      doc
        .font("Helvetica")
        .fontSize(7.5)
        .fillColor(COLORS.muted)
        .text("Name, signature, stamp / Nom, cachet", x, y + 50, { width: sigW, lineBreak: false });
    });

    // ---- Footer on every page (needs bufferPages) -------------------------
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      const fy = doc.page.height - 40;
      const prevBottom = doc.page.margins.bottom;
      doc.page.margins.bottom = 0; // allow writing inside the bottom margin without spawning a page

      doc.moveTo(MARGIN, fy - 8).lineTo(MARGIN + contentWidth, fy - 8).lineWidth(0.5).strokeColor(COLORS.line).stroke();
      try {
        doc.image(EMBLEM, MARGIN, fy - 2, { fit: [18, 18] });
      } catch (e) {
        /* the emblem is decorative — never fail a manifest over it */
      }
      doc
        .font("Helvetica")
        .fontSize(7.5)
        .fillColor(COLORS.muted)
        .text("Generated by WakaBus  |  Powered by Nexus Tech Labs  -  Driving Operational Transparency.", MARGIN + 24, fy, {
          width: contentWidth - 100,
          lineBreak: false,
        });
      doc.text(
        "Confidential: contains personal identification data. / Confidentiel : données d'identification personnelles.",
        MARGIN + 24,
        fy + 10,
        { width: contentWidth - 100, lineBreak: false }
      );
      doc
        .font("Helvetica-Bold")
        .fontSize(8)
        .fillColor(COLORS.ink)
        .text(`Page ${i - range.start + 1} / ${range.count}`, MARGIN, fy + 4, {
          width: contentWidth,
          align: "right",
          lineBreak: false,
        });

      doc.page.margins.bottom = prevBottom;
    }

    doc.end();
  });
}

module.exports = { buildManifestPdf };
