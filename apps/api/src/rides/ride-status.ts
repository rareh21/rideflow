import { RideStatus } from "@prisma/client";

const transitions: Record<RideStatus, RideStatus[]> = {
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
    ],

    COMPLETED: [],

    CANCELLED: [],
};

export function canTransitionRideStatus(
    currentStatus: RideStatus,
    nextStatus: RideStatus,
): boolean {
    return transitions[currentStatus]?.includes(nextStatus) ?? false;
}