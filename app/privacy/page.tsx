import LegalLayout from "@/components/sales/LegalLayout";

export default function PrivacyPage() {
    return (
        <LegalLayout title="Privacy Policy">
            <section className="space-y-6">
                <h2 className="text-2xl font-display font-bold text-white">1. Sovereignty First</h2>
                <p>
                    Oraya is built on the principle of absolute sovereignty. Unlike traditional AI platforms, Oraya operates locally on your machine. Your code, your secrets, and your neural history stay in your control.
                </p>
            </section>

            <section className="space-y-6">
                <h2 className="text-2xl font-display font-bold text-white">2. Data Storage</h2>
                <p>
                    Oraya utilizes a hybrid database structure. All primary operational data and long-term memory are stored in an encrypted SQLite database on your local machine. For 24/7 autonomous work and multi-device synchronization, we utilize Supabase (Postgres) with end-to-end encryption. The keys to this data never touch our servers.
                </p>
            </section>

            <section className="space-y-6">
                <h2 className="text-2xl font-display font-bold text-white">3. Information Collection</h2>
                <p>
                    We do not collect your prompts, your code, or your voice data. We collect minimal telemetry (crash reports, version checks) only if you explicitly opt-in. We are not in the business of selling your data; we are in the business of giving you yours.
                </p>
            </section>

            <section className="space-y-6">
                <h2 className="text-2xl font-display font-bold text-white">4. Third-Party Models</h2>
                <p>
                    When using cloud-based models (e.g., Anthropic, OpenAI), your data is subject to their respective privacy policies. Oraya acts as a secure, local-first relay, ensuring that only the minimum required context is sent for inference.
                </p>
            </section>
        </LegalLayout>
    );
}
