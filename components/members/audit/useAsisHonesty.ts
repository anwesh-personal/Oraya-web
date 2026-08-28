"use client";

import { useEffect, useState } from "react";
import {
    DEFAULT_HONESTY,
    fetchAsisHonesty,
    type HonestyState,
} from "@/lib/asis-honesty";

/** Client hook: start offline (never flash Verified), then adopt live health. */
export function useAsisHonesty() {
    const [honesty, setHonesty] = useState<HonestyState>(DEFAULT_HONESTY);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        let cancelled = false;
        fetchAsisHonesty().then((next) => {
            if (!cancelled) {
                setHonesty(next);
                setLoaded(true);
            }
        });
        return () => {
            cancelled = true;
        };
    }, []);

    return { honesty, loaded };
}
