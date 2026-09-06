import { PrismaClient, UserRole } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
    await prisma.location.createMany({
        data: [
            {
                label: "Current Location · Hyderabad",
                latitude: 17.4483,
                longitude: 78.3915,
            },
            {
                label: "Madhapur",
                latitude: 17.4484,
                longitude: 78.3910,
            },
            {
                label: "Jubilee Hills",
                latitude: 17.4326,
                longitude: 78.4071,
            },
            {
                label: "Hitech City",
                latitude: 17.4435,
                longitude: 78.3772,
            },
        ],
    });

    const email =
        process.env.ADMIN_EMAIL ??
        "admin@rideflow.dev";

    const password =
        process.env.ADMIN_PASSWORD;

    if (!password) {
        throw new Error(
            "ADMIN_PASSWORD environment variable is required",
        );
    }

    const existingAdmin =
        await prisma.user.findUnique({
            where: {
                email,
            },
        });

    if (existingAdmin) {
        if (existingAdmin.role !== UserRole.ADMIN) {
            throw new Error(
                `User ${email} already exists but is not an ADMIN`,
            );
        }

        console.log(
            `Admin already exists: ${email}`,
        );

        return;
    }

    const passwordHash =
        await bcrypt.hash(password, 12);

    const admin = await prisma.user.create({
        data: {
            name: "RideFlow Admin",
            email,
            passwordHash,
            role: UserRole.ADMIN,
        },
    });

    console.log(
        `Admin created: ${admin.email}`,
    );
}

main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });