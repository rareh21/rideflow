export type RideCategory = "GO" | "PLUS" | "XL";

export type RideOption = {
    id: string;
    category: RideCategory;
    name: string;
    description: string;
    etaMinutes: number;
    fare: number;
    seats: number;
};

export type SelectedRide = RideOption | null;

export const RIDE_OPTIONS: RideOption[] = [
  {
    id: "go",
    category: "GO",
    name: "RideFlow Go",
    description: "Everyday rides at a comfortable price",
    etaMinutes: 4,
    fare: 180,
    seats: 4,
  },
  {
    id: "plus",
    category: "PLUS",
    name: "RideFlow Plus",
    description: "Extra comfort for your everyday trips",
    etaMinutes: 6,
    fare: 260,
    seats: 4,
  },
  {
    id: "xl",
    category: "XL",
    name: "RideFlow XL",
    description: "More space for groups and luggage",
    etaMinutes: 7,
    fare: 340,
    seats: 6,
  },
];