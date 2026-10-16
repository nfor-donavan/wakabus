// Single source of truth for Nexus Tech Labs branding in the passenger app.
// Metro needs static require() paths, so the assets are listed here once.
export const BRAND = {
  company: "Nexus Tech Labs",
  product: "WakaBus",
  slogan: "Driving Operational Transparency.", // official wording — intentionally not translated
  logo: require("../assets/nexus-logo.png"), // full lockup (emblem + wordmark)
  emblem: require("../assets/nexus-emblem.png"), // square emblem for compact spaces
  blue: "#003EC8",
  charcoal: "#384048",
};
