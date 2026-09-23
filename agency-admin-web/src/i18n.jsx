import React, { createContext, useContext, useEffect, useState } from "react";

// A small, dependency-free i18n layer. Every visible piece of UI chrome
// (nav labels, buttons, headings, table headers) is looked up by key here.
// Actual data the user typed in (bus names, passenger names, cities) is
// never translated — only the app's own wording is.
const translations = {
  en: {
    "common.email": "Email",
    "common.password": "Password",
    "common.show": "Show",
    "common.hide": "Hide",
    "common.signIn": "Sign in",
    "common.signingIn": "Signing in…",
    "common.cancel": "Cancel",
    "common.delete": "Delete",
    "common.logout": "Log out",
    "common.darkMode": "Dark",
    "common.lightMode": "Light",
    "common.langToggle": "FR",
    "common.status": "Status",

    "login.title": "Welcome back",
    "login.subtitle": "Sign in to your agency account",
    "login.needAccess": "Need access? Ask your Super Admin to onboard your company.",
    "login.brandHeadline": "Run your fleet from one dashboard.",
    "login.brandBody":
      "Schedules, seats, manifests and bookings — everything your counter staff need, built for the road.",
    "login.feature1": "Manage buses, routes and live schedules",
    "login.feature2": "Track every booking and print checkpoint manifests",
    "login.feature3": "Built for Cameroon's inter-city routes",
    "login.footer": "Agency Admin Portal",
    "login.notAgencyAccount": "This account is not an agency staff account.",

    "nav.schedules": "Schedules",
    "nav.bookings": "Bookings",
    "nav.fleet": "Fleet",
    "nav.routes": "Routes",
    "nav.rentals": "Rentals",

    "schedulesTab.createTitle": "Create a schedule",
    "schedulesTab.selectBus": "Select bus",
    "schedulesTab.selectRoute": "Select route",
    "schedulesTab.createButton": "Create schedule",
    "schedulesTab.upcoming": "Upcoming schedules",
    "schedulesTab.route": "Route",
    "schedulesTab.bus": "Bus",
    "schedulesTab.departure": "Departure",
    "schedulesTab.seatsLeft": "Seats left",
    "schedulesTab.manifest": "Manifest",
    "schedulesTab.downloadPdf": "Download PDF",
    "schedulesTab.none": "No schedules yet.",
    "schedulesTab.deleteConfirm": "Delete {route} on {date}? This can't be undone.",
    "schedulesTab.deleteButton": "Delete",
    "schedulesTab.blockedSeats": "Blocked",
    "schedulesTab.blockSeatsButton": "Block seats",
    "schedulesTab.blockSeatsPrompt": "Seat numbers already sold elsewhere, comma-separated (e.g. 3, 7, 12):",
    "schedulesTab.unblockAll": "Unblock all",

    "routesTab.addTitle": "Add a route",
    "routesTab.departurePlaceholder": "Departure city (e.g. Yaoundé)",
    "routesTab.destinationPlaceholder": "Destination city (e.g. Douala)",
    "routesTab.pricePlaceholder": "Base price (XAF)",
    "routesTab.addButton": "Add route",
    "routesTab.listTitle": "Routes",
    "routesTab.from": "From",
    "routesTab.to": "To",
    "routesTab.basePrice": "Base price",
    "routesTab.none": "No routes yet.",

    "busesTab.registerTitle": "Register a bus",
    "busesTab.regNumberPlaceholder": "Registration number (e.g. LT 123-OA)",
    "busesTab.seatsPlaceholder": "Total seats",
    "busesTab.layoutPlaceholder": "Seating layout (e.g. 3+2 = left+right of aisle)",
    "busesTab.addButton": "Add bus",
    "busesTab.fleetTitle": "Fleet",
    "busesTab.registration": "Registration",
    "busesTab.class": "Class",
    "busesTab.seats": "Seats",
    "busesTab.layout": "Layout",
    "busesTab.active": "Active",
    "busesTab.inactive": "Inactive",
    "busesTab.none": "No buses registered yet.",

    "bookingsTab.title": "Bookings by schedule",
    "bookingsTab.selectSchedule": "Select a schedule…",
    "bookingsTab.seat": "Seat",
    "bookingsTab.passenger": "Passenger",
    "bookingsTab.phone": "Phone",
    "bookingsTab.ticketCode": "Ticket code",
    "bookingsTab.fare": "Fare",
    "bookingsTab.source": "Source",
    "bookingsTab.none": "No bookings for this schedule yet.",
    "bookingsTab.refundPrompt":
      "If this booking was already Paid, enter a refund reference (leave blank if unpaid):",
    "bookingsTab.luggage": "Luggage",
    "bookingsTab.addLuggage": "Add luggage",
    "bookingsTab.luggageDescPrompt": "Describe the item (e.g. 1 blue suitcase):",
    "bookingsTab.luggageFeePrompt": "Fee for this item in XAF (leave blank for none):",
    "bookingsTab.luggageTagIssued": "Tag issued: {tag}\nWrite this on the physical tag and give the passenger their stub.",
    "bookingsTab.claimTitle": "Claim luggage",
    "bookingsTab.claimSubtitle": "Enter the tag code from a bag or a passenger's stub to mark it collected.",
    "bookingsTab.tagCodePlaceholder": "Tag code (e.g. LG-A1B2C3)",
    "bookingsTab.claimButton": "Mark claimed",
    "bookingsTab.claimSuccess": "Claimed: {desc} — {passenger}, seat {seat}",

    "rentalsTab.title": "Bus rental requests",
    "rentalsTab.subtitle": "For school excursions, events, and other whole-bus hires.",
    "rentalsTab.logTitle": "Log a rental request",
    "rentalsTab.customerName": "Customer name",
    "rentalsTab.customerPhone": "Customer phone",
    "rentalsTab.purpose": "Purpose (e.g. School excursion to Kribi)",
    "rentalsTab.pickup": "Pickup location",
    "rentalsTab.destination": "Destination",
    "rentalsTab.startDate": "Start date",
    "rentalsTab.endDate": "End date",
    "rentalsTab.passengerCount": "Passengers (approx.)",
    "rentalsTab.notes": "Internal notes (optional)",
    "rentalsTab.submitButton": "Log request",
    "rentalsTab.listTitle": "Requests",
    "rentalsTab.customer": "Customer",
    "rentalsTab.dates": "Dates",
    "rentalsTab.quotedPrice": "Quoted price",
    "rentalsTab.setPrice": "Set price",
    "rentalsTab.none": "No rental requests yet.",
    "rentalsTab.statusPending": "Pending",
    "rentalsTab.statusQuoted": "Quoted",
    "rentalsTab.statusApproved": "Approved",
    "rentalsTab.statusRejected": "Rejected",
    "rentalsTab.statusCompleted": "Completed",
    "rentalsTab.statusCancelled": "Cancelled",
  },

  fr: {
    "common.email": "E-mail",
    "common.password": "Mot de passe",
    "common.show": "Afficher",
    "common.hide": "Masquer",
    "common.signIn": "Se connecter",
    "common.signingIn": "Connexion…",
    "common.cancel": "Annuler",
    "common.delete": "Supprimer",
    "common.logout": "Déconnexion",
    "common.darkMode": "Sombre",
    "common.lightMode": "Clair",
    "common.langToggle": "EN",
    "common.status": "Statut",

    "login.title": "Content de vous revoir",
    "login.subtitle": "Connectez-vous à votre compte d'agence",
    "login.needAccess": "Besoin d'accès ? Demandez à votre Super Admin d'inscrire votre société.",
    "login.brandHeadline": "Gérez votre flotte depuis un seul tableau de bord.",
    "login.brandBody":
      "Horaires, sièges, manifestes et réservations — tout ce dont votre personnel de guichet a besoin, pensé pour la route.",
    "login.feature1": "Gérez bus, itinéraires et horaires en temps réel",
    "login.feature2": "Suivez chaque réservation et imprimez les manifestes",
    "login.feature3": "Conçu pour les lignes interurbaines du Cameroun",
    "login.footer": "Portail Admin Agence",
    "login.notAgencyAccount": "Ce compte n'est pas un compte du personnel d'agence.",

    "nav.schedules": "Horaires",
    "nav.bookings": "Réservations",
    "nav.fleet": "Flotte",
    "nav.routes": "Itinéraires",
    "nav.rentals": "Locations",

    "schedulesTab.createTitle": "Créer un horaire",
    "schedulesTab.selectBus": "Choisir un bus",
    "schedulesTab.selectRoute": "Choisir un itinéraire",
    "schedulesTab.createButton": "Créer l'horaire",
    "schedulesTab.upcoming": "Horaires à venir",
    "schedulesTab.route": "Itinéraire",
    "schedulesTab.bus": "Bus",
    "schedulesTab.departure": "Départ",
    "schedulesTab.seatsLeft": "Sièges restants",
    "schedulesTab.manifest": "Manifeste",
    "schedulesTab.downloadPdf": "Télécharger le PDF",
    "schedulesTab.none": "Aucun horaire pour le moment.",
    "schedulesTab.deleteConfirm": "Supprimer {route} le {date} ? Action irréversible.",
    "schedulesTab.deleteButton": "Supprimer",
    "schedulesTab.blockedSeats": "Bloqués",
    "schedulesTab.blockSeatsButton": "Bloquer des sièges",
    "schedulesTab.blockSeatsPrompt": "Numéros de sièges déjà vendus ailleurs, séparés par des virgules (ex. 3, 7, 12) :",
    "schedulesTab.unblockAll": "Tout débloquer",

    "routesTab.addTitle": "Ajouter un itinéraire",
    "routesTab.departurePlaceholder": "Ville de départ (ex. Yaoundé)",
    "routesTab.destinationPlaceholder": "Ville de destination (ex. Douala)",
    "routesTab.pricePlaceholder": "Prix de base (XAF)",
    "routesTab.addButton": "Ajouter l'itinéraire",
    "routesTab.listTitle": "Itinéraires",
    "routesTab.from": "De",
    "routesTab.to": "À",
    "routesTab.basePrice": "Prix de base",
    "routesTab.none": "Aucun itinéraire pour le moment.",

    "busesTab.registerTitle": "Enregistrer un bus",
    "busesTab.regNumberPlaceholder": "Numéro d'immatriculation (ex. LT 123-OA)",
    "busesTab.seatsPlaceholder": "Nombre total de sièges",
    "busesTab.layoutPlaceholder": "Disposition des sièges (ex. 3+2 = gauche+droite de l'allée)",
    "busesTab.addButton": "Ajouter le bus",
    "busesTab.fleetTitle": "Flotte",
    "busesTab.registration": "Immatriculation",
    "busesTab.class": "Classe",
    "busesTab.seats": "Sièges",
    "busesTab.layout": "Disposition",
    "busesTab.active": "Actif",
    "busesTab.inactive": "Inactif",
    "busesTab.none": "Aucun bus enregistré pour le moment.",

    "bookingsTab.title": "Réservations par horaire",
    "bookingsTab.selectSchedule": "Choisir un horaire…",
    "bookingsTab.seat": "Siège",
    "bookingsTab.passenger": "Passager",
    "bookingsTab.phone": "Téléphone",
    "bookingsTab.ticketCode": "Code billet",
    "bookingsTab.fare": "Tarif",
    "bookingsTab.source": "Source",
    "bookingsTab.none": "Aucune réservation pour cet horaire.",
    "bookingsTab.refundPrompt":
      "Si cette réservation était déjà payée, indiquez une référence de remboursement (laissez vide sinon) :",
    "bookingsTab.luggage": "Bagages",
    "bookingsTab.addLuggage": "Ajouter un bagage",
    "bookingsTab.luggageDescPrompt": "Décrivez l'article (ex. 1 valise bleue) :",
    "bookingsTab.luggageFeePrompt": "Frais pour cet article en XAF (laissez vide si aucun) :",
    "bookingsTab.luggageTagIssued": "Étiquette émise : {tag}\nInscrivez ce code sur l'étiquette physique et remettez le talon au passager.",
    "bookingsTab.claimTitle": "Réclamer un bagage",
    "bookingsTab.claimSubtitle": "Entrez le code de l'étiquette d'un bagage ou du talon d'un passager pour le marquer récupéré.",
    "bookingsTab.tagCodePlaceholder": "Code de l'étiquette (ex. LG-A1B2C3)",
    "bookingsTab.claimButton": "Marquer récupéré",
    "bookingsTab.claimSuccess": "Récupéré : {desc} — {passenger}, siège {seat}",

    "rentalsTab.title": "Demandes de location de bus",
    "rentalsTab.subtitle": "Pour les excursions scolaires, événements et autres locations de bus complet.",
    "rentalsTab.logTitle": "Enregistrer une demande",
    "rentalsTab.customerName": "Nom du client",
    "rentalsTab.customerPhone": "Téléphone du client",
    "rentalsTab.purpose": "Motif (ex. Excursion scolaire à Kribi)",
    "rentalsTab.pickup": "Lieu de prise en charge",
    "rentalsTab.destination": "Destination",
    "rentalsTab.startDate": "Date de début",
    "rentalsTab.endDate": "Date de fin",
    "rentalsTab.passengerCount": "Passagers (approx.)",
    "rentalsTab.notes": "Notes internes (optionnel)",
    "rentalsTab.submitButton": "Enregistrer la demande",
    "rentalsTab.listTitle": "Demandes",
    "rentalsTab.customer": "Client",
    "rentalsTab.dates": "Dates",
    "rentalsTab.quotedPrice": "Prix proposé",
    "rentalsTab.setPrice": "Définir le prix",
    "rentalsTab.none": "Aucune demande de location pour le moment.",
    "rentalsTab.statusPending": "En attente",
    "rentalsTab.statusQuoted": "Devis envoyé",
    "rentalsTab.statusApproved": "Approuvée",
    "rentalsTab.statusRejected": "Refusée",
    "rentalsTab.statusCompleted": "Terminée",
    "rentalsTab.statusCancelled": "Annulée",
  },
};

const LanguageContext = createContext({ lang: "en", t: (k) => k, toggleLang: () => {} });

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem("wakabus_lang") || "en");

  useEffect(() => {
    localStorage.setItem("wakabus_lang", lang);
  }, [lang]);

  function t(key, vars) {
    let str = translations[lang][key] || translations.en[key] || key;
    if (vars) {
      Object.keys(vars).forEach((k) => {
        str = str.replace(`{${k}}`, vars[k]);
      });
    }
    return str;
  }

  function toggleLang() {
    setLang((l) => (l === "en" ? "fr" : "en"));
  }

  return (
    <LanguageContext.Provider value={{ lang, t, toggleLang }}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
