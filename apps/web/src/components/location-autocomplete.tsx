import { Loader2, MapPin, Locate, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import {
    searchLocations,
    resolveLocation,
    reverseGeocodeLocation,
    type LocationSuggestion,
} from "@/lib/locations";

interface LocationAutocompleteProps {
    label: string;
    placeholder: string;
    initialValue?: string;
    onLocationSelect: (id: string, label: string) => void;
    autoFocus?: boolean;
    showAutoDetect?: boolean;
}

export function LocationAutocomplete({
    label,
    placeholder,
    initialValue = "",
    onLocationSelect,
    autoFocus = false,
    showAutoDetect = false,
}: LocationAutocompleteProps) {
    const [query, setQuery] = useState(initialValue);
    const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [detectLoading, setDetectLoading] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [open, setOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(0);

    const [resolveLoading, setResolveLoading] = useState(false);
    const [resolveError, setResolveError] = useState<string | null>(null);

    const searchAbortRef = useRef<AbortController | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setQuery(initialValue);
    }, [initialValue]);

    useEffect(() => {
        const trimmed = query.trim();

        if (trimmed.length < 2) {
            setSuggestions([]);
            setSearchError(null);
            setOpen(false);
            return;
        }

        if (trimmed === initialValue) {
            return;
        }

        const timer = setTimeout(async () => {
            searchAbortRef.current?.abort();
            const controller = new AbortController();
            searchAbortRef.current = controller;

            setSearchLoading(true);
            setSearchError(null);

            try {
                const results = await searchLocations(trimmed, controller.signal);
                if (controller.signal.aborted) return;

                setSuggestions(results);
                setHighlightedIndex(0);
                setOpen(true);
            } catch (err) {
                if (controller.signal.aborted) return;
                setSearchError(err instanceof Error ? err.message : "Couldn't search.");
                setSuggestions([]);
            } finally {
                if (!controller.signal.aborted) {
                    setSearchLoading(false);
                }
            }
        }, 350);

        return () => clearTimeout(timer);
    }, [query, initialValue]);

    useEffect(() => {
        return () => searchAbortRef.current?.abort();
    }, []);

    async function chooseSuggestion(suggestion: LocationSuggestion) {
        if (resolveLoading) return;

        setQuery(suggestion.label);
        setSuggestions([]);
        setOpen(false);
        setResolveLoading(true);
        setResolveError(null);

        try {
            const resolved = await resolveLocation(suggestion.placeId, suggestion.label);
            onLocationSelect(resolved.id, suggestion.label);
        } catch (err) {
            setResolveError(err instanceof Error ? err.message : "Couldn't get location details.");
        } finally {
            setResolveLoading(false);
        }
    }

    function handleDetectCurrentLocation() {
        if (!navigator.geolocation) {
            setSearchError("Geolocation is not supported by your browser.");
            return;
        }

        setDetectLoading(true);
        setSearchError(null);

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const resolved = await reverseGeocodeLocation(
                        position.coords.latitude,
                        position.coords.longitude,
                    );
                    setQuery(resolved.label);
                    onLocationSelect(resolved.id, resolved.label);
                } catch (err) {
                    setSearchError(
                        err instanceof Error ? err.message : "Couldn't auto-detect location.",
                    );
                } finally {
                    setDetectLoading(false);
                }
            },
            (error) => {
                setDetectLoading(false);
                setSearchError(
                    error.code === error.PERMISSION_DENIED
                        ? "Location permission denied. Please allow location access."
                        : "Could not retrieve your position.",
                );
            },
            { enableHighAccuracy: true, timeout: 10000 },
        );
    }

    function clearSelection() {
        setQuery("");
        setSuggestions([]);
        setSearchError(null);
        setResolveError(null);
        setOpen(false);
        onLocationSelect("", "");
        inputRef.current?.focus();
    }

    function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
        if (event.key === "Escape") {
            setOpen(false);
            return;
        }
        if (!open || suggestions.length === 0) return;

        if (event.key === "ArrowDown") {
            event.preventDefault();
            setHighlightedIndex((i) => Math.min(i + 1, suggestions.length - 1));
        }
        if (event.key === "ArrowUp") {
            event.preventDefault();
            setHighlightedIndex((i) => Math.max(i - 1, 0));
        }
        if (event.key === "Enter") {
            event.preventDefault();
            const suggestion = suggestions[highlightedIndex];
            if (suggestion) {
                void chooseSuggestion(suggestion);
            }
        }
    }

    const showDropdown = open && query.trim().length >= 2;

    return (
        <div className="relative">
            <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-rf-text">{label}</label>

                {showAutoDetect && (
                    <button
                        type="button"
                        onClick={handleDetectCurrentLocation}
                        disabled={detectLoading}
                        className="flex items-center gap-1 text-xs font-semibold text-rf-green transition hover:underline disabled:opacity-50"
                    >
                        {detectLoading ? (
                            <Loader2 size={13} className="animate-spin" />
                        ) : (
                            <Locate size={13} />
                        )}
                        Auto-detect location
                    </button>
                )}
            </div>

            <div className="relative mt-2">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-rf-green">
                    {searchLoading || resolveLoading || detectLoading ? (
                        <Loader2 size={18} className="animate-spin" />
                    ) : (
                        <Search size={18} />
                    )}
                </span>

                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    autoComplete="off"
                    autoFocus={autoFocus}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => {
                        if (suggestions.length > 0) setOpen(true);
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className="h-14 w-full rounded-2xl border border-rf-border bg-white py-3 pl-12 pr-12 text-sm outline-none transition placeholder:text-rf-muted/60 focus:border-rf-green focus:ring-4 focus:ring-rf-green/10"
                />

                {query && (
                    <button
                        type="button"
                        onClick={clearSelection}
                        className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-rf-muted transition hover:bg-rf-surface-muted"
                    >
                        <X size={17} />
                    </button>
                )}

                {showDropdown && (
                    <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-rf-border bg-white p-2 shadow-lg">
                        {suggestions.length > 0 ? (
                            suggestions.map((suggestion, index) => (
                                <button
                                    key={suggestion.placeId}
                                    type="button"
                                    onMouseEnter={() => setHighlightedIndex(index)}
                                    onClick={() => void chooseSuggestion(suggestion)}
                                    className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition ${
                                        highlightedIndex === index
                                            ? "bg-rf-green/10"
                                            : "hover:bg-rf-surface-muted"
                                    }`}
                                >
                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rf-surface-muted text-rf-green">
                                        <MapPin size={17} />
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block text-sm font-semibold text-rf-text">
                                            {suggestion.label}
                                        </span>
                                        <span className="mt-0.5 block truncate text-xs text-rf-muted">
                                            {suggestion.description}
                                        </span>
                                    </span>
                                </button>
                            ))
                        ) : !searchLoading ? (
                            <div className="p-4">
                                <p className="text-sm font-semibold text-rf-text">No matching places</p>
                            </div>
                        ) : null}
                    </div>
                )}
            </div>

            {searchError && !searchLoading && (
                <p className="mt-2 text-xs font-medium text-red-600">{searchError}</p>
            )}
            {resolveError && !resolveLoading && (
                <p className="mt-2 text-xs font-medium text-red-600">{resolveError}</p>
            )}
        </div>
    );
}
