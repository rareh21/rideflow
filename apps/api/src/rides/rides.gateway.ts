import {
    Injectable,
} from "@nestjs/common";
import {
    OnGatewayConnection,
    WebSocketGateway,
    WebSocketServer,
} from "@nestjs/websockets";
import { JwtService } from "@nestjs/jwt";
import { Server, Socket } from "socket.io";

type AuthenticatedSocket = Socket & {
    data: {
        userId?: string;
        role?: string;
    };
};

export type RideRealtimePayload = {
    rideId: string;
    status: string;
    ride: unknown;
};

@WebSocketGateway({
    cors: {
        origin: "http://localhost:3000",
    },
})
@Injectable()
export class RidesGateway
    implements OnGatewayConnection {
    constructor(
        private readonly jwtService: JwtService,
    ) { }

    @WebSocketServer()
    server!: Server;

    async handleConnection(
        client: AuthenticatedSocket,
    ) {
        const token =
            client.handshake.auth?.token;

        if (
            typeof token !== "string" ||
            !token
        ) {
            client.disconnect(true);
            return;
        }

        try {
            const payload =
                await this.jwtService.verifyAsync(token);

            const userId = payload.sub;

            if (!userId) {
                client.disconnect(true);
                return;
            }

            client.data.userId = userId;
            client.data.role = payload.role;

            /*
             * Every authenticated user gets a private room.
             * The client does NOT choose this userId.
             * It comes from the verified JWT.
             */
            client.join(`user:${userId}`);

            if (payload.role === "DRIVER") {
                client.join("drivers");
                client.join("drivers:available");
            }
        } catch {
            client.disconnect(true);
        }
    }

    emitToUser(
        userId: string,
        event: string,
        payload: unknown,
    ) {
        this.server
            .to(`user:${userId}`)
            .emit(event, payload);
    }

    emitToUsers(
        userIds: string[],
        event: string,
        payload: unknown,
    ) {
        for (const userId of userIds) {
            this.emitToUser(
                userId,
                event,
                payload,
            );
        }
    }

    emitRideUpdated(
        riderUserId: string,
        driverUserId: string | null,
        payload: RideRealtimePayload,
    ) {
        const userIds = [
            riderUserId,
            driverUserId,
        ].filter(
            (id): id is string => Boolean(id),
        );

        this.emitToUsers(
            userIds,
            "ride.updated",
            payload,
        );

        /*
         * Drivers re-fetch their request list after this lightweight signal.
         * We never broadcast a rider's full ride payload to every driver.
         */
        this.server.to("drivers").emit(
            "ride.requests.changed",
            { rideId: payload.rideId },
        );
    }

    emitRideRequestCreated(ride: unknown) {
        const rideId = (ride as { id?: string })?.id;
        this.server.to("drivers").emit("ride.request.created", { ride });
        if (rideId) {
            this.server.to("drivers").emit("ride.requests.changed", { rideId });
        }
    }

    emitRideRequestRemoved(rideId: string) {
        this.server.to("drivers").emit("ride.request.removed", { rideId });
        this.server.to("drivers").emit("ride.requests.changed", { rideId });
    }

    emitDriverLocationUpdated(
        riderUserId: string,
        driverUserId: string,
        payload: {
            rideId: string;
            driverId: string;
            location: {
                latitude: number;
                longitude: number;
                heading: number | null;
                speedKmh: number | null;
                accuracyM: number | null;
                updatedAt: string;
            };
        },
    ) {
        const userIds = Array.from(
            new Set([riderUserId, driverUserId].filter(Boolean)),
        );
        this.emitToUsers(
            userIds,
            "driver.location.updated",
            payload,
        );
    }
}
