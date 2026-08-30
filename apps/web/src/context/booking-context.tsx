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

type BookingContextValue = BookingState & {
    setPickup: (pickup: LocationPoint) => void;
    setDestination: (destination: Destination) => void;
    setStep: (step: BookingStep) => void;
    resetBooking: () => void;
    selectRide: (ride: RideOption) => void;
};

const BookingContext = createContext<
    BookingContextValue | undefined
>(undefined);

const initialState: BookingState = {
    pickup: {
        label: "Current location · Hyderabad",
    },
    destination: null,
    selectedRide: null,
    step: "destination",
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
        }));
    }


    function selectRide(ride: RideOption) {
        setState((current) => ({
            ...current,
            selectedRide: ride,
            step: "payment",
        }));
    }

    function setDestination(destination: Destination) {
        setState((current) => ({
            ...current,
            destination,
            step: "route",
        }));
    }

    function setStep(step: BookingStep) {
        setState((current) => ({
            ...current,
            step,
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