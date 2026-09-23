"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createAdminTools } from "@/lib/webmcp/admin-tools";
import { registerAdminTools } from "@/lib/webmcp/lifecycle";
import type { ModelContext, ToolResult } from "@/lib/webmcp/types";
import type { WebMCPMode } from "@/lib/admin/mode";

declare global {
  interface Document { modelContext?: ModelContext }
}

type Status = "checking" | "unsupported" | "off" | "ready" | "error";

function confirmDeletion(message: string, signal?: AbortSignal): Promise<boolean> {
  if (signal?.aborted) return Promise.resolve(false);
  return Promise.resolve(window.confirm(message));
}

export function AdminWebMCPProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("checking");
  const [mode, setMode] = useState<WebMCPMode>("off");
  const [last, setLast] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const setup = async () => {
      if (!document.modelContext?.registerTool) { setStatus("unsupported"); return; }
      try {
        const response = await fetch("/api/admin/webmcp/capabilities", { cache: "no-store", signal: controller.signal });
        if (!response.ok) { setStatus("error"); return; }
        const capability = await response.json() as { mode: WebMCPMode };
        setMode(capability.mode);
        if (capability.mode === "off") { setStatus("off"); return; }
        const tools = createAdminTools({
          // Chromium requires Window as the receiver for fetch in some builds.
          fetch: window.fetch.bind(window),
          confirmDeletion,
          onChanged: topicId => {
            window.dispatchEvent(new CustomEvent("admin-data-changed", { detail: { topicId } }));
            router.refresh();
          },
          onResult: (name: string, result: ToolResult) => setLast(`${name}: ${result.ok ? "thành công" : result.error.code}`),
          onUnauthorized: () => router.push("/login"),
        }, capability.mode);
        await registerAdminTools(document.modelContext, tools, controller.signal);
        if (!controller.signal.aborted) setStatus("ready");
      } catch (error) {
        if (!controller.signal.aborted) { console.error("WebMCP registration failed", error); setStatus("error"); }
      }
    };
    void setup();
    return () => controller.abort();
  }, [router]);

  const label = status === "ready" ? `WebMCP ${mode}` : status === "unsupported" ? "WebMCP không hỗ trợ" : status === "off" ? "WebMCP đang tắt" : status === "error" ? "WebMCP lỗi" : "WebMCP đang kiểm tra";
  return <>
    <div className="border-b border-white/60 bg-white/50 px-4 py-1 text-center text-xs text-gray-500" title={last || label}>
      <span className={`mr-1 inline-block h-2 w-2 rounded-full ${status === "ready" ? "bg-emerald-500" : "bg-gray-300"}`} />
      {label}{last ? ` · ${last}` : ""}
    </div>
    {children}
  </>;
}
