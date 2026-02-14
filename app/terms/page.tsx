import LegalLayout from "@/components/sales/LegalLayout";

export default function TermsPage() {
    return (
        <LegalLayout title="Terms of Service">
            <section className="space-y-6">
                <h2 className="text-2xl font-display font-bold text-white">1. Acceptance of Terms</h2>
                <p>
                    By deploying Oraya on your machine, you agree to become the sovereign operator of a high-power intelligence system. You acknowledge that with great power comes the responsibility to not break yours or anyone else&apos;s machine.
                </p>
            </section>

            <section className="space-y-6">
                <h2 className="text-2xl font-display font-bold text-white">2. License to Operate</h2>
                <p>
                    Oraya grants you a non-exclusive, non-transferable license to execute our native binary on your hardware. You may use Oraya for commercial or personal development, but you may not decompile, reverse-engineer, or attempt to extract the core weights of the underlying models.
                </p>
            </section>

            <section className="space-y-6">
                <h2 className="text-2xl font-display font-bold text-white">3. Autonomous Actions</h2>
                <p>
                    Oraya is capable of autonomous terminal execution and file modification. You are the final authority. By enabling &quot;Autonomous Mode,&quot; you accept full responsibility for any changes, deletions, or system modifications performed by Oraya or its sub-agents (Ora, Veda, Mara, Saira).
                </p>
            </section>

            <section className="space-y-6">
                <h2 className="text-2xl font-display font-bold text-white">4. Termination</h2>
                <p>
                    We reserve the right to revoke your license if Oraya is used for illegal activities, including but not limited to building malware, unauthorized network intrusion, or violating the digital sovereignty of others.
                </p>
            </section>
        </LegalLayout>
    );
}
