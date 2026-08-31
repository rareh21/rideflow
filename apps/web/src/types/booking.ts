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
};