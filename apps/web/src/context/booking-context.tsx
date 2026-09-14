"use client";

import {
    createContext,
    useCallback,
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

    const setPickup = useCallback((pickup: LocationPoint) => {
        setState((current) => ({
            ...current,
            pickup,
            quote: null,
        }));
    }, []);

    const selectRide = useCallback((ride: RideOption) => {
        setState((current) => ({
            ...current,
            selectedRide: ride,
            step: "payment",
        }));
    }, []);

    const setDestination = useCallback((destination: Destination) => {
        setState((current) => ({
            ...current,
            destination,
            step: "route",
            quote: null,
        }));
    }, []);

    const setStep = useCallback((step: BookingStep) => {
        setState((current) => ({
            ...current,
            step,
        }));
    }, []);

    const setPaymentMethod = useCallback((method: PaymentMethod) => {
        setState((current) => ({
            ...current,
            paymentMethod: method,
        }));
    }, []);

    const setQuote = useCallback((quote: RideQuote | null) => {
        setState((current) => ({
            ...current,
            quote,
        }));
    }, []);

    const resetBooking = useCallback(() => {
        setState(initialState);
    }, []);

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
        [
            state,
            setPickup,
            setDestination,
            setStep,
            resetBooking,
            selectRide,
            setPaymentMethod,
            setQuote,
        ],
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