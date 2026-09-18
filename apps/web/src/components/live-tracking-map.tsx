"use client";

import { useEffect, useRef, useState } from "react";
import type { DriverLocation } from "@/lib/driver-location";

interface LatLng {
    latitude: number | string;
    longitude: number | string;
    label?: string;
}

interface LiveTrackingMapProps {
    pickup: LatLng;
    destination: LatLng;
    driverLocation: DriverLocation | null;
    encodedPolyline?: string;
}

/** Decode Google encoded polyline string into array of [lat, lng] tuples. */
function decodePolyline(encoded: string): [number, number][] {
    const points: [number, number][] = [];
    let index = 0;
    const len = encoded.length;
    let lat = 0;
    let lng = 0;

    while (index < len) {
        let b: number;
        let shift = 0;
        let result = 0;
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        const dlat = result & 1 ? ~(result >> 1) : result >> 1;
        lat += dlat;

        shift = 0;
        result = 0;
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        const dlng = result & 1 ? ~(result >> 1) : result >> 1;
        lng += dlng;

        points.push([lat / 1e5, lng / 1e5]);
    }
    return points;
}

/** Safely inject Leaflet CSS & JS onto document head if not already loaded. */
function loadLeafletAssets(onLoad: () => void) {
    if (typeof window === "undefined") return;

    if ((window as unknown as { L?: unknown }).L) {
        onLoad();
        return;
    }

    if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
    }

    const existingJs = document.getElementById("leaflet-js");
    if (!existingJs) {
        const script = document.createElement("script");
        script.id = "leaflet-js";
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        script.onload = onLoad;
        document.head.appendChild(script);
    } else {
        existingJs.addEventListener("load", onLoad);
    }
}

