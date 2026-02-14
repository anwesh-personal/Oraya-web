import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getSession();

    if (!session) {
        redirect("/login");
    }

    return (
        <div className="flex min-h-screen bg-surface-0">
            {/* Sidebar */}
            <Sidebar session={session} />

            {/* Main Content */}
            <div className="flex-1 flex flex-col ml-[var(--sidebar-width)] min-h-screen">
                {/* Header */}
                <Header session={session} />

                {/* Page Content */}
                <main className="flex-1 p-6 pt-[calc(var(--header-height)+24px)]">
                    <div className="max-w-7xl mx-auto page-enter">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
