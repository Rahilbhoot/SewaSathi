import { apiFetch } from "./api";

export type Booking = {
  _id: string;
  serviceRequired?: string;
  service?: string;
  serviceType?: string;
  status?: string;
  address?: string;
  ward?: string;
  scheduledAt?: string;
  createdAt?: string;
  updatedAt?: string;
  amount?: number;
  notes?: string;
  assignedByAI?: boolean;
  orderId?: string;
  paymentId?: string;
  customerName?: string;
  workerName?: string;
  customer?: { _id?: string; name?: string; phone?: string; address?: string };
  worker?: { _id?: string; name?: string; phone?: string; skills?: string[]; rating?: number };
};

export type Worker = {
  _id: string;
  name: string;
  phone?: string;
  skills?: string[];
  skill?: string;
  ward?: string;
  verified?: boolean;
  isVerified?: boolean;
  weeklyBookings?: number;
  rating?: number;
};

export function listBookings() {
  return apiFetch<Booking[]>("/bookings");
}

export function createBooking(body: Record<string, unknown>) {
  return apiFetch<Booking>("/bookings", { method: "POST", body: JSON.stringify(body) });
}

export function completeBooking(id: string) {
  return apiFetch<Booking>(`/bookings/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status: "completed" }),
  });
}

export function bookingService(b: Booking) {
  return b.serviceRequired ?? b.service ?? b.serviceType ?? "Service";
}

export function bookingCustomer(b: Booking) {
  return b.customerName ?? b.customer?.name ?? "—";
}

export function bookingWorker(b: Booking) {
  return b.workerName ?? b.worker?.name ?? "Unassigned";
}

export function bookingAddress(b: Booking) {
  return b.customer?.address ?? b.address ?? b.ward ?? "—";
}
