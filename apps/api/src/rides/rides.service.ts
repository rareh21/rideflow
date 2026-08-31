import {
    Injectable,
    NotFoundException,
} from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";
import { CreateRideDto } from "./dto/create-ride.dto";

@Injectable()
export class RidesService {
    constructor(
        private readonly prisma: PrismaService,
    ) { }

    async create(
        riderId: string,
        dto: CreateRideDto,
    ) {
        const rider = await this.prisma.user.findUnique({
            where: {
                id: riderId,
            },
            select: {
                id: true,
                role: true,
            },
        });

        if (!rider) {
            throw new NotFoundException("Rider not found");
        }

        const pickupLocation =
            await this.prisma.location.findUnique({
                where: {
                    id: dto.pickupLocationId,
                },
            });

        if (!pickupLocation) {
            throw new NotFoundException(
                "Pickup location not found",
            );
        }

        const destinationLocation =
            await this.prisma.location.findUnique({
                where: {
                    id: dto.destinationLocationId,
                },
            });

        if (!destinationLocation) {
            throw new NotFoundException(
                "Destination location not found",
            );
        }

        return this.prisma.ride.create({
            data: {
                riderId,

                pickupLocationId:
                    dto.pickupLocationId,

                destinationLocationId:
                    dto.destinationLocationId,

                rideType: dto.rideType,

                estimatedFare: dto.estimatedFare,

                estimatedDistanceKm:
                    dto.estimatedDistanceKm,

                estimatedDurationMinutes:
                    dto.estimatedDurationMinutes,

                paymentMethod: dto.paymentMethod,

                status: "REQUESTED",
            },

            include: {
                pickupLocation: true,
                destinationLocation: true,
            },
        });
    }
}