"use client";

// ============================================================================
// VerifyCertificateClient — Client wrapper for the verification page
// ============================================================================
// Fetches live ASIS engine health to determine prover mode, then passes it
// to AttestationCertificate so mock proofs are honestly labeled.
// ============================================================================

import { useState, useEffect } from "react";
import type { AttestationRecord, EngineConfigMap } from "@/components/members/audit/types";
import { AttestationCertificate } from "@/components/members/audit";

interface VerifyCertificateClientProps {
    attestation: AttestationRecord;
    config: EngineConfigMap;
}

export function VerifyCertificateClient({ attestation, config }: VerifyCertificateClientProps) {
    const [proverMode, setProverMode] = useState<string | undefined>(undefined);

    useEffect(() => {
        async function fetchProverMode() {
            try {
                const res = await fetch("/api/asis/health");
                if (res.ok) {
                    const body = await res.json();
                    setProverMode(body.data?.prover_mode ?? "mock");
                }
            } catch {
                // Default to mock if health check fails — err on the side of honesty
                setProverMode("mock");
            }
        }
        fetchProverMode();
    }, []);

    return (
        <AttestationCertificate
            attestation={attestation}
            config={config}
            proverMode={proverMode}
        />
    );
}
