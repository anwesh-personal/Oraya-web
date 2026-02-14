import { MemberSidebar } from "@/components/layout/MemberSidebar";
import { MemberHeader } from "@/components/layout/MemberHeader";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen bg-[var(--surface-50)]">
            <MemberSidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <MemberHeader />
                <main className="flex-1 overflow-y-auto p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
