import React from "react";
import { BRAND } from "../branding.js";
import { useLanguage } from "../i18n.jsx";

// Understated dashboard footer. Sits at the bottom of the page content (not
// fixed/sticky), so it never covers tables, forms or modals.
export default function BrandFooter() {
  const { t } = useLanguage();
  return (
    <footer className="brand-footer">
      <img src={BRAND.emblem} alt="" aria-hidden="true" />
      <div>
        <strong>{t("brand.poweredBy")}</strong>
        <em>{BRAND.slogan}</em>
      </div>
    </footer>
  );
}
