import type { RideOption } from "@/types/ride";
import type { PaymentMethod, RideQuote } from "@/lib/rides";

export type BookingStep =
  | "destination"
  | "route"
  | "ride-options"
  | "payment"
  | "confirm";

export type LocationPoint = {
  label: string;
  latitude?: number;
  longitude?: number;
  locationId?: string;
};

export type Destination = {
  id: string;
  label: string;
  latitude?: number;
  longitude?: number;
  locationId?: string;
};

export type BookingState = {
  pickup: LocationPoint | null;
  destination: Destination | null;
  selectedRide: RideOption | null;
  step: BookingStep;
  /** Payment method chosen by the rider during the booking flow. */
  paymentMethod: PaymentMethod | null;
  /**
   * Server-returned quote for the current pickup/destination/rideType.
   * Always null until a quote is successfully fetched.
   * React must NEVER calculate fare/distance/duration independently.
   */
  quote: RideQuote | null;
};