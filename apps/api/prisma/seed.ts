import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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
}

main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });