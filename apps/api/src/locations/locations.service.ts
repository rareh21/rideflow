import {
    Injectable,
    BadRequestException,
    Logger,
} from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";
import { GooglePlacesProvider } from "./google-places.provider";
import type { PlacePrediction } from "./google-places.provider";
import { ResolveLocationDto } from "./dto/resolve-location.dto";
import { ReverseGeocodeDto } from "./dto/reverse-geocode.dto";
import { haversineDistanceKm } from "../rides/utils/location-calculator";

@Injectable()
export class LocationsService {
    private readonly logger = new Logger(LocationsService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly places: GooglePlacesProvider,
    ) {}

    /**
     * Returns autocomplete predictions for a partial search query.
     * Searches Google Places API first. If Google fails or returns no results,
     * falls back to searching pre-existing Location records in the database.
     */
    async autocomplete(query: string): Promise<PlacePrediction[]> {
        const trimmed = query.trim();

        if (trimmed.length < 2) {
            return [];
        }

        let predictions: PlacePrediction[] = [];

        try {
            predictions = await this.places.autocomplete(trimmed);
        } catch (err) {
            this.logger.warn(
                `Google Places API autocomplete error: ${err instanceof Error ? err.message : String(err)}. Falling back to database search.`,
            );
        }

        if (predictions.length > 0) {
            return predictions;
        }

        // Fallback: search existing Location table in database
        const dbMatches = await this.prisma.location.findMany({
            where: {
                label: {
                    contains: trimmed,
                    mode: "insensitive",
                },
            },
            take: 5,
        });

        return dbMatches.map((loc) => ({
            placeId: `db:${loc.id}`,
            label: loc.label,
            description: loc.label,
        }));
    }

    /**
     * Geocodes a Google Place ID (or resolves a DB location ID) and returns
     * an existing or newly created Location record.
     */
    async resolveLocation(dto: ResolveLocationDto) {
        if (!dto.placeId || dto.placeId.trim() === "") {
            throw new BadRequestException("A valid place ID is required.");
        }

        // Handle DB-fallback place IDs
        if (dto.placeId.startsWith("db:")) {
            const locId = dto.placeId.replace("db:", "");
            const existingLoc = await this.prisma.location.findUnique({
                where: { id: locId },
            });
            if (existingLoc) return existingLoc;
        }

        const labelNormalized = dto.label.trim();

        const existing = await this.prisma.location.findFirst({
            where: {
                label: {
                    equals: labelNormalized,
                    mode: "insensitive",
                },
            },
        });

        if (existing) {
            this.logger.debug(
                `Resolved location '${labelNormalized}' from cache (id: ${existing.id})`,
            );
            return existing;
        }

        // Geocode place via Google Places Details
        const geometry = await this.places.getPlaceGeometry(dto.placeId);

        const location = await this.prisma.location.create({
            data: {
                label: labelNormalized,
                latitude: geometry.latitude,
                longitude: geometry.longitude,
            },
        });

        this.logger.debug(
            `Created new location '${labelNormalized}' (id: ${location.id})`,
        );

        return location;
    }

    /**
     * Auto-detect location: receives current latitude and longitude from client browser,
     * reverse-geocodes to get a human-readable label, and stores/returns a Location record.
     * Always returns a clean location name (e.g. "Madhapur, Hyderabad" or "Current location · Hyderabad").
     */
    async reverseGeocode(dto: ReverseGeocodeDto) {
        let addressLabel = await this.places.reverseGeocode(
            dto.latitude,
            dto.longitude,
        );

        // Fallback: If Google reverse geocoding returns null or coordinate string,
        // find nearest DB location or use "Current location · Hyderabad".
        if (!addressLabel || addressLabel.includes("(")) {
            const allLocations = await this.prisma.location.findMany({ take: 20 });

            let closestLocationName: string | null = null;
            let minDistance = 10; // km threshold

            for (const loc of allLocations) {
                const dist = haversineDistanceKm(
                    dto.latitude,
                    dto.longitude,
                    Number(loc.latitude),
                    Number(loc.longitude),
                );
                if (dist < minDistance) {
                    minDistance = dist;
                    closestLocationName = loc.label;
                }
            }

            if (closestLocationName && !closestLocationName.includes("(")) {
                addressLabel = closestLocationName;
            } else {
                addressLabel = "Current location · Hyderabad";
            }
        }

        const existing = await this.prisma.location.findFirst({
            where: {
                label: {
                    equals: addressLabel,
                    mode: "insensitive",
                },
            },
        });

        if (existing) {
            return existing;
        }

        return this.prisma.location.create({
            data: {
                label: addressLabel,
                latitude: dto.latitude,
                longitude: dto.longitude,
            },
        });
    }
}
