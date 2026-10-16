import React from "react";
import { BRAND } from "../branding.js";

/**
 * Branded loading state. Use fullscreen for app start-up / auth checks only;
 * pass fullscreen={false} for a contained block inside a page. Small API calls
 * should keep their existing inline indicators instead of using this.
 */
export default function BrandLoader({ text, fullscreen = true }) {
  return (
    <div
      className={`brand-loader${fullscreen ? " brand-loader--full" : ""}`}
      role="status"
      aria-live="polite"
    >
      <div className="brand-loader__logo">
        <img src={BRAND.logo} alt={BRAND.company} />
      </div>
      <div className="brand-loader__bar" aria-hidden="true">
        <span />
      </div>
      {text && <p className="brand-loader__text">{text}</p>}
    </div>
  );
}
