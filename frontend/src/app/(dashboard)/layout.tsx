import { Sidebar } from "@/components/dashboard/sidebar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-muted/20 flex">
            <Sidebar />
            <main className="flex-1 overflow-y-auto h-screen">
                <div className="max-w-6xl mx-auto p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
