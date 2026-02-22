import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Sidebar } from "@/components/superadmin/layout/Sidebar";
import { Header } from "@/components/superadmin/layout/Header";

export default async function SuperadminDashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getSession();

    if (!session) {
        redirect("/superadmin/login");
    }

    return (
        <div className="min-h-screen bg-[var(--surface-0)]" data-portal="superadmin">
            <Sidebar session={session} />
            <div className="lg:ml-72 flex flex-col h-screen overflow-hidden">
                <Header session={session} />
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
