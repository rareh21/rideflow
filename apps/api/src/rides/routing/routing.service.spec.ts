import { Test, TestingModule } from "@nestjs/testing";
import {
    InternalServerErrorException,
    BadGatewayException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { GoogleRoutesProvider } from "./google-routes.provider";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MOCK_API_KEY = "test-google-api-key";

/** Build a minimal Response-like object that fetch would return. */
function makeResponse(
    body: unknown,
    status = 200,
): Response {
    return {
        ok: status >= 200 && status < 300,
        status,
        json: () => Promise.resolve(body),
    } as unknown as Response;
}

function buildConfigStub(apiKey: string | undefined) {
    return {
        get: jest.fn((key: string) =>
            key === "GOOGLE_MAPS_API_KEY" ? apiKey : undefined,
        ),
    };
}

async function buildProvider(
    apiKey: string | undefined = MOCK_API_KEY,
): Promise<GoogleRoutesProvider> {
    const module: TestingModule = await Test.createTestingModule({
        providers: [
            GoogleRoutesProvider,
            { provide: ConfigService, useValue: buildConfigStub(apiKey) },
        ],
    }).compile();

    return module.get<GoogleRoutesProvider>(GoogleRoutesProvider);
}

const ORIGIN = { latitude: 17.47, longitude: 78.35 };
const DEST = { latitude: 17.4512, longitude: 78.3858 };

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("GoogleRoutesProvider", () => {
    let fetchSpy: jest.SpyInstance;

    beforeEach(() => {
        fetchSpy = jest.spyOn(global, "fetch");
    });

    afterEach(() => {
        fetchSpy.mockRestore();
    });

    // ---- Missing API key ---------------------------------------------------

    it("throws InternalServerErrorException when GOOGLE_MAPS_API_KEY is missing", async () => {
        const provider = await buildProvider(undefined);

        await expect(
            provider.getRoute(ORIGIN, DEST),
        ).rejects.toThrow(InternalServerErrorException);

        expect(fetchSpy).not.toHaveBeenCalled();
    });

    // ---- Successful response -----------------------------------------------

    it("returns correct distanceKm from distanceMeters", async () => {
        const provider = await buildProvider();

        fetchSpy.mockResolvedValue(
            makeResponse({
                routes: [
                    {
                        distanceMeters: 14800,
                        duration: "1920s",
                        polyline: { encodedPolyline: "abc123" },
                    },
                ],
            }),
        );

        const result = await provider.getRoute(ORIGIN, DEST);

        // 14800 / 1000 = 14.8
        expect(result.distanceKm).toBe(14.8);
    });

    it("converts duration seconds to minutes using Math.ceil", async () => {
        const provider = await buildProvider();

        fetchSpy.mockResolvedValue(
            makeResponse({
                routes: [
                    {
                        distanceMeters: 5000,
                        // 1921 / 60 = 32.016... → ceil = 33
                        duration: "1921s",
                        polyline: { encodedPolyline: "xyz" },
                    },
                ],
            }),
        );

        const result = await provider.getRoute(ORIGIN, DEST);

        expect(result.durationMinutes).toBe(33);
    });

    it("returns at least 1 minute for very short durations", async () => {
        const provider = await buildProvider();

        fetchSpy.mockResolvedValue(
            makeResponse({
                routes: [
                    {
                        distanceMeters: 100,
                        duration: "30s",   // 30/60 = 0.5 → ceil = 1 → max(1,1) = 1
                        polyline: { encodedPolyline: "short" },
                    },
                ],
            }),
        );

        const result = await provider.getRoute(ORIGIN, DEST);

        expect(result.durationMinutes).toBeGreaterThanOrEqual(1);
    });

    it("extracts encodedPolyline from the response", async () => {
        const provider = await buildProvider();

        fetchSpy.mockResolvedValue(
            makeResponse({
                routes: [
                    {
                        distanceMeters: 8000,
                        duration: "600s",
                        polyline: { encodedPolyline: "encoded_poly_string" },
                    },
                ],
            }),
        );

        const result = await provider.getRoute(ORIGIN, DEST);

        expect(result.encodedPolyline).toBe("encoded_poly_string");
    });

    it("returns undefined encodedPolyline when absent in response", async () => {
        const provider = await buildProvider();

        fetchSpy.mockResolvedValue(
            makeResponse({
                routes: [
                    {
                        distanceMeters: 8000,
                        duration: "600s",
                        // no polyline field
                    },
                ],
            }),
        );

        const result = await provider.getRoute(ORIGIN, DEST);

        expect(result.encodedPolyline).toBeUndefined();
    });

    // ---- Provider failures -------------------------------------------------

    it("throws BadGatewayException on HTTP 4xx from Google", async () => {
        const provider = await buildProvider();

        fetchSpy.mockResolvedValue(makeResponse({ error: "bad request" }, 400));

        await expect(
            provider.getRoute(ORIGIN, DEST),
        ).rejects.toThrow(BadGatewayException);
    });

    it("throws BadGatewayException on HTTP 5xx from Google", async () => {
        const provider = await buildProvider();

        fetchSpy.mockResolvedValue(makeResponse({ error: "server error" }, 503));

        await expect(
            provider.getRoute(ORIGIN, DEST),
        ).rejects.toThrow(BadGatewayException);
    });

    it("throws BadGatewayException when routes array is empty (no route found)", async () => {
        const provider = await buildProvider();

        fetchSpy.mockResolvedValue(makeResponse({ routes: [] }));

        await expect(
            provider.getRoute(ORIGIN, DEST),
        ).rejects.toThrow(BadGatewayException);
    });

    it("throws BadGatewayException when routes key is absent", async () => {
        const provider = await buildProvider();

        fetchSpy.mockResolvedValue(makeResponse({}));

        await expect(
            provider.getRoute(ORIGIN, DEST),
        ).rejects.toThrow(BadGatewayException);
    });

    it("throws InternalServerErrorException when distanceMeters is missing", async () => {
        const provider = await buildProvider();

        fetchSpy.mockResolvedValue(
            makeResponse({
                routes: [{ duration: "600s" }], // missing distanceMeters
            }),
        );

        await expect(
            provider.getRoute(ORIGIN, DEST),
        ).rejects.toThrow(InternalServerErrorException);
    });

    it("throws InternalServerErrorException when duration is missing", async () => {
        const provider = await buildProvider();

        fetchSpy.mockResolvedValue(
            makeResponse({
                routes: [{ distanceMeters: 5000 }], // missing duration
            }),
        );

        await expect(
            provider.getRoute(ORIGIN, DEST),
        ).rejects.toThrow(InternalServerErrorException);
    });

    it("throws InternalServerErrorException when duration is not parseable", async () => {
        const provider = await buildProvider();

        fetchSpy.mockResolvedValue(
            makeResponse({
                routes: [
                    {
                        distanceMeters: 5000,
                        duration: "NOT_A_NUMBER",
                    },
                ],
            }),
        );

        await expect(
            provider.getRoute(ORIGIN, DEST),
        ).rejects.toThrow(InternalServerErrorException);
    });

    it("throws BadGatewayException on network failure", async () => {
        const provider = await buildProvider();

        fetchSpy.mockRejectedValue(new Error("ECONNREFUSED"));

        await expect(
            provider.getRoute(ORIGIN, DEST),
        ).rejects.toThrow(BadGatewayException);
    });

    // ---- Field mask verification -------------------------------------------

    it("sends the required X-Goog-FieldMask header and never uses wildcard", async () => {
        const provider = await buildProvider();

        fetchSpy.mockResolvedValue(
            makeResponse({
                routes: [
                    {
                        distanceMeters: 5000,
                        duration: "600s",
                        polyline: { encodedPolyline: "abc" },
                    },
                ],
            }),
        );

        await provider.getRoute(ORIGIN, DEST);

        const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
        const headers = new Headers(init.headers as HeadersInit);

        const fieldMask = headers.get("X-Goog-FieldMask");
        expect(fieldMask).not.toBeNull();
        expect(fieldMask).not.toContain("*");
        expect(fieldMask).toContain("routes.distanceMeters");
        expect(fieldMask).toContain("routes.duration");
        expect(fieldMask).toContain("routes.polyline.encodedPolyline");
    });

    it("does not include the API key in the request URL", async () => {
        const provider = await buildProvider();

        fetchSpy.mockResolvedValue(
            makeResponse({
                routes: [
                    {
                        distanceMeters: 5000,
                        duration: "600s",
                    },
                ],
            }),
        );

        await provider.getRoute(ORIGIN, DEST);

        const [url] = fetchSpy.mock.calls[0] as [string, RequestInit];

        expect(url).not.toContain(MOCK_API_KEY);
    });
});
