import { RideStatus } from "@prisma/client";

const allowedTransitions: Record<
    RideStatus,
    RideStatus[]
> = {
    REQUESTED: [
        RideStatus.SEARCHING_DRIVER,
        RideStatus.CANCELLED,
    ],

    SEARCHING_DRIVER: [
        RideStatus.DRIVER_ASSIGNED,
        RideStatus.CANCELLED,
    ],

    DRIVER_ASSIGNED: [
        RideStatus.DRIVER_ARRIVING,
        RideStatus.CANCELLED,
    ],

    DRIVER_ARRIVING: [
        RideStatus.IN_PROGRESS,
        RideStatus.CANCELLED,
    ],

    IN_PROGRESS: [
        RideStatus.COMPLETED,
        RideStatus.CANCELLED,
    ],

    COMPLETED: [],

    CANCELLED: [],
};

export function canTransitionRideStatus(
    current: RideStatus,
    next: RideStatus,
) {
    return allowedTransitions[current].includes(next);
}