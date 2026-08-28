"use client";

// ============================================================================
// VerifyCertificateClient — Client wrapper for the verification page
// ============================================================================
// Fetches live ASIS honesty state, then passes it to AttestationCertificate.
// Mock / offline / unknown never render as cryptographically verified.
// ============================================================================

import type { AttestationRecord, EngineConfigMap } from "@/components/members/audit/types";
import { AttestationCertificate, useAsisHonesty } from "@/components/members/audit";

interface VerifyCertificateClientProps {
    attestation: AttestationRecord;
    config: EngineConfigMap;
}

export function VerifyCertificateClient({ attestation, config }: VerifyCertificateClientProps) {
    const { honesty } = useAsisHonesty();

    return (
        <AttestationCertificate
            attestation={attestation}
            config={config}
            honesty={honesty}
        />
    );
}
