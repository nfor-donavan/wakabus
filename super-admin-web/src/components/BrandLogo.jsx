import React from "react";
import { BRAND } from "../branding.js";

// Full logo on a white tile so the charcoal wordmark stays legible in dark mode.
export default function BrandLogo({ width = 150 }) {
  return (
    <div className="brand-logo-tile">
      <img src={BRAND.logo} alt={BRAND.company} style={{ width }} />
    </div>
  );
}
