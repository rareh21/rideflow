"use client";

import { useEffect, useRef, useState } from "react";

interface LatLng {
    latitude: number | string;
    longitude: number | string;
    label?: string;
}

interface RouteMapProps {
    pickup: LatLng;
    destination: LatLng;
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

export function RouteMap({ pickup, destination, encodedPolyline }: RouteMapProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<unknown>(null);
    const [leafletLoaded, setLeafletLoaded] = useState(false);

    // Dynamically inject Leaflet CSS & JS
    useEffect(() => {
        if (typeof window === "undefined") return;

        // Check if Leaflet script is already injected
        if ((window as unknown as { L?: unknown }).L) {
            setLeafletLoaded(true);
            return;
        }

        const existingCss = document.getElementById("leaflet-css");
        if (!existingCss) {
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
            script.onload = () => setLeafletLoaded(true);
            document.head.appendChild(script);
        } else {
            existingJs.addEventListener("load", () => setLeafletLoaded(true));
        }
    }, []);

    // Initialize and update Leaflet Map
    useEffect(() => {
        if (!leafletLoaded || !mapContainerRef.current) return;

        const L = (window as unknown as { L: Record<string, unknown> }).L;
        if (!L) return;

        const pLat = Number(pickup.latitude);
        const pLng = Number(pickup.longitude);
        const dLat = Number(destination.latitude);
        const dLng = Number(destination.longitude);

        if (isNaN(pLat) || isNaN(pLng) || isNaN(dLat) || isNaN(dLng)) return;

        // Destroy existing map instance on re-render
        if (mapInstanceRef.current) {
            (mapInstanceRef.current as { remove: () => void }).remove();
            mapInstanceRef.current = null;
        }

        // Initialize Leaflet Map
        const map = (L.map as (el: HTMLElement, opts: unknown) => unknown)(
            mapContainerRef.current,
            { zoomControl: false },
        );
        mapInstanceRef.current = map;

        // Add OpenStreetMap tiles (100% free, clean street map, no API key required)
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

        // Custom pickup marker icon (Green circle)
        const pickupIcon = (L.divIcon as (opts: unknown) => unknown)({
            className: "custom-pickup-marker",
            html: `<div style="background-color: #00D166; width: 22px; height: 22px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>`,
            iconSize: [22, 22],
            iconAnchor: [11, 11],
        });

        // Custom destination marker icon (Midnight black pin)
        const destIcon = (L.divIcon as (opts: unknown) => unknown)({
            className: "custom-dest-marker",
            html: `<div style="background-color: #0F172A; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;"><div style="width: 8px; height: 8px; background-color: #00D166; border-radius: 50%;"></div></div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
        });

        // Add Pickup Marker
        (
            L.marker as (
                coords: [number, number],
                opts: unknown,
            ) => { addTo: (m: unknown) => unknown }
        )([pLat, pLng], { icon: pickupIcon }).addTo(map);

        // Add Destination Marker
        (
            L.marker as (
                coords: [number, number],
                opts: unknown,
            ) => { addTo: (m: unknown) => unknown }
        )([dLat, dLng], { icon: destIcon }).addTo(map);

        // Draw Route Polyline
        let routePoints: [number, number][] = [];

        if (encodedPolyline && encodedPolyline.trim() !== "") {
            try {
                routePoints = decodePolyline(encodedPolyline);
            } catch {
                routePoints = [
                    [pLat, pLng],
                    [dLat, dLng],
                ];
            }
        } else {
            routePoints = [
                [pLat, pLng],
                [dLat, dLng],
            ];
        }

        if (routePoints.length > 0) {
            (
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
            }).addTo(map);
        }

        // Fit map bounds to encompass both pickup and destination with padding
        const bounds = (
            L.latLngBounds as (points: [number, number][]) => unknown
        )([
            [pLat, pLng],
            [dLat, dLng],
        ]);
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
            }
        };
    }, [leafletLoaded, pickup, destination, encodedPolyline]);

    return (
        <div className="relative h-full w-full overflow-hidden">
            <div ref={mapContainerRef} className="h-full w-full z-0" />
            {!leafletLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-rf-midnight text-white text-xs">
                    Loading Map…
                </div>
            )}
        </div>
    );
}
