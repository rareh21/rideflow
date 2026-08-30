import type { RideOption } from "@/types/ride";

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
};

export type Destination = LocationPoint & {
  id: string;
};

export type BookingState = {
  pickup: LocationPoint | null;
  destination: Destination | null;
  selectedRide: RideOption | null;
  step: BookingStep;
};