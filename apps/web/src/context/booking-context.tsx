"use client";

import {
    createContext,
    useContext,
    useMemo,
    useState,
} from "react";

import type {
    BookingState,
    BookingStep,
    Destination,
    LocationPoint,
} from "@/types/booking";
import type { RideOption } from "@/types/ride";
import type { PaymentMethod, RideQuote } from "@/lib/rides";

type BookingContextValue = BookingState & {
    setPickup: (pickup: LocationPoint) => void;
    setDestination: (destination: Destination) => void;
    setStep: (step: BookingStep) => void;
    resetBooking: () => void;
    selectRide: (ride: RideOption) => void;
    setPaymentMethod: (method: PaymentMethod) => void;
    setQuote: (quote: RideQuote | null) => void;
};

const BookingContext = createContext<
    BookingContextValue | undefined
>(undefined);

const initialState: BookingState = {
    pickup: {
        label: "Current location · Hyderabad",
        locationId: "596d2a57-754a-49d9-a174-15d553610510",
    },
    destination: null,
    selectedRide: null,
    step: "destination",
    paymentMethod: null,
    quote: null,
};

export function BookingProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const [state, setState] = useState<BookingState>(
        initialState,
    );

    function setPickup(pickup: LocationPoint) {
        setState((current) => ({
            ...current,
            pickup,
            quote: null,
        }));
    }

    function selectRide(ride: RideOption) {
        setState((current) => ({
            ...current,
            selectedRide: ride,
            step: "payment",
            // Do NOT clear quote here. The quote was fetched specifically for
            // this ride type — committing the selection preserves it so the
            // payment and confirm pages can display the server fare.
            // Quote is only cleared when pickup or destination changes (see
            // setPickup / setDestination above), which genuinely invalidates it.
        }));
    }

    function setDestination(destination: Destination) {
        setState((current) => ({
            ...current,
            destination,
            step: "route",
            quote: null,
        }));
    }

    function setStep(step: BookingStep) {
        setState((current) => ({
            ...current,
            step,
        }));
    }

    function setPaymentMethod(method: PaymentMethod) {
        setState((current) => ({
            ...current,
            paymentMethod: method,
        }));
    }

    function setQuote(quote: RideQuote | null) {
        setState((current) => ({
            ...current,
            quote,
        }));
    }

    function resetBooking() {
        setState(initialState);
    }

    const value = useMemo(
        () => ({
            ...state,
            setPickup,
            setDestination,
            setStep,
            resetBooking,
            selectRide,
            setPaymentMethod,
            setQuote,
        }),
        [state],
    );

    return (
        <BookingContext.Provider value={value}>
            {children}
        </BookingContext.Provider>
    );
}

export function useBooking() {
    const context = useContext(BookingContext);

    if (!context) {
        throw new Error(
            "useBooking must be used inside BookingProvider",
        );
    }

    return context;
}