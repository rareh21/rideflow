"use client";

import { useEffect, useRef, useState } from "react";
import { Car, Loader2, Navigation, WifiOff } from "lucide-react";

import type { DriverLocation } from "@/lib/driver-location";
import type { TrackingStatus } from "@/hooks/use-driver-tracking";

interface LatLng {
    latitude: number | string;
    longitude: number | string;
    label?: string;
}

interface DriverLiveMapProps {
    pickup: LatLng;
    destination: LatLng;
    driverLocation: DriverLocation | null;
    trackingStatus: TrackingStatus;
    rideStatus?: string;
    encodedPolyline?: string;
    loading?: boolean;
    error?: string | null;
}

/** Calculate Haversine distance in km between two lat/lng points. */
function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) *
            Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
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

export function DriverLiveMap({
    pickup,
    destination,
    driverLocation,
    trackingStatus,
    rideStatus,
    encodedPolyline,
    loading = false,
    error = null,
}: DriverLiveMapProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const driverMarkerRef = useRef<any>(null);
    const polylineLayerRef = useRef<any>(null);
    const approachPolylineRef = useRef<any>(null);
    const [leafletLoaded, setLeafletLoaded] = useState(false);

    useEffect(() => {
        loadLeafletAssets(() => setLeafletLoaded(true));
    }, []);

    // Initialize map on mount / Leaflet load
    useEffect(() => {
        if (!leafletLoaded || !mapContainerRef.current) return;

        const L = (window as unknown as { L: any }).L;
        if (!L) return;

        const pLat = Number(pickup.latitude);
        const pLng = Number(pickup.longitude);
        const dLat = Number(destination.latitude);
        const dLng = Number(destination.longitude);

        if (isNaN(pLat) || isNaN(pLng) || isNaN(dLat) || isNaN(dLng)) return;

        // Cleanup existing map instance on re-render
        if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
            driverMarkerRef.current = null;
            polylineLayerRef.current = null;
            approachPolylineRef.current = null;
        }

        // Initialize Map
        const map = L.map(mapContainerRef.current, { zoomControl: false });
        mapInstanceRef.current = map;

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution: "© OpenStreetMap contributors",
        }).addTo(map);

        // Pickup Marker
        const pickupIcon = L.divIcon({
            className: "custom-pickup-marker",
            html: `<div style="background-color: #00D166; width: 22px; height: 22px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>`,
            iconSize: [22, 22],
            iconAnchor: [11, 11],
        });

        // Destination Marker
        const destIcon = L.divIcon({
            className: "custom-dest-marker",
            html: `<div style="background-color: #0F172A; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;"><div style="width: 8px; height: 8px; background-color: #00D166; border-radius: 50%;"></div></div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
        });

        L.marker([pLat, pLng], { icon: pickupIcon }).addTo(map);
        L.marker([dLat, dLng], { icon: destIcon }).addTo(map);

        // Resolve Polyline Points
        let routePoints: [number, number][] = [];
        let isEncoded = false;
        if (encodedPolyline && encodedPolyline.trim() !== "") {
            try {
                routePoints = decodePolyline(encodedPolyline);
                if (routePoints.length > 0) {
                    isEncoded = true;
                }
            } catch {
                routePoints = [];
            }
        }

        if (!isEncoded) {
            routePoints = [
                [pLat, pLng],
                [dLat, dLng],
            ];
        }

        const polylineLayer = L.polyline(routePoints, {
            color: "#00D166",
            weight: 5,
            opacity: 0.85,
            lineCap: "round",
            lineJoin: "round",
        });
        polylineLayer.addTo(map);
        polylineLayerRef.current = polylineLayer;

        // Asynchronously fetch OSRM road polyline if no encoded polyline was provided
        if (!isEncoded) {
            const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${pLng},${pLat};${dLng},${dLat}?overview=full&geometries=polyline`;
            fetch(osrmUrl)
                .then((res) => res.json())
                .then((data: { code?: string; routes?: Array<{ geometry?: string }> }) => {
                    if (data?.code === "Ok" && data?.routes?.[0]?.geometry) {
                        const pts = decodePolyline(data.routes[0].geometry);
                        if (pts.length > 0 && polylineLayerRef.current) {
                            polylineLayerRef.current.setLatLngs(pts);
                        }
                    }
                })
                .catch(() => {
                    // Fallback to straight line
                });
        }

        // Fit map bounds to include pickup and destination
        const boundsPoints: [number, number][] = [...routePoints];
        if (driverLocation) {
            boundsPoints.push([Number(driverLocation.latitude), Number(driverLocation.longitude)]);
        }
        const bounds = L.latLngBounds(boundsPoints);
        map.fitBounds(bounds, { padding: [50, 50] });

        // Ensure Leaflet recalculates size after DOM layout finishes
        setTimeout(() => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.invalidateSize();
            }
        }, 100);

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
                driverMarkerRef.current = null;
                polylineLayerRef.current = null;
                approachPolylineRef.current = null;
            }
        };
    }, [leafletLoaded, pickup, destination, encodedPolyline]);

    // Update or add Driver Marker & Approach Route dynamically when driverLocation or rideStatus changes
    useEffect(() => {
        if (!leafletLoaded || !mapInstanceRef.current) return;

        const L = (window as unknown as { L: any }).L;
        if (!L) return;

        const pLat = Number(pickup.latitude);
        const pLng = Number(pickup.longitude);

        if (!driverLocation) {
            if (approachPolylineRef.current) {
                approachPolylineRef.current.remove();
                approachPolylineRef.current = null;
            }
            if (driverMarkerRef.current) {
                driverMarkerRef.current.remove();
                driverMarkerRef.current = null;
            }
            return;
        }

        const lat = Number(driverLocation.latitude);
        const lng = Number(driverLocation.longitude);

        if (isNaN(lat) || isNaN(lng)) return;

        const heading = driverLocation.heading ?? 0;
        const rotationStyle = driverLocation.heading !== null
            ? `transform: rotate(${heading}deg); transform-origin: center center;`
            : "";

        const isDriverArriving =
            rideStatus === "DRIVER_ASSIGNED" ||
            rideStatus === "DRIVER_ARRIVING" ||
            rideStatus === "DRIVER_ARRIVED";

        const driverIcon = L.divIcon({
            className: "custom-driver-live-marker",
            html: `
                <div style="background-color: #0F172A; width: 38px; height: 38px; border-radius: 50%; border: 3px solid ${isDriverArriving ? '#3B82F6' : '#00D166'}; box-shadow: 0 4px 14px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; transition: all 0.5s ease;">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${isDriverArriving ? '#3B82F6' : '#00D166'}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="${rotationStyle}">
                        <polygon points="12 2 19 21 12 17 5 21 12 2"></polygon>
                    </svg>
                </div>
            `,
            iconSize: [38, 38],
            iconAnchor: [19, 19],
        });

        if (driverMarkerRef.current) {
            driverMarkerRef.current.setLatLng([lat, lng]);
            driverMarkerRef.current.setIcon(driverIcon);
        } else {
            driverMarkerRef.current = L.marker([lat, lng], {
                icon: driverIcon,
                zIndexOffset: 1000,
            }).addTo(mapInstanceRef.current);
        }

        // Draw Approach Route (Driver -> Pickup) when driver is on the way to pickup
        if (isDriverArriving && !isNaN(pLat) && !isNaN(pLng)) {
            const approachPts: [number, number][] = [
                [lat, lng],
                [pLat, pLng],
            ];

            if (!approachPolylineRef.current) {
                approachPolylineRef.current = L.polyline(approachPts, {
                    color: "#3B82F6",
                    weight: 5,
                    dashArray: "8, 8",
                    opacity: 0.9,
                    lineCap: "round",
                    lineJoin: "round",
                }).addTo(mapInstanceRef.current);
            } else {
                approachPolylineRef.current.setLatLngs(approachPts);
            }

            // Fetch road geometry for Driver -> Pickup via OSRM
            const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${lng},${lat};${pLng},${pLat}?overview=full&geometries=polyline`;
            fetch(osrmUrl)
                .then((res) => res.json())
                .then((data: { code?: string; routes?: Array<{ geometry?: string }> }) => {
                    if (data?.code === "Ok" && data?.routes?.[0]?.geometry) {
                        const pts = decodePolyline(data.routes[0].geometry);
                        if (pts.length > 0 && approachPolylineRef.current) {
                            approachPolylineRef.current.setLatLngs(pts);
                        }
                    }
                })
                .catch(() => {});
        } else if (approachPolylineRef.current) {
            approachPolylineRef.current.remove();
            approachPolylineRef.current = null;
        }

        // Auto-fit map bounds to encompass Driver, Pickup, and Destination
        const dLat = Number(destination.latitude);
        const dLng = Number(destination.longitude);

        const boundsPoints: [number, number][] = [[lat, lng]];
        if (!isNaN(pLat) && !isNaN(pLng)) boundsPoints.push([pLat, pLng]);
        if (!isNaN(dLat) && !isNaN(dLng)) boundsPoints.push([dLat, dLng]);

        if (boundsPoints.length >= 2 && mapInstanceRef.current) {
            const bounds = L.latLngBounds(boundsPoints);
            mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
        }
    }, [leafletLoaded, driverLocation, rideStatus, pickup, destination]);

    // Calculate distance to pickup if driver location is available
    const pLat = Number(pickup.latitude);
    const pLng = Number(pickup.longitude);
    const dLat = driverLocation ? Number(driverLocation.latitude) : NaN;
    const dLng = driverLocation ? Number(driverLocation.longitude) : NaN;

    const isDriverArriving =
        rideStatus === "DRIVER_ASSIGNED" ||
        rideStatus === "DRIVER_ARRIVING" ||
        rideStatus === "DRIVER_ARRIVED";

    const driverToPickupKm =
        driverLocation && !isNaN(pLat) && !isNaN(pLng) && !isNaN(dLat) && !isNaN(dLng)
            ? getDistanceKm(dLat, dLng, pLat, pLng)
            : null;

    // Format time ago string for status display
    const timeAgoStr = getTimeAgoString(driverLocation?.updatedAt);

    return (
        <div className="relative h-full w-full overflow-hidden rounded-3xl border border-[var(--rf-border)] bg-[var(--rf-surface)] shadow-sm">
            <div ref={mapContainerRef} className="h-full w-full z-0" />

            {/* Floating Live Tracking Overlay Status Badge */}
            <div className="absolute top-3 left-3 z-10 flex items-center gap-2 rounded-2xl bg-white/95 px-3.5 py-2 text-xs font-bold shadow-md backdrop-blur-md border border-gray-100">
                {loading ? (
                    <span className="flex items-center gap-1.5 text-gray-600">
                        <Loader2 size={14} className="animate-spin text-[var(--rf-green-dark)]" />
                        Getting driver location...
                    </span>
                ) : isDriverArriving && driverLocation && driverToPickupKm !== null ? (
                    <span className="flex items-center gap-1.5 text-blue-700">
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
                        </span>
                        {driverToPickupKm < 0.1
                            ? "Driver arrived at pickup!"
                            : `Driver arriving — ${driverToPickupKm} km to pickup`}
                    </span>
                ) : trackingStatus === "live" ? (
                    <span className="flex items-center gap-1.5 text-emerald-700">
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                        </span>
                        Live driver tracking
                    </span>
                ) : trackingStatus === "recent" ? (
                    <span className="flex items-center gap-1.5 text-amber-700">
                        <Navigation size={14} className="text-amber-600" />
                        Updated {timeAgoStr}
                    </span>
                ) : trackingStatus === "stale" ? (
                    <span className="flex items-center gap-1.5 text-orange-700">
                        <Navigation size={14} className="text-orange-600" />
                        Location last updated {timeAgoStr}
                    </span>
                ) : trackingStatus === "disconnected" ? (
                    <span className="flex items-center gap-1.5 text-red-700">
                        <WifiOff size={14} className="text-red-600" />
                        Reconnecting live tracking...
                    </span>
                ) : (
                    <span className="flex items-center gap-1.5 text-gray-500">
                        <Car size={14} className="text-gray-400" />
                        Driver location unavailable
                    </span>
                )}
            </div>

            {/* Error banner if present */}
            {error && (
                <div className="absolute bottom-3 left-3 right-3 z-10 rounded-xl bg-red-50/95 p-2.5 text-xs text-red-800 border border-red-200 shadow-sm backdrop-blur-md">
                    {error}
                </div>
            )}

            {!leafletLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-[var(--rf-midnight)] text-white text-xs font-semibold">
                    Loading Live Tracking Map...
                </div>
            )}
        </div>
    );
}

function getTimeAgoString(updatedAt?: string): string {
    if (!updatedAt) return "recently";
    const sec = Math.floor((Date.now() - new Date(updatedAt).getTime()) / 1000);
    if (sec < 5) return "just now";
    if (sec < 60) return `${sec} seconds ago`;
    const min = Math.floor(sec / 60);
    return `${min} minute${min > 1 ? "s" : ""} ago`;
}

