/**
 * One place that decides how money is rendered.
 *
 * The app previously mixed ₹ (cart, orders, restaurant/delivery dashboards) with $ (admin
 * overview) while the backend has only ever dealt in rupees.
 */

const INR = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const INR_WHOLE = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** "₹1,340.00" — for anything a customer pays or a partner earns. */
export const formatCurrency = (value) => INR.format(Number(value) || 0);

/** "₹1,340" — for dashboard tiles where the paise are noise. */
export const formatCurrencyCompact = (value) => INR_WHOLE.format(Number(value) || 0);

/** "1,234" — plain counts, grouped the Indian way to match the currency. */
export const formatCount = (value) => new Intl.NumberFormat("en-IN").format(Number(value) || 0);

/**
 * Restaurants store their delivery fee as display text ("FREE", "₹29"). Render it as-is when
 * it is already a label, otherwise format the number. Mirrors the backend's parseDeliveryFee.
 */
export const formatDeliveryFee = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "number") return value === 0 ? "FREE" : formatCurrency(value);
  const digits = String(value).replace(/[^0-9.]/g, "");
  if (!digits) return String(value).toUpperCase();
  return Number(digits) === 0 ? "FREE" : formatCurrency(Number(digits));
};
