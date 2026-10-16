import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "wakabus_lang";

// Only the app's own wording is translated. Data that comes from the server
// (company names, city names, passenger names, server error messages) is shown
// exactly as stored.
const translations = {
  en: {
    "brand.poweredBy": "Powered by Nexus Tech Labs",
    "brand.initializing": "Initializing WakaBus…",
    "common.missingInfo": "Missing info",
    "common.langToggle": "FR",

    "nav.search": "WakaBus",
    "nav.results": "Available trips",
    "nav.seat": "Choose your seat",
    "nav.booking": "Passenger details",
    "nav.ticket": "Your ticket",
    "nav.myTickets": "My tickets",
    "nav.staffLogin": "Staff login",
    "nav.scanner": "Package scanner",

    "search.title": "Book your inter-city trip",
    "search.subtitle": "Compare every company running your route",
    "search.from": "From",
    "search.to": "To",
    "search.fromPlaceholder": "Departure city",
    "search.toPlaceholder": "Destination city",
    "search.date": "Date (optional)",
    "search.datePlaceholder": "YYYY-MM-DD",
    "search.swap": "⇅ Swap",
    "search.button": "Search buses",
    "search.searching": "Searching…",
    "search.myTickets": "My tickets (offline)",
    "search.staffLink": "Staff login",
    "search.missingCities": "Enter both a departure and destination city.",
    "search.checkDate": "Check the date",
    "search.badDate": "Enter the date as YYYY-MM-DD (e.g. 2026-09-25), or leave it blank to see every upcoming trip.",
    "search.failed": "Search failed",

    "results.unknownCompany": "Unknown company",
    "results.seatsLeft": "{n} seats left",
    "results.empty": "No trips found for this route yet. Try another date.",

    "seat.taken": "Taken",
    "seat.available": "Available",
    "seat.selected": "Selected",
    "seat.driver": "1 · Driver",
    "seat.door": "Door",
    "seat.besideDriver": "Beside driver",
    "seat.continueWith": "Continue with seat {n}",
    "seat.select": "Select a seat",

    "booking.seatCompany": "Seat {n} · {company}",
    "booking.fullName": "Full name",
    "booking.idCard": "National ID card number",
    "booking.phone": "Phone (Mobile Money number)",
    "booking.fillAll": "Fill in your name, ID card number, and phone.",
    "booking.reserveAndPay": "Reserve seat & pay",
    "booking.checkPayment": "I've completed payment — check status",
    "booking.seatHeld": "Seat held",
    "booking.seatHeldBody": "Complete the Mobile Money prompt on your phone. Your seat is held for a limited time.",
    "booking.reserveFailed": "Reservation failed",
    "booking.stillPending": "Still pending",
    "booking.stillPendingBody": "Payment hasn't been confirmed yet — try again in a moment.",
    "booking.notCompleted": "Payment not completed",
    "booking.notCompletedBody": "Status: {status}. Please try booking again.",
    "booking.statusFailed": "Couldn't check status",

    "ticket.issuing": "Issuing your ticket…",
    "ticket.seat": "Seat",
    "ticket.passenger": "Passenger",
    "ticket.fare": "Fare",
    "ticket.offlineNote": "Saved on this device — this screen works even with no signal at the terminal.",
    "ticket.bookAnother": "Book another trip",

    "myTickets.seat": "Seat {n}",
    "myTickets.empty":
      "No saved tickets yet. Once you book and pay for a trip, it appears here — and stays available even offline.",

    "staff.title": "Staff login",
    "staff.subtitle": "For counter agents and agency admins only",
    "staff.email": "Email",
    "staff.password": "Password",
    "staff.signIn": "Sign in",
    "staff.enterCreds": "Enter your email and password.",
    "staff.loginFailed": "Login failed",

    "scan.notFound": "Not found",
    "scan.scanAgain": "Scan again",
    "scan.updated": "Updated",
    "scan.updatedBody": "{code} is now \"{status}\".",
    "scan.updateFailed": "Update failed",
    "scan.enterCode": "Enter the code",
    "scan.enterCodeBody": "Ask the recipient for the pickup code they were texted.",
    "scan.handedOver": "Handed over",
    "scan.handedOverBody": "{code} marked as collected.",
    "scan.scanNext": "Scan next",
    "scan.verifyFailed": "Verification failed",
    "scan.cameraNeeded": "Camera access is needed to scan package labels.",
    "scan.grant": "Grant permission",
    "scan.hint": "Point the camera at a package's tracking code",
    "scan.from": "From {name} ({phone})",
    "scan.to": "To {name} ({phone})",
    "scan.markLoaded": "Mark loaded on bus",
    "scan.markArrived": "Mark arrived at destination",
    "scan.updating": "Updating…",
    "scan.pickupPlaceholder": "Pickup code from recipient",
    "scan.verifying": "Verifying…",
    "scan.verifyButton": "Verify & hand over",
    "scan.alreadyCollected": "Already collected — nothing more to do.",
    "scan.scanNextPackage": "Scan next package",
    "scan.logout": "Log out of staff mode",
    "scan.status.Received_At_Origin": "Received at origin",
    "scan.status.Loaded_On_Bus": "Loaded on bus",
    "scan.status.Arrived_At_Destination": "Arrived at destination",
    "scan.status.Collected": "Collected",
  },

  fr: {
    "brand.poweredBy": "Propulsé par Nexus Tech Labs",
    "brand.initializing": "Initialisation de WakaBus…",
    "common.missingInfo": "Informations manquantes",
    "common.langToggle": "EN",

    "nav.search": "WakaBus",
    "nav.results": "Trajets disponibles",
    "nav.seat": "Choisissez votre siège",
    "nav.booking": "Informations du passager",
    "nav.ticket": "Votre billet",
    "nav.myTickets": "Mes billets",
    "nav.staffLogin": "Connexion du personnel",
    "nav.scanner": "Scanner de colis",

    "search.title": "Réservez votre voyage interurbain",
    "search.subtitle": "Comparez toutes les compagnies sur votre trajet",
    "search.from": "De",
    "search.to": "À",
    "search.fromPlaceholder": "Ville de départ",
    "search.toPlaceholder": "Ville de destination",
    "search.date": "Date (optionnel)",
    "search.datePlaceholder": "AAAA-MM-JJ",
    "search.swap": "⇅ Inverser",
    "search.button": "Rechercher des bus",
    "search.searching": "Recherche…",
    "search.myTickets": "Mes billets (hors ligne)",
    "search.staffLink": "Connexion du personnel",
    "search.missingCities": "Saisissez une ville de départ et une ville de destination.",
    "search.checkDate": "Vérifiez la date",
    "search.badDate":
      "Saisissez la date au format AAAA-MM-JJ (ex. 2026-09-25), ou laissez vide pour voir tous les trajets à venir.",
    "search.failed": "Échec de la recherche",

    "results.unknownCompany": "Compagnie inconnue",
    "results.seatsLeft": "{n} sièges restants",
    "results.empty": "Aucun trajet trouvé pour cet itinéraire. Essayez une autre date.",

    "seat.taken": "Occupé",
    "seat.available": "Disponible",
    "seat.selected": "Sélectionné",
    "seat.driver": "1 · Chauffeur",
    "seat.door": "Porte",
    "seat.besideDriver": "À côté du chauffeur",
    "seat.continueWith": "Continuer avec le siège {n}",
    "seat.select": "Choisissez un siège",

    "booking.seatCompany": "Siège {n} · {company}",
    "booking.fullName": "Nom complet",
    "booking.idCard": "Numéro de carte nationale d'identité",
    "booking.phone": "Téléphone (numéro Mobile Money)",
    "booking.fillAll": "Renseignez votre nom, votre numéro de CNI et votre téléphone.",
    "booking.reserveAndPay": "Réserver le siège et payer",
    "booking.checkPayment": "J'ai payé — vérifier le statut",
    "booking.seatHeld": "Siège réservé",
    "booking.seatHeldBody":
      "Validez la demande Mobile Money sur votre téléphone. Votre siège est bloqué pour une durée limitée.",
    "booking.reserveFailed": "Échec de la réservation",
    "booking.stillPending": "Toujours en attente",
    "booking.stillPendingBody": "Le paiement n'est pas encore confirmé — réessayez dans un instant.",
    "booking.notCompleted": "Paiement non abouti",
    "booking.notCompletedBody": "Statut : {status}. Veuillez réessayer la réservation.",
    "booking.statusFailed": "Impossible de vérifier le statut",

    "ticket.issuing": "Émission de votre billet…",
    "ticket.seat": "Siège",
    "ticket.passenger": "Passager",
    "ticket.fare": "Tarif",
    "ticket.offlineNote":
      "Enregistré sur cet appareil — cet écran fonctionne même sans réseau au terminal.",
    "ticket.bookAnother": "Réserver un autre trajet",

    "myTickets.seat": "Siège {n}",
    "myTickets.empty":
      "Aucun billet enregistré. Une fois votre trajet réservé et payé, il apparaît ici — et reste disponible hors ligne.",

    "staff.title": "Connexion du personnel",
    "staff.subtitle": "Réservé aux agents de guichet et aux administrateurs d'agence",
    "staff.email": "E-mail",
    "staff.password": "Mot de passe",
    "staff.signIn": "Se connecter",
    "staff.enterCreds": "Saisissez votre e-mail et votre mot de passe.",
    "staff.loginFailed": "Échec de la connexion",

    "scan.notFound": "Introuvable",
    "scan.scanAgain": "Scanner à nouveau",
    "scan.updated": "Mis à jour",
    "scan.updatedBody": "{code} est maintenant « {status} ».",
    "scan.updateFailed": "Échec de la mise à jour",
    "scan.enterCode": "Saisissez le code",
    "scan.enterCodeBody": "Demandez au destinataire le code de retrait reçu par SMS.",
    "scan.handedOver": "Colis remis",
    "scan.handedOverBody": "{code} marqué comme récupéré.",
    "scan.scanNext": "Scanner le suivant",
    "scan.verifyFailed": "Échec de la vérification",
    "scan.cameraNeeded": "L'accès à la caméra est nécessaire pour scanner les étiquettes des colis.",
    "scan.grant": "Autoriser",
    "scan.hint": "Pointez la caméra vers le code de suivi d'un colis",
    "scan.from": "De {name} ({phone})",
    "scan.to": "Pour {name} ({phone})",
    "scan.markLoaded": "Marquer chargé dans le bus",
    "scan.markArrived": "Marquer arrivé à destination",
    "scan.updating": "Mise à jour…",
    "scan.pickupPlaceholder": "Code de retrait du destinataire",
    "scan.verifying": "Vérification…",
    "scan.verifyButton": "Vérifier et remettre",
    "scan.alreadyCollected": "Déjà récupéré — rien d'autre à faire.",
    "scan.scanNextPackage": "Scanner le colis suivant",
    "scan.logout": "Quitter le mode personnel",
    "scan.status.Received_At_Origin": "Reçu à l'origine",
    "scan.status.Loaded_On_Bus": "Chargé dans le bus",
    "scan.status.Arrived_At_Destination": "Arrivé à destination",
    "scan.status.Collected": "Récupéré",
  },
};

function detectDeviceLang() {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale || "";
    return locale.toLowerCase().startsWith("fr") ? "fr" : "en";
  } catch (e) {
    return "en";
  }
}

const LanguageContext = createContext({
  lang: "en",
  locale: "en-GB",
  ready: false,
  t: (k) => k,
  toggleLang: () => {},
});

export function LanguageProvider({ children }) {
  // Starts from the phone's language, then a manual choice overrides it and is remembered.
  const [lang, setLang] = useState(detectDeviceLang);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (saved === "en" || saved === "fr") setLang(saved);
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  function t(key, vars) {
    let str = translations[lang][key] || translations.en[key] || key;
    if (vars) {
      Object.keys(vars).forEach((k) => {
        str = str.split(`{${k}}`).join(String(vars[k]));
      });
    }
    return str;
  }

  function toggleLang() {
    setLang((current) => {
      const next = current === "en" ? "fr" : "en";
      AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
      return next;
    });
  }

  const locale = lang === "fr" ? "fr-FR" : "en-GB";

  return (
    <LanguageContext.Provider value={{ lang, locale, ready, t, toggleLang }}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
