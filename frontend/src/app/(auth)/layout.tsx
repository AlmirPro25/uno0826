export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/40 p-6 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute inset-0 bg-grid-black/[0.02] dark:bg-grid-white/[0.02]" />
            <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-background to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-background to-transparent" />

            <div className="w-full max-w-md relative z-10">
                {children}
            </div>
        </div>
    );
}
