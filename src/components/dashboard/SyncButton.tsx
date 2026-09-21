/**
 * src/components/dashboard/SyncButton.tsx
 * Client Component — dispara la ingesta de correos vía POST /api/ingest.
 */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, CheckCircle, AlertCircle } from "lucide-react";

type SyncState = "idle" | "loading" | "success" | "error";

export default function SyncButton() {
    const router = useRouter();
    const [state, setState] = useState<SyncState>("idle");
    const [summary, setSummary] = useState<string | null>(null);

    async function handleSync() {
        setState("loading");
        setSummary(null);

        try {
            const res = await fetch("/api/ingest", { method: "POST" });
            const data = await res.json() as {
                summary?: { saved: number; duplicates: number; errors: { message: string }[] };
                error?: string;
            };

            if (!res.ok) {
                throw new Error(data.error ?? "Error en la sincronización");
            }

            const s = data.summary!;
            setSummary(
                `${s.saved} nuevas · ${s.duplicates} duplicadas · ${s.errors.length} errores`
            );
            setState("success");

            // Refrescar los Server Components del dashboard
            router.refresh();

            // Volver a idle tras 4 segundos
            setTimeout(() => {
                setState("idle");
                setSummary(null);
            }, 4000);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Error desconocido";
            setSummary(message);
            setState("error");

            setTimeout(() => {
                setState("idle");
                setSummary(null);
            }, 5000);
        }
    }

    const isLoading = state === "loading";

    return (
        <div className="flex items-center gap-3">
            <button
                onClick={handleSync}
                disabled={isLoading}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                {isLoading ? "Sincronizando..." : "Sincronizar correos"}
            </button>

            {/* Feedback de resultado */}
            {state === "success" && summary && (
                <div className="flex items-center gap-1.5 text-sm text-emerald-600">
                    <CheckCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{summary}</span>
                </div>
            )}
            {state === "error" && summary && (
                <div className="flex items-center gap-1.5 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{summary}</span>
                </div>
            )}
        </div>
    );
}