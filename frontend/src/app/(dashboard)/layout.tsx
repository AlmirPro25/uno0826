import { Sidebar } from "@/components/dashboard/sidebar";
import { NotificationsDropdown } from "@/components/dashboard/notifications-dropdown";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-muted/20 flex">
            <Sidebar />
            <main className="flex-1 overflow-y-auto h-screen">
                {/* Top Bar */}
                <div className="sticky top-0 z-30 h-14 bg-[#030712]/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-end px-6">
                    <NotificationsDropdown />
                </div>
                <div className="max-w-6xl mx-auto p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
