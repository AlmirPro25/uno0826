import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function DocsPage() {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h1 className="text-4xl font-bold tracking-tight">Introduction</h1>
                <p className="text-xl text-muted-foreground">
                    Learn how PROST-QS governs the flow of intelligence in your systems.
                </p>
            </div>

            <div className="prose prose-zinc dark:prose-invert max-w-none">
                <p>
                    PROST-QS is a <strong>Cognitive Governance Platform</strong>. Unlike traditional API gateways that just proxy requests,
                    PROST-QS acts as a sovereign kernel for your application's logic, enforcing rules, auditing decisions, and managing billing
                    before any code executes.
                </p>

                <h3>Why PROST-QS?</h3>
                <ul>
                    <li><strong>Sovereign Identity</strong>: Every app and agent has a cryptographic identity.</li>
                    <li><strong>Audit Trails</strong>: Immutable logs of every decision and event.</li>
                    <li><strong>Economic Kernel</strong>: Built-in billing for any event type.</li>
                </ul>

                <div className="not-prose my-8 grid grid-cols-1 gap-6 md:grid-cols-2">
                    <Link href="/docs/quickstart" className="group relative rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md">
                        <h3 className="font-semibold group-hover:text-primary">Quickstart</h3>
                        <p className="mt-2 text-sm text-muted-foreground"> Integrate PROST-QS into your Next.js or Go application in minutes.</p>
                        <div className="absolute bottom-6 right-6 opacity-0 transition-opacity group-hover:opacity-100">
                            <ArrowRight className="h-4 w-4" />
                        </div>
                    </Link>
                    <Link href="/docs/api/v1" className="group relative rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md">
                        <h3 className="font-semibold group-hover:text-primary">API Reference</h3>
                        <p className="mt-2 text-sm text-muted-foreground"> Explore the REST API endpoints and data models.</p>
                        <div className="absolute bottom-6 right-6 opacity-0 transition-opacity group-hover:opacity-100">
                            <ArrowRight className="h-4 w-4" />
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
}
