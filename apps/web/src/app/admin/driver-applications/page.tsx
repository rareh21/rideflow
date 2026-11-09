"use client";

import { useEffect, useState, useMemo } from "react";
import {
    CheckCircle2,
    Clock3,
    FileCheck2,
    Filter,
    Loader2,
    RefreshCw,
    Search,
    ShieldCheck,
    User,
    X,
    XCircle,
    AlertCircle,
} from "lucide-react";

import {
    getDriverApplications,
    reviewDriverApplication,
    type AdminDriverApplication,
    type DriverApplicationStatus,
} from "@/lib/drivers";
import { Button } from "@/components/ui/button";

export default function AdminDriverApplicationsPage() {
    const [applications, setApplications] = useState<AdminDriverApplication[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // Filter states
    const [selectedStatus, setSelectedStatus] = useState<"ALL" | DriverApplicationStatus>("PENDING");
    const [searchQuery, setSearchQuery] = useState("");

    // Review action state
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [rejectingApp, setRejectingApp] = useState<AdminDriverApplication | null>(null);
    const [rejectionReason, setRejectionReason] = useState("");
    const [rejectError, setRejectError] = useState<string | null>(null);

    async function loadApplications() {
        try {
            setLoading(true);
            setError(null);
            const data = await getDriverApplications();
            setApplications(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load driver applications.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void loadApplications();
    }, []);

    // Filter counts
    const counts = useMemo(() => {
        const pending = applications.filter((a) => a.status === "PENDING").length;
        const approved = applications.filter((a) => a.status === "APPROVED").length;
        const rejected = applications.filter((a) => a.status === "REJECTED").length;
        return { total: applications.length, pending, approved, rejected };
    }, [applications]);

    // Filtered applications
    const filteredApplications = useMemo(() => {
        return applications.filter((app) => {
            const matchesStatus = selectedStatus === "ALL" || app.status === selectedStatus;
            const query = searchQuery.trim().toLowerCase();
            const matchesQuery =
                !query ||
                app.user.name.toLowerCase().includes(query) ||
                app.user.email.toLowerCase().includes(query) ||
                (app.licenseNumber && app.licenseNumber.toLowerCase().includes(query));
            return matchesStatus && matchesQuery;
        });
    }, [applications, selectedStatus, searchQuery]);

    async function handleApprove(application: AdminDriverApplication) {
        try {
            setProcessingId(application.id);
            setActionMessage(null);
            await reviewDriverApplication(application.id, { status: "APPROVED" });

            setApplications((prev) =>
                prev.map((app) =>
                    app.id === application.id
                        ? { ...app, status: "APPROVED", reviewedAt: new Date().toISOString() }
                        : app,
                ),
            );

            setActionMessage({
                type: "success",
                text: `${application.user.name}'s application has been approved and their account promoted to Driver!`,
            });
        } catch (err) {
            setActionMessage({
                type: "error",
                text: err instanceof Error ? err.message : "Failed to approve application.",
            });
        } finally {
            setProcessingId(null);
        }
    }

    function openRejectModal(application: AdminDriverApplication) {
        setRejectingApp(application);
        setRejectionReason("");
        setRejectError(null);
    }

    async function handleConfirmReject() {
        if (!rejectingApp) return;

        const reason = rejectionReason.trim();
        if (!reason) {
            setRejectError("Please provide a reason for rejecting this application.");
            return;
        }

        try {
            setProcessingId(rejectingApp.id);
            setRejectError(null);
            await reviewDriverApplication(rejectingApp.id, {
                status: "REJECTED",
                rejectionReason: reason,
            });

            setApplications((prev) =>
                prev.map((app) =>
                    app.id === rejectingApp.id
                        ? {
                              ...app,
                              status: "REJECTED",
                              rejectionReason: reason,
                              reviewedAt: new Date().toISOString(),
                          }
                        : app,
                ),
            );

            setActionMessage({
                type: "success",
                text: `Application for ${rejectingApp.user.name} has been rejected with feedback.`,
            });
            setRejectingApp(null);
        } catch (err) {
            setRejectError(err instanceof Error ? err.message : "Failed to reject application.");
        } finally {
            setProcessingId(null);
        }
    }

    return (
        <div className="min-h-full bg-[var(--rf-surface-muted)]">
            <div className="mx-auto max-w-6xl px-4 py-6 pb-28 sm:px-6 lg:px-8 lg:py-8 lg:pb-8">
                {/* Header */}
                <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--rf-green)]/15 text-[var(--rf-green-dark)]">
                                <ShieldCheck size={18} />
                            </span>
                            <p className="text-xs font-bold uppercase tracking-wider text-[var(--rf-green-dark)]">
                                Admin Portal
                            </p>
                        </div>
                        <h1 className="mt-2 text-2xl font-bold tracking-tight text-[var(--rf-midnight)] sm:text-3xl">
                            Driver Applications
                        </h1>
                        <p className="mt-1 text-sm text-[var(--rf-muted)]">
                            Review and verify driver KYC submissions to onboard them onto RideFlow.
                        </p>
                    </div>

                    <Button
                        variant="secondary"
                        onClick={() => void loadApplications()}
                        disabled={loading}
                        className="self-start sm:self-auto"
                    >
                        <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                        Refresh
                    </Button>
                </header>

                {/* Action Feedback Banner */}
                {actionMessage && (
                    <div
                        role="alert"
                        className={`mt-6 flex items-center justify-between rounded-2xl border p-4 text-sm font-medium ${
                            actionMessage.type === "success"
                                ? "border-[var(--rf-green)]/30 bg-[var(--rf-green)]/10 text-[var(--rf-green-dark)]"
                                : "border-red-200 bg-red-50 text-[var(--rf-danger)]"
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            {actionMessage.type === "success" ? (
                                <CheckCircle2 size={18} className="shrink-0" />
                            ) : (
                                <AlertCircle size={18} className="shrink-0" />
                            )}
                            <span>{actionMessage.text}</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setActionMessage(null)}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <X size={16} />
                        </button>
                    </div>
                )}

                {/* Filter and Search Bar */}
                <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    {/* Status Tabs */}
                    <div className="flex flex-wrap gap-2 rounded-2xl border border-[var(--rf-border)] bg-[var(--rf-surface)] p-1.5 shadow-sm">
                        <StatusTab
                            label="Pending"
                            count={counts.pending}
                            active={selectedStatus === "PENDING"}
                            onClick={() => setSelectedStatus("PENDING")}
                            badgeColor="bg-amber-100 text-amber-800"
                        />
                        <StatusTab
                            label="Approved"
                            count={counts.approved}
                            active={selectedStatus === "APPROVED"}
                            onClick={() => setSelectedStatus("APPROVED")}
                            badgeColor="bg-green-100 text-green-800"
                        />
                        <StatusTab
                            label="Rejected"
                            count={counts.rejected}
                            active={selectedStatus === "REJECTED"}
                            onClick={() => setSelectedStatus("REJECTED")}
                            badgeColor="bg-red-100 text-red-800"
                        />
                        <StatusTab
                            label="All"
                            count={counts.total}
                            active={selectedStatus === "ALL"}
                            onClick={() => setSelectedStatus("ALL")}
                            badgeColor="bg-gray-100 text-gray-800"
                        />
                    </div>

                    {/* Search Input */}
                    <div className="relative min-w-[260px]">
                        <Search
                            size={16}
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--rf-muted)]"
                        />
                        <input
                            type="text"
                            placeholder="Search name, email, DL..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-11 w-full rounded-2xl border border-[var(--rf-border)] bg-[var(--rf-surface)] pl-10 pr-4 text-sm font-medium text-[var(--rf-midnight)] outline-none transition placeholder:text-[var(--rf-muted)] focus:border-[var(--rf-green)] focus:ring-2 focus:ring-[var(--rf-green)]/20"
                        />
                    </div>
                </div>

                {/* Content Area */}
                {loading ? (
                    <div className="mt-6 space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="h-44 animate-pulse rounded-3xl border border-[var(--rf-border)] bg-[var(--rf-surface)] p-6"
                            />
                        ))}
                    </div>
                ) : error ? (
                    <div className="mt-6 rounded-3xl border border-red-200 bg-[var(--rf-surface)] p-8 text-center shadow-sm">
                        <AlertCircle size={32} className="mx-auto text-[var(--rf-danger)]" />
                        <h2 className="mt-3 text-lg font-bold text-[var(--rf-midnight)]">
                            Unable to load applications
                        </h2>
                        <p className="mt-1 text-sm text-[var(--rf-muted)]">{error}</p>
                        <Button variant="primary" className="mt-5" onClick={() => void loadApplications()}>
                            Try again
                        </Button>
                    </div>
                ) : filteredApplications.length === 0 ? (
                    <div className="mt-6 rounded-3xl border border-[var(--rf-border)] bg-[var(--rf-surface)] p-12 text-center shadow-sm">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--rf-green)]/10 text-[var(--rf-green-dark)]">
                            <FileCheck2 size={28} />
                        </div>
                        <h2 className="mt-4 text-lg font-bold text-[var(--rf-midnight)]">
                            No applications found
                        </h2>
                        <p className="mt-1 text-sm text-[var(--rf-muted)]">
                            {searchQuery
                                ? `No applications matching "${searchQuery}".`
                                : selectedStatus === "PENDING"
                                ? "There are no pending driver applications to review right now."
                                : `No ${selectedStatus.toLowerCase()} applications available.`}
                        </p>
                    </div>
                ) : (
                    <div className="mt-6 space-y-4">
                        {filteredApplications.map((app) => (
                            <ApplicationCard
                                key={app.id}
                                application={app}
                                onApprove={() => handleApprove(app)}
                                onReject={() => openRejectModal(app)}
                                isProcessing={processingId === app.id}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Rejection Modal */}
            {rejectingApp && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-lg rounded-3xl border border-[var(--rf-border)] bg-[var(--rf-surface)] p-6 shadow-xl sm:p-8">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-[var(--rf-danger)]">
                                    Reject Application
                                </p>
                                <h2 className="mt-1 text-xl font-bold text-[var(--rf-midnight)]">
                                    Reject {rejectingApp.user.name}&apos;s Application
                                </h2>
                            </div>
                            <button
                                type="button"
                                onClick={() => setRejectingApp(null)}
                                className="rounded-xl p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <p className="mt-2 text-sm text-[var(--rf-muted)]">
                            Please explain why this application is being rejected. This feedback will be displayed to the
                            applicant so they can address the issue and reapply.
                        </p>

                        <div className="mt-5">
                            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--rf-midnight)]">
                                Rejection Reason <span className="text-[var(--rf-danger)]">*</span>
                            </label>
                            <textarea
                                rows={4}
                                placeholder="e.g. Driving licence photo was blurry or licence number is invalid."
                                value={rejectionReason}
                                onChange={(e) => {
                                    setRejectionReason(e.target.value);
                                    setRejectError(null);
                                }}
                                className="mt-2 w-full rounded-2xl border border-[var(--rf-border)] bg-[var(--rf-surface-muted)] p-3.5 text-sm font-medium text-[var(--rf-midnight)] outline-none transition focus:border-[var(--rf-green)] focus:ring-2 focus:ring-[var(--rf-green)]/20"
                            />
                        </div>

                        {/* Quick Preset Buttons */}
                        <div className="mt-3 flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() =>
                                    setRejectionReason(
                                        "Driving licence number could not be verified with authorities.",
                                    )
                                }
                                className="rounded-xl border border-[var(--rf-border)] bg-white px-3 py-1 text-xs text-[var(--rf-muted)] hover:border-[var(--rf-green)] hover:text-[var(--rf-midnight)]"
                            >
                                Unverified licence number
                            </button>
                            <button
                                type="button"
                                onClick={() =>
                                    setRejectionReason(
                                        "Driving licence document is expired. Please submit an active licence.",
                                    )
                                }
                                className="rounded-xl border border-[var(--rf-border)] bg-white px-3 py-1 text-xs text-[var(--rf-muted)] hover:border-[var(--rf-green)] hover:text-[var(--rf-midnight)]"
                            >
                                Expired licence
                            </button>
                            <button
                                type="button"
                                onClick={() =>
                                    setRejectionReason(
                                        "Name on driving licence does not match RideFlow account name.",
                                    )
                                }
                                className="rounded-xl border border-[var(--rf-border)] bg-white px-3 py-1 text-xs text-[var(--rf-muted)] hover:border-[var(--rf-green)] hover:text-[var(--rf-midnight)]"
                            >
                                Name mismatch
                            </button>
                        </div>

                        {rejectError && (
                            <p className="mt-3 text-xs font-semibold text-[var(--rf-danger)]">{rejectError}</p>
                        )}

                        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                            <Button
                                variant="secondary"
                                onClick={() => setRejectingApp(null)}
                                disabled={processingId === rejectingApp.id}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="danger"
                                onClick={() => void handleConfirmReject()}
                                disabled={processingId === rejectingApp.id || !rejectionReason.trim()}
                            >
                                {processingId === rejectingApp.id ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        Rejecting...
                                    </>
                                ) : (
                                    "Confirm Rejection"
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function StatusTab({
    label,
    count,
    active,
    onClick,
    badgeColor,
}: {
    label: string;
    count: number;
    active: boolean;
    onClick: () => void;
    badgeColor: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                active
                    ? "bg-[var(--rf-midnight)] text-white shadow-sm"
                    : "text-[var(--rf-muted)] hover:text-[var(--rf-midnight)]"
            }`}
        >
            <span>{label}</span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${active ? "bg-white/20 text-white" : badgeColor}`}>
                {count}
            </span>
        </button>
    );
}

function ApplicationCard({
    application,
    onApprove,
    onReject,
    isProcessing,
}: {
    application: AdminDriverApplication;
    onApprove: () => void;
    onReject: () => void;
    isProcessing: boolean;
}) {
    const isPending = application.status === "PENDING";
    const isApproved = application.status === "APPROVED";
    const isRejected = application.status === "REJECTED";

    const submittedDate = new Date(application.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });

    const reviewedDate = application.reviewedAt
        ? new Date(application.reviewedAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
          })
        : null;

    return (
        <div className="rounded-3xl border border-[var(--rf-border)] bg-[var(--rf-surface)] p-6 shadow-sm transition hover:shadow-md sm:p-7">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                {/* User & License Details */}
                <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--rf-midnight)] text-lg font-bold text-white">
                        {application.user.name.charAt(0).toUpperCase()}
                    </div>

                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-lg font-bold text-[var(--rf-midnight)]">
                                {application.user.name}
                            </h2>
                            <StatusBadge status={application.status} />
                        </div>

                        <p className="mt-0.5 text-sm text-[var(--rf-muted)]">{application.user.email}</p>

                        <div className="mt-4 flex flex-wrap gap-4 text-xs text-[var(--rf-muted)]">
                            <div>
                                <span className="font-semibold text-[var(--rf-midnight)]">Licence Number: </span>
                                <span className="font-mono font-semibold text-[var(--rf-green-dark)] bg-[var(--rf-green)]/10 px-2 py-0.5 rounded-lg">
                                    {application.licenseNumber || "Not provided"}
                                </span>
                            </div>

                            <div>
                                <span className="font-semibold text-[var(--rf-midnight)]">Applied: </span>
                                {submittedDate}
                            </div>

                            {reviewedDate && (
                                <div>
                                    <span className="font-semibold text-[var(--rf-midnight)]">Reviewed: </span>
                                    {reviewedDate}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Actions for Pending */}
                {isPending && (
                    <div className="flex items-center gap-3 self-end sm:self-auto">
                        <Button
                            variant="secondary"
                            onClick={onReject}
                            disabled={isProcessing}
                            className="text-[var(--rf-danger)] hover:bg-red-50 hover:border-red-200"
                        >
                            <XCircle size={16} />
                            Reject
                        </Button>

                        <Button
                            variant="primary"
                            onClick={onApprove}
                            disabled={isProcessing}
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Approving...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 size={16} />
                                    Approve Driver
                                </>
                            )}
                        </Button>
                    </div>
                )}
            </div>

            {/* Rejection Reason Notice */}
            {isRejected && application.rejectionReason && (
                <div className="mt-5 rounded-2xl border border-red-200 bg-red-50/60 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-red-700">
                        Reason for rejection
                    </p>
                    <p className="mt-1 text-sm text-red-900">{application.rejectionReason}</p>
                </div>
            )}
        </div>
    );
}

function StatusBadge({ status }: { status: DriverApplicationStatus }) {
    if (status === "APPROVED") {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-bold text-green-700 border border-green-200">
                <CheckCircle2 size={13} />
                Approved
            </span>
        );
    }

    if (status === "REJECTED") {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700 border border-red-200">
                <XCircle size={13} />
                Rejected
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 border border-amber-200">
            <Clock3 size={13} />
            Pending Review
        </span>
    );
}
