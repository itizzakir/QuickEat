/**
 * The single source of truth for order status in the UI.
 *
 * These values mirror the backend `EOrderStatus` enum exactly. Components used to invent their
 * own — READY_FOR_DELIVERY, ASSIGNED, ACCEPTED — none of which the server ever sends, so those
 * branches were dead and the badges fell through to a grey "unknown".
 */

export const ORDER_STATUS = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  PREPARING: "PREPARING",
  READY_FOR_PICKUP: "READY_FOR_PICKUP",
  PICKED_UP: "PICKED_UP",
  OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
};

/** Display order, matching the lifecycle the backend enforces. */
export const ORDER_STATUS_SEQUENCE = [
  ORDER_STATUS.PENDING,
  ORDER_STATUS.CONFIRMED,
  ORDER_STATUS.PREPARING,
  ORDER_STATUS.READY_FOR_PICKUP,
  ORDER_STATUS.PICKED_UP,
  ORDER_STATUS.OUT_FOR_DELIVERY,
  ORDER_STATUS.DELIVERED,
];

const META = {
  [ORDER_STATUS.PENDING]: { label: "Pending", classes: "bg-yellow-100 text-yellow-800" },
  [ORDER_STATUS.CONFIRMED]: { label: "Confirmed", classes: "bg-sky-100 text-sky-800" },
  [ORDER_STATUS.PREPARING]: { label: "Preparing", classes: "bg-blue-100 text-blue-800" },
  [ORDER_STATUS.READY_FOR_PICKUP]: { label: "Ready for pickup", classes: "bg-indigo-100 text-indigo-800" },
  [ORDER_STATUS.PICKED_UP]: { label: "Picked up", classes: "bg-purple-100 text-purple-800" },
  [ORDER_STATUS.OUT_FOR_DELIVERY]: { label: "Out for delivery", classes: "bg-violet-100 text-violet-800" },
  [ORDER_STATUS.DELIVERED]: { label: "Delivered", classes: "bg-green-100 text-green-800" },
  [ORDER_STATUS.CANCELLED]: { label: "Cancelled", classes: "bg-red-100 text-red-800" },
};

const UNKNOWN = { label: "Unknown", classes: "bg-gray-100 text-gray-800" };

export const getStatusLabel = (status) => (META[status] || UNKNOWN).label;

export const getStatusClasses = (status) => (META[status] || UNKNOWN).classes;

export const isTerminalStatus = (status) =>
  status === ORDER_STATUS.DELIVERED || status === ORDER_STATUS.CANCELLED;

/**
 * How far along the lifecycle a status is, for progress trackers.
 * Cancelled orders return -1 — they are off the happy path entirely.
 */
export const getStatusStep = (status) => {
  if (status === ORDER_STATUS.CANCELLED) return -1;
  return ORDER_STATUS_SEQUENCE.indexOf(status);
};

/** Coarse steps shown to the customer; several backend states collapse into one. */
export const CUSTOMER_TRACKER_STEPS = [
  { name: "Confirmed", reachedAt: ORDER_STATUS.CONFIRMED },
  { name: "Preparing", reachedAt: ORDER_STATUS.PREPARING },
  { name: "On the way", reachedAt: ORDER_STATUS.PICKED_UP },
  { name: "Delivered", reachedAt: ORDER_STATUS.DELIVERED },
];

/** Actions a restaurant may drive, keyed by the order's current status. */
export const RESTAURANT_NEXT_ACTIONS = {
  [ORDER_STATUS.PENDING]: [
    { label: "Accept", next: ORDER_STATUS.CONFIRMED },
    { label: "Cancel", next: ORDER_STATUS.CANCELLED, variant: "danger" },
  ],
  [ORDER_STATUS.CONFIRMED]: [
    { label: "Start preparing", next: ORDER_STATUS.PREPARING },
    { label: "Cancel", next: ORDER_STATUS.CANCELLED, variant: "danger" },
  ],
  [ORDER_STATUS.PREPARING]: [{ label: "Mark ready", next: ORDER_STATUS.READY_FOR_PICKUP }],
  [ORDER_STATUS.READY_FOR_PICKUP]: [],
};

/** Actions the assigned courier may drive. */
export const DELIVERY_NEXT_ACTIONS = {
  [ORDER_STATUS.READY_FOR_PICKUP]: [{ label: "Mark picked up", next: ORDER_STATUS.PICKED_UP }],
  [ORDER_STATUS.PICKED_UP]: [{ label: "Start delivery", next: ORDER_STATUS.OUT_FOR_DELIVERY }],
  [ORDER_STATUS.OUT_FOR_DELIVERY]: [{ label: "Mark delivered", next: ORDER_STATUS.DELIVERED }],
};
