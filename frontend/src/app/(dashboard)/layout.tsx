import { Sidebar } from "@/components/dashboard/sidebar";
import { NotificationsDropdown } from "@/components/dashboard/notifications-dropdown";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-background flex">
            <Sidebar />
            <main className="flex-1 overflow-y-auto h-screen bg-background/50">
                {/* Top Bar */}
                <div className="sticky top-0 z-30 h-14 bg-background/80 backdrop-blur-xl border-b border-border flex items-center justify-end px-6">
                    <NotificationsDropdown />
                </div>
                <div className="max-w-6xl mx-auto p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
