// Centralized order status definitions
export const ORDER_STATUSES = {
  PENDING: 'pending',          // Initial state when order is created
  PROCESSING: 'processing',    // Order is being processed
  COMPLETED: 'completed',      // Order fulfillment complete / ready
  CANCELLED: 'cancelled',      // Order was cancelled
};

// Ordered list for validation / progression logic
export const ORDER_STATUS_LIST = [
  ORDER_STATUSES.PENDING,
  ORDER_STATUSES.PROCESSING,
  ORDER_STATUSES.COMPLETED,
  ORDER_STATUSES.CANCELLED
];

export function normalizeStatus(status) {
  if (!status) return ORDER_STATUSES.PENDING;
  const lower = String(status).toLowerCase();
  return ORDER_STATUS_LIST.includes(lower) ? lower : ORDER_STATUSES.PENDING;
}

export function getNextStatuses(current) {
  const idx = ORDER_STATUS_LIST.indexOf(normalizeStatus(current));
  if (idx === -1) return [ORDER_STATUSES.SUBMITTED];
  // Allow cancellation at any point
  const next = ORDER_STATUS_LIST.slice(idx + 1);
  if (!next.includes(ORDER_STATUSES.CANCELLED)) next.push(ORDER_STATUSES.CANCELLED);
  return next;
}
