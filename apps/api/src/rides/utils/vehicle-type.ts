import { RideType } from "@prisma/client";

/**
 * Determines the RideType category (GO, PLUS, XL) for a driver's vehicle
 * based on its make and model.
 */
export function determineVehicleType(make?: string | null, model?: string | null): RideType {
    if (!make && !model) return RideType.GO;

    const combined = `${make ?? ""} ${model ?? ""}`.toUpperCase();

    if (
        combined.includes("XL") ||
        combined.includes("SUV") ||
        combined.includes("INNOVA") ||
        combined.includes("ERTIGA") ||
        combined.includes("FORTUNER") ||
        combined.includes("CARENS") ||
        combined.includes("SAFARI") ||
        combined.includes("XUV") ||
        combined.includes("VAN") ||
        combined.includes("MARAZZO") ||
        combined.includes("TRIBER")
    ) {
        return RideType.XL;
    }

    if (
        combined.includes("PLUS") ||
        combined.includes("COMFORT") ||
        combined.includes("SEDAN") ||
        combined.includes("CITY") ||
        combined.includes("VERNA") ||
        combined.includes("CIAZ") ||
        combined.includes("CRETA") ||
        combined.includes("SELTOS") ||
        combined.includes("HECTOR") ||
        combined.includes("HARRIER") ||
        combined.includes("CIVIC") ||
        combined.includes("CAMRY") ||
        combined.includes("OCTAVIA")
    ) {
        return RideType.PLUS;
    }

    return RideType.GO;
}
