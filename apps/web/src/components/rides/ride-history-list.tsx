"use client";

import {
    AlertCircle,
    ArrowRight,
    Calendar,
    Car,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock3,
    Filter,
    Loader2,
    MapPin,
    Receipt,
    RefreshCw,
    Search,
    Star,
    X,
    XCircle,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import {
    getDriverRideHistory,
    getRiderRideHistory,
    type RideHistoryFilterParams,
    type RideHistoryItem,
    type RideHistoryPaginationMeta,
} from "@/lib/ride-history";
import type { RideStatus } from "@/lib/rides";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const STATUS_CONFIG: Record<
    RideStatus,
    {
        label: string;
        className: string;
        icon: typeof Clock3;
    }
> = {
    REQUESTED: {
        label: "Requested",
        className: "bg-amber-50 text-amber-700 border-amber-200",
        icon: Clock3,
    },
    SEARCHING_DRIVER: {
        label: "Finding Driver",
        className: "bg-blue-50 text-blue-700 border-blue-200",
        icon: Loader2,
    },
    DRIVER_ASSIGNED: {
        label: "Driver Assigned",
        className: "bg-emerald-50 text-emerald-700 border-emerald-200",
        icon: Car,
    },
    DRIVER_ARRIVING: {
        label: "Driver Arriving",
        className: "bg-blue-50 text-blue-700 border-blue-200",
        icon: Car,
    },
    DRIVER_ARRIVED: {
        label: "Driver Arrived",
        className: "bg-emerald-50 text-emerald-700 border-emerald-200",
        icon: MapPin,
    },
    IN_PROGRESS: {
        label: "In Progress",
        className: "bg-emerald-50 text-emerald-700 border-emerald-200",
        icon: Car,
    },
    COMPLETED: {
        label: "Completed",
        className: "bg-gray-100 text-gray-700 border-gray-200",
        icon: CheckCircle2,
    },
    CANCELLED: {
        label: "Cancelled",
        className: "bg-red-50 text-red-700 border-red-200",
        icon: XCircle,
    },
};

const STATUS_OPTIONS: { label: string; value: RideStatus | "" }[] = [
    { label: "All Statuses", value: "" },
    { label: "Completed", value: "COMPLETED" },
    { label: "Cancelled", value: "CANCELLED" },
    { label: "In Progress", value: "IN_PROGRESS" },
    { label: "Driver Arriving", value: "DRIVER_ARRIVING" },
    { label: "Driver Assigned", value: "DRIVER_ASSIGNED" },
    { label: "Finding Driver", value: "SEARCHING_DRIVER" },
    { label: "Requested", value: "REQUESTED" },
];

interface RideHistoryListProps {
    audience: "rider" | "driver";
}

export function RideHistoryList({ audience }: RideHistoryListProps) {
    const [items, setItems] = useState<RideHistoryItem[]>([]);
    const [meta, setMeta] = useState<RideHistoryPaginationMeta | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filter controls
    const [searchInput, setSearchInput] = useState("");
    const [appliedSearch, setAppliedSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<RideStatus | "">("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    const fetchHistory = useCallback(
        async (params: RideHistoryFilterParams) => {
            try {
                setLoading(true);
                setError(null);
                const fetcher =
                    audience === "rider" ? getRiderRideHistory : getDriverRideHistory;
                const data = await fetcher(params);
                setItems(data.items);
                setMeta(data.meta);
            } catch (err) {
                setError(
                    err instanceof Error ? err.message : "Failed to load ride history.",
                );
            } finally {
                setLoading(false);
            }
        },
        [audience],
    );

    useEffect(() => {
        const queryParams: RideHistoryFilterParams = {
            page: currentPage,
            limit: pageSize,
            status: statusFilter ? statusFilter : undefined,
            startDate: startDate ? new Date(startDate).toISOString() : undefined,
            endDate: endDate ? new Date(endDate + "T23:59:59.999Z").toISOString() : undefined,
            search: appliedSearch ? appliedSearch : undefined,
        };

        void fetchHistory(queryParams);
    }, [fetchHistory, currentPage, statusFilter, startDate, endDate, appliedSearch]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setCurrentPage(1);
        setAppliedSearch(searchInput.trim());
    };

    const handleStatusChange = (val: string) => {
        setCurrentPage(1);
        setStatusFilter(val as RideStatus | "");
    };

    const handleStartDateChange = (val: string) => {
        setCurrentPage(1);
        setStartDate(val);
    };

    const handleEndDateChange = (val: string) => {
        setCurrentPage(1);
        setEndDate(val);
    };

    const handleClearFilters = () => {
        setSearchInput("");
        setAppliedSearch("");
        setStatusFilter("");
        setStartDate("");
        setEndDate("");
        setCurrentPage(1);
    };

    const hasActiveFilters = Boolean(
        appliedSearch || statusFilter || startDate || endDate,
    );

    return (
        <div className="space-y-6">
            {/* Filter and Search Bar */}
            <div className="rounded-3xl border border-[var(--rf-border)] bg-[var(--rf-surface)] p-5 shadow-sm sm:p-6">
                <form
                    onSubmit={handleSearchSubmit}
                    className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
                >
                    {/* Search by Ride ID */}
                    <div className="relative">
                        <label htmlFor="ride-search" className="block text-xs font-semibold text-[var(--rf-muted)] mb-1">
                            Search Ride ID
                        </label>
                        <div className="relative">
                            <Input
                                id="ride-search"
                                type="text"
                                placeholder="Search by ID..."
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                className="pl-10 text-xs"
                            />
                            <Search
                                size={16}
                                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--rf-muted)]"
                            />
                        </div>
                    </div>

                    {/* Status Filter */}
                    <div>
                        <label htmlFor="ride-status" className="block text-xs font-semibold text-[var(--rf-muted)] mb-1">
                            Ride Status
                        </label>
                        <select
                            id="ride-status"
                            value={statusFilter}
                            onChange={(e) => handleStatusChange(e.target.value)}
                            className="h-12 w-full rounded-2xl border border-[var(--rf-border)] bg-white px-4 text-xs font-medium text-[var(--rf-midnight)] outline-none transition focus:border-[var(--rf-green)] focus:ring-4 focus:ring-[var(--rf-green)]/10"
                        >
                            {STATUS_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Date Range: From */}
                    <div>
                        <label htmlFor="date-from" className="block text-xs font-semibold text-[var(--rf-muted)] mb-1">
                            From Date
                        </label>
                        <div className="relative">
                            <Input
                                id="date-from"
                                type="date"
                                value={startDate}
                                onChange={(e) => handleStartDateChange(e.target.value)}
                                className="pl-10 text-xs"
                            />
                            <Calendar
                                size={16}
                                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--rf-muted)]"
                            />
                        </div>
                    </div>

                    {/* Date Range: To */}
                    <div>
                        <label htmlFor="date-to" className="block text-xs font-semibold text-[var(--rf-muted)] mb-1">
                            To Date
                        </label>
                        <div className="relative">
                            <Input
                                id="date-to"
                                type="date"
                                value={endDate}
                                onChange={(e) => handleEndDateChange(e.target.value)}
                                className="pl-10 text-xs"
                            />
                            <Calendar
                                size={16}
                                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--rf-muted)]"
                            />
                        </div>
                    </div>
                </form>

                {/* Filter Action Row */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--rf-border)] pt-4 text-xs">
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="primary"
                            className="h-9 px-4 text-xs"
                            onClick={() => {
                                setCurrentPage(1);
                                setAppliedSearch(searchInput.trim());
                            }}
                        >
                            <Filter size={14} className="mr-1.5" />
                            Apply Filters
                        </Button>

                        {hasActiveFilters && (
                            <Button
                                type="button"
                                variant="ghost"
                                className="h-9 px-3 text-xs text-[var(--rf-muted)] hover:text-red-600"
                                onClick={handleClearFilters}
                            >
                                <X size={14} className="mr-1" />
                                Clear Filters
                            </Button>
                        )}
                    </div>

                    {meta && (
                        <p className="text-[var(--rf-muted)]">
                            Showing <strong>{items.length}</strong> of{" "}
                            <strong>{meta.total}</strong> rides
                        </p>
                    )}
                </div>
            </div>

            {/* Content States */}
            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className="h-44 w-full animate-pulse rounded-3xl border border-[var(--rf-border)] bg-[var(--rf-surface)] p-6"
                        />
                    ))}
                </div>
            ) : error ? (
                <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-center">
                    <AlertCircle size={28} className="mx-auto text-[var(--rf-danger)]" />
                    <h3 className="mt-2 text-sm font-bold text-[var(--rf-midnight)]">
                        Failed to load ride history
                    </h3>
                    <p className="mt-1 text-xs text-red-700">{error}</p>
                    <Button
                        variant="secondary"
                        className="mt-4 text-xs"
                        onClick={() =>
                            fetchHistory({
                                page: currentPage,
                                limit: pageSize,
                                status: statusFilter || undefined,
                                startDate: startDate ? new Date(startDate).toISOString() : undefined,
                                endDate: endDate ? new Date(endDate + "T23:59:59.999Z").toISOString() : undefined,
                                search: appliedSearch || undefined,
                            })
                        }
                    >
                        <RefreshCw size={14} className="mr-1.5" />
                        Try Again
                    </Button>
                </div>
            ) : items.length === 0 ? (
                <div className="rounded-3xl border border-[var(--rf-border)] bg-[var(--rf-surface)] p-12 text-center shadow-sm">
                    <Car size={36} className="mx-auto text-[var(--rf-muted)]/50" />
                    <h3 className="mt-3 text-base font-bold text-[var(--rf-midnight)]">
                        No rides found
                    </h3>
                    <p className="mt-1 text-xs text-[var(--rf-muted)]">
                        {hasActiveFilters
                            ? "No rides matched your search or filter criteria. Try adjusting or clearing your filters."
                            : audience === "rider"
                                ? "You haven't taken any rides yet. Book your first ride to get started!"
                                : "You haven't accepted any rides yet."}
                    </p>
                    {hasActiveFilters ? (
                        <Button
                            variant="secondary"
                            className="mt-5 text-xs"
                            onClick={handleClearFilters}
                        >
                            Reset Filters
                        </Button>
                    ) : audience === "rider" ? (
                        <Link href="/rider" className="mt-5 inline-block">
                            <Button variant="primary" className="text-xs">
                                Book a Ride
                            </Button>
                        </Link>
                    ) : null}
                </div>
            ) : (
                <div className="space-y-4">
                    {items.map((ride) => (
                        <RideHistoryCard
                            key={ride.id}
                            ride={ride}
                            audience={audience}
                        />
                    ))}
                </div>
            )}

            {/* Pagination Controls */}
            {meta && meta.totalPages > 1 && (
                <div className="flex items-center justify-between rounded-2xl border border-[var(--rf-border)] bg-[var(--rf-surface)] px-4 py-3 shadow-xs">
                    <Button
                        variant="secondary"
                        className="h-9 px-3 text-xs"
                        disabled={!meta.hasPreviousPage || loading}
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    >
                        <ChevronLeft size={16} className="mr-1" />
                        Previous
                    </Button>

                    <span className="text-xs font-semibold text-[var(--rf-muted)]">
                        Page <strong className="text-[var(--rf-midnight)]">{meta.page}</strong> of{" "}
                        <strong className="text-[var(--rf-midnight)]">{meta.totalPages}</strong>
                    </span>

                    <Button
                        variant="secondary"
                        className="h-9 px-3 text-xs"
                        disabled={!meta.hasNextPage || loading}
                        onClick={() => setCurrentPage((p) => Math.min(meta.totalPages, p + 1))}
                    >
                        Next
                        <ChevronRight size={16} className="ml-1" />
                    </Button>
                </div>
            )}
        </div>
    );
}

