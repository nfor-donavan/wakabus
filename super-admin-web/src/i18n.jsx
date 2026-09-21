import React, { createContext, useContext, useEffect, useState } from "react";

const translations = {
  en: {
    "common.email": "Email",
    "common.password": "Password",
    "common.show": "Show",
    "common.hide": "Hide",
    "common.signIn": "Sign in",
    "common.signingIn": "Signing in…",
    "common.logout": "Log out",
    "common.darkMode": "Dark",
    "common.lightMode": "Light",
    "common.langToggle": "FR",
    "common.status": "Status",

    "login.title": "Welcome back",
    "login.subtitle": "Sign in to the platform control panel",
    "login.footer": "Super Admin Portal",
    "login.footerNote": "Platform owner access only.",
    "login.notSuperAdmin": "This account is not a Super Admin account.",
    "login.brandHeadline": "Oversee the entire network.",
    "login.brandBody":
      "Every transport company, every route, every franc of commission — one control panel for the whole WakaBus platform.",
    "login.feature1": "Onboard new transport companies in minutes",
    "login.feature2": "Track platform-wide revenue and commission",
    "login.feature3": "Suspend or reactivate any company instantly",

    "nav.tenants": "Transport Companies",
    "nav.revenue": "Revenue",

    "tenantsTab.onboardTitle": "Onboard a new transport company",
    "tenantsTab.companyName": "Company name (e.g. Finexs Voyage)",
    "tenantsTab.contactPhone": "Contact phone",
    "tenantsTab.adminName": "Agency admin full name",
    "tenantsTab.adminEmail": "Agency admin email",
    "tenantsTab.tempPassword": "Temporary password",
    "tenantsTab.createButton": "Create tenant",
    "tenantsTab.successMessage": "{company} onboarded — admin login sent to {email}.",
    "tenantsTab.listTitle": "Transport companies",
    "tenantsTab.company": "Company",
    "tenantsTab.contact": "Contact",
    "tenantsTab.commission": "Commission %",
    "tenantsTab.suspend": "Suspend",
    "tenantsTab.reactivate": "Reactivate",
    "tenantsTab.active": "Active",
    "tenantsTab.suspended": "Suspended",
    "tenantsTab.none": "No transport companies onboarded yet.",

    "revenueTab.totalBookings": "Total paid bookings",
    "revenueTab.grossRevenue": "Gross ticket revenue",
    "revenueTab.commissionEarned": "Platform commission earned",
    "revenueTab.byCompany": "Revenue by company",
    "revenueTab.explainer":
      "Gross revenue is the sum of fares on Paid bookings. Commission is calculated at each company's current commission rate — it's an estimate for past bookings if the rate has changed since they were made.",
    "revenueTab.company": "Company",
    "revenueTab.paidBookings": "Paid bookings",
    "revenueTab.grossRevenueCol": "Gross revenue",
    "revenueTab.commissionRate": "Commission rate",
    "revenueTab.commissionEarnedCol": "Commission earned",
    "revenueTab.none": "No paid bookings recorded yet.",
  },

  fr: {
    "common.email": "E-mail",
    "common.password": "Mot de passe",
    "common.show": "Afficher",
    "common.hide": "Masquer",
    "common.signIn": "Se connecter",
    "common.signingIn": "Connexion…",
    "common.logout": "Déconnexion",
    "common.darkMode": "Sombre",
    "common.lightMode": "Clair",
    "common.langToggle": "EN",
    "common.status": "Statut",

    "login.title": "Content de vous revoir",
    "login.subtitle": "Connectez-vous au panneau de contrôle de la plateforme",
    "login.footer": "Portail Super Admin",
    "login.footerNote": "Accès réservé au propriétaire de la plateforme.",
    "login.notSuperAdmin": "Ce compte n'est pas un compte Super Admin.",
    "login.brandHeadline": "Supervisez tout le réseau.",
    "login.brandBody":
      "Chaque compagnie de transport, chaque itinéraire, chaque franc de commission — un seul panneau de contrôle pour toute la plateforme WakaBus.",
    "login.feature1": "Inscrivez de nouvelles compagnies en quelques minutes",
    "login.feature2": "Suivez les revenus et commissions de toute la plateforme",
    "login.feature3": "Suspendez ou réactivez une compagnie instantanément",

    "nav.tenants": "Compagnies de transport",
    "nav.revenue": "Revenus",

    "tenantsTab.onboardTitle": "Inscrire une nouvelle compagnie de transport",
    "tenantsTab.companyName": "Nom de la compagnie (ex. Finexs Voyage)",
    "tenantsTab.contactPhone": "Téléphone de contact",
    "tenantsTab.adminName": "Nom complet de l'administrateur d'agence",
    "tenantsTab.adminEmail": "E-mail de l'administrateur d'agence",
    "tenantsTab.tempPassword": "Mot de passe temporaire",
    "tenantsTab.createButton": "Créer la compagnie",
    "tenantsTab.successMessage": "{company} inscrite — identifiants envoyés à {email}.",
    "tenantsTab.listTitle": "Compagnies de transport",
    "tenantsTab.company": "Compagnie",
    "tenantsTab.contact": "Contact",
    "tenantsTab.commission": "Commission %",
    "tenantsTab.suspend": "Suspendre",
    "tenantsTab.reactivate": "Réactiver",
    "tenantsTab.active": "Active",
    "tenantsTab.suspended": "Suspendue",
    "tenantsTab.none": "Aucune compagnie inscrite pour le moment.",

    "revenueTab.totalBookings": "Total des réservations payées",
    "revenueTab.grossRevenue": "Revenu brut des billets",
    "revenueTab.commissionEarned": "Commission gagnée par la plateforme",
    "revenueTab.byCompany": "Revenus par compagnie",
    "revenueTab.explainer":
      "Le revenu brut est la somme des tarifs des réservations payées. La commission est calculée au taux actuel de chaque compagnie — c'est une estimation pour les anciennes réservations si le taux a changé depuis.",
    "revenueTab.company": "Compagnie",
    "revenueTab.paidBookings": "Réservations payées",
    "revenueTab.grossRevenueCol": "Revenu brut",
    "revenueTab.commissionRate": "Taux de commission",
    "revenueTab.commissionEarnedCol": "Commission gagnée",
    "revenueTab.none": "Aucune réservation payée pour le moment.",
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
