import { Sidebar } from "@/components/dashboard/sidebar";
import { NotificationsDropdown } from "@/components/dashboard/notifications-dropdown";
import { MobileNav } from "@/components/dashboard/mobile-nav";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-background flex flex-col md:flex-row">
            {/* Sidebar for Desktop - Hidden on Mobile */}
            <div className="hidden md:block flex-shrink-0 h-screen sticky top-0">
                <Sidebar className="h-full flex" />
            </div>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-h-screen min-w-0 bg-background">
                {/* Top Bar */}
                <div className="sticky top-0 z-30 h-14 bg-background/80 backdrop-blur-xl border-b border-border flex items-center justify-between px-4 md:px-6">
                    {/* Mobile Menu Trigger (Left) */}
                    <div className="flex items-center gap-2 md:hidden">
                        <MobileNav />
                        <span className="text-sm font-bold">ProstQS</span>
                    </div>

                    {/* Desktop Spacer (Left) - Empty */}
                    <div className="hidden md:block"></div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-2">
                        <NotificationsDropdown />
                    </div>
                </div>

                {/* Page Content */}
                <div className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