function RideHistoryCard({
    ride,
    audience,
}: {
    ride: RideHistoryItem;
    audience: "rider" | "driver";
}) {
    const statusCfg = STATUS_CONFIG[ride.status] ?? STATUS_CONFIG.REQUESTED;
    const StatusIcon = statusCfg.icon;

    const dateFormatted = new Date(ride.createdAt).toLocaleDateString([], {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });

    const detailHref =
        audience === "rider" ? `/rider/rides/${ride.id}` : `/driver/rides/${ride.id}`;

    const userReview = ride.reviews.length > 0 ? ride.reviews[0] : null;

    return (
        <article className="rounded-3xl border border-[var(--rf-border)] bg-[var(--rf-surface)] p-5 shadow-sm transition hover:shadow-md sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--rf-border)] pb-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--rf-green)]/10 text-[var(--rf-green-dark)]">
                        <Car size={20} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-[var(--rf-green-dark)]">
                                {ride.rideType} Ride
                            </span>
                            <span className="text-[10px] text-[var(--rf-muted)] font-mono">
                                #{ride.id.slice(0, 8)}
                            </span>
                        </div>
                        <p className="text-xs text-[var(--rf-muted)]">{dateFormatted}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border ${statusCfg.className}`}
                    >
                        <StatusIcon size={13} className="shrink-0" />
                        {statusCfg.label}
                    </span>

                    {ride.payment && (
                        <span
                            className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                                ride.payment.status === "SUCCEEDED"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : ride.payment.status === "FAILED"
                                        ? "bg-red-100 text-red-800"
                                        : "bg-amber-100 text-amber-800"
                            }`}
                        >
                            {ride.payment.status}
                        </span>
                    )}
                </div>
            </div>

            {/* Locations Route */}
            <div className="mt-4 space-y-2">
                <div className="flex items-start gap-2.5">
                    <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--rf-green-dark)]" />
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--rf-muted)]">
                            Pickup
                        </p>
                        <p className="text-xs font-bold text-[var(--rf-midnight)]">
                            {ride.pickupLocation.label}
                        </p>
                    </div>
                </div>

                <div className="ml-1 h-3 border-l border-dashed border-[var(--rf-border)]" />

                <div className="flex items-start gap-2.5">
                    <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--rf-midnight)]" />
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--rf-muted)]">
                            Destination
                        </p>
                        <p className="text-xs font-bold text-[var(--rf-midnight)]">
                            {ride.destinationLocation.label}
                        </p>
                    </div>
                </div>
            </div>

            {/* Telemetry & Audience-Aware Details */}
            <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-[var(--rf-surface-muted)] p-3 text-xs sm:grid-cols-4">
                <div>
                    <span className="text-[var(--rf-muted)] block font-medium">Fare</span>
                    <strong className="text-sm font-bold text-[var(--rf-midnight)]">
                        ₹{ride.estimatedFare}
                    </strong>
                </div>

                <div>
                    <span className="text-[var(--rf-muted)] block font-medium">Distance</span>
                    <strong className="text-sm font-bold text-[var(--rf-midnight)]">
                        {ride.estimatedDistanceKm} km
                    </strong>
                </div>

                <div>
                    <span className="text-[var(--rf-muted)] block font-medium">
                        {audience === "rider" ? "Driver" : "Rider"}
                    </span>
                    <strong className="text-sm font-bold text-[var(--rf-midnight)] truncate block">
                        {audience === "rider"
                            ? ride.driver?.user.name ?? "Unassigned"
                            : ride.rider?.name ?? "Rider"}
                    </strong>
                </div>

                <div>
                    <span className="text-[var(--rf-muted)] block font-medium">Payment</span>
                    <strong className="text-sm font-bold text-[var(--rf-midnight)]">
                        {ride.paymentMethod ?? "UPI"}
                    </strong>
                </div>
            </div>

            {/* Driver vehicle details (if rider view) or review snippet (if present) */}
            {audience === "rider" && ride.driver?.vehicle && (
                <div className="mt-3 flex items-center gap-2 text-xs text-[var(--rf-muted)]">
                    <Car size={14} className="shrink-0" />
                    <span>
                        {ride.driver.vehicle.year} {ride.driver.vehicle.make}{" "}
                        {ride.driver.vehicle.model} •{" "}
                        <strong className="text-[var(--rf-midnight)] font-mono">
                            {ride.driver.vehicle.plateNumber}
                        </strong>
                    </span>
                </div>
            )}

            {userReview && (
                <div className="mt-3 flex items-center gap-2 rounded-xl bg-amber-50/60 px-3 py-1.5 text-xs text-amber-900 border border-amber-100">
                    <Star size={13} className="fill-amber-400 text-amber-500 shrink-0" />
                    <span className="font-bold">{userReview.rating}/5</span>
                    {userReview.comment && (
                        <span className="truncate italic text-amber-800">
                            &ldquo;{userReview.comment}&rdquo;
                        </span>
                    )}
                </div>
            )}

            {/* Action buttons */}
            <div className="mt-4 flex items-center justify-end gap-3 border-t border-[var(--rf-border)] pt-3">
                {ride.status === "COMPLETED" && (
                    <Link
                        href={detailHref}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--rf-muted)] hover:text-[var(--rf-midnight)] transition"
                    >
                        <Receipt size={14} />
                        Receipt
                    </Link>
                )}

                <Link
                    href={detailHref}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[var(--rf-green-dark)] hover:underline"
                >
                    View Details
                    <ArrowRight size={14} />
                </Link>
            </div>
        </article>
    );
}