export function LiveTrackingMap({
    pickup,
    destination,
    driverLocation,
    encodedPolyline,
}: LiveTrackingMapProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<unknown>(null);
    const driverMarkerRef = useRef<unknown>(null);
    const [leafletLoaded, setLeafletLoaded] = useState(false);

    useEffect(() => {
        loadLeafletAssets(() => setLeafletLoaded(true));
    }, []);

    // Initialize map and base markers
    useEffect(() => {
        if (!leafletLoaded || !mapContainerRef.current) return;

        const L = (window as unknown as { L: Record<string, unknown> }).L;
        if (!L) return;

        const pLat = Number(pickup.latitude);
        const pLng = Number(pickup.longitude);
        const dLat = Number(destination.latitude);
        const dLng = Number(destination.longitude);

        if (isNaN(pLat) || isNaN(pLng) || isNaN(dLat) || isNaN(dLng)) return;

        // Cleanup existing map instance on re-render
        if (mapInstanceRef.current) {
            (mapInstanceRef.current as { remove: () => void }).remove();
            mapInstanceRef.current = null;
            driverMarkerRef.current = null;
        }

        // Initialize Map
        const map = (L.map as (el: HTMLElement, opts: unknown) => unknown)(
            mapContainerRef.current,
            { zoomControl: false },
        );
        mapInstanceRef.current = map;

        // Tile layer (OpenStreetMap standard, free, no key required)
        (
            L.tileLayer as (
                url: string,
                opts: unknown,
            ) => { addTo: (m: unknown) => void }
        )(
            "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            {
                maxZoom: 19,
                attribution: "© OpenStreetMap contributors",
            },
        ).addTo(map);

        // Pickup & Destination Marker Icons
        const pickupIcon = (L.divIcon as (opts: unknown) => unknown)({
            className: "custom-pickup-marker",
            html: `<div style="background-color: #00D166; width: 22px; height: 22px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>`,
            iconSize: [22, 22],
            iconAnchor: [11, 11],
        });

        const destIcon = (L.divIcon as (opts: unknown) => unknown)({
            className: "custom-dest-marker",
            html: `<div style="background-color: #0F172A; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;"><div style="width: 8px; height: 8px; background-color: #00D166; border-radius: 50%;"></div></div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
        });

        (
            L.marker as (
                coords: [number, number],
                opts: unknown,
            ) => { addTo: (m: unknown) => unknown }
        )([pLat, pLng], { icon: pickupIcon }).addTo(map);

        (
            L.marker as (
                coords: [number, number],
                opts: unknown,
            ) => { addTo: (m: unknown) => unknown }
        )([dLat, dLng], { icon: destIcon }).addTo(map);

        // Resolve Polyline Points
        let routePoints: [number, number][] = [];
        if (encodedPolyline && encodedPolyline.trim() !== "") {
            try {
                routePoints = decodePolyline(encodedPolyline);
            } catch {
                routePoints = [];
            }
        }

        if (routePoints.length === 0) {
            routePoints = [
                [pLat, pLng],
                [dLat, dLng],
            ];
        }

        const polylineLayer = (
            L.polyline as (
                points: [number, number][],
                opts: unknown,
            ) => { addTo: (m: unknown) => void }
        )(routePoints, {
            color: "#00D166",
            weight: 5,
            opacity: 0.85,
            lineCap: "round",
            lineJoin: "round",
        });
        (polylineLayer as unknown as { addTo: (m: unknown) => void }).addTo(map);

        // Fit Initial Bounds
        const boundsPoints: [number, number][] = [...routePoints];
        const bounds = (
            L.latLngBounds as (points: [number, number][]) => unknown
        )(boundsPoints);
        (
            map as {
                fitBounds: (
                    b: unknown,
                    opts: { padding: [number, number] },
                ) => void;
            }
        ).fitBounds(bounds, { padding: [50, 50] });

        return () => {
            if (mapInstanceRef.current) {
                (mapInstanceRef.current as { remove: () => void }).remove();
                mapInstanceRef.current = null;
                driverMarkerRef.current = null;
            }
        };
    }, [leafletLoaded, pickup, destination, encodedPolyline]);

    // Update Driver Marker dynamically on driverLocation change
    useEffect(() => {
        if (!leafletLoaded || !mapInstanceRef.current) return;

        const L = (window as unknown as { L: Record<string, unknown> }).L;
        if (!L) return;

        if (
            !driverLocation ||
            driverLocation.latitude === null ||
            driverLocation.longitude === null
        ) {
            if (driverMarkerRef.current) {
                (driverMarkerRef.current as { remove: () => void }).remove();
                driverMarkerRef.current = null;
            }
            return;
        }

        const dLat = Number(driverLocation.latitude);
        const dLng = Number(driverLocation.longitude);
        const heading = driverLocation.heading ?? 0;
        const isMoving = (driverLocation.speedKmh ?? 0) > 2;

        const driverHtml = `
            <div style="
                position: relative;
                width: 36px;
                height: 36px;
                display: flex;
                align-items: center;
                justify-content: center;
                transform: rotate(${heading}deg);
                transition: transform 0.5s ease-in-out;
            ">
                <div style="
                    background-color: #0F172A;
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    border: 3px solid #00D166;
                    box-shadow: 0 3px 8px rgba(0,0,0,0.4);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                ">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00D166" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <polygon points="12 2 19 21 12 17 5 21 12 2"></polygon>
                    </svg>
                </div>
                ${isMoving ? `<div style="
                    position: absolute;
                    inset: -4px;
                    border-radius: 50%;
                    border: 2px solid #00D166;
                    animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
                    opacity: 0.75;
                "></div>` : ""}
            </div>
        `;

        const driverIcon = (L.divIcon as (opts: unknown) => unknown)({
            className: "custom-driver-marker",
            html: driverHtml,
            iconSize: [36, 36],
            iconAnchor: [18, 18],
        });

        if (driverMarkerRef.current) {
            (driverMarkerRef.current as {
                setLatLng: (coords: [number, number]) => void;
                setIcon: (icon: unknown) => void;
            }).setLatLng([dLat, dLng]);
            (driverMarkerRef.current as { setIcon: (icon: unknown) => void }).setIcon(driverIcon);
        } else {
            const marker = (
                L.marker as (
                    coords: [number, number],
                    opts: unknown,
                ) => { addTo: (m: unknown) => void }
            )([dLat, dLng], { icon: driverIcon });
            marker.addTo(mapInstanceRef.current);
            driverMarkerRef.current = marker;
        }
    }, [leafletLoaded, driverLocation]);

    return (
        <div className="relative h-full w-full overflow-hidden">
            <div ref={mapContainerRef} className="h-full w-full z-0" />
            {!leafletLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-[var(--rf-midnight)] text-white text-xs">
                    Loading Tracking Map…
                </div>
            )}
        </div>
    );
}
