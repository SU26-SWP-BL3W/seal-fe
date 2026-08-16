"use client";

import { Bell, Clock, Search, Globe, ShieldAlert } from "lucide-react";
import { Badge, Button } from "@/components/ui";

export function DashboardHeader() {
  return (
    <header className="h-16 px-6 border-b border-[var(--border-muted)] bg-[var(--bg-base)] flex items-center justify-between sticky top-0 z-30">
      {/* Left: Tactical Search / Command Breadcrumb */}
      <div className="flex items-center gap-4 flex-1 max-w-lg">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="// TÌM KIẾM SỰ KIỆN, ĐỘI THI, BÀI NỘP..."
            className="w-full border border-[var(--border-muted)] bg-[var(--bg-input)] pl-9 pr-4 py-1.5 font-mono text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/50 focus:outline-none focus:border-[var(--accent-primary)] focus:shadow-[0_0_8px_rgba(0,217,255,0.2)] transition-all"
          />
        </div>
      </div>

      {/* Right: Top Status / Countdown Bar */}
      <div className="flex items-center gap-3">
        {/* Live Countdown Timer Badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 hud-clipped bg-[var(--accent-judge)]/10 border border-[var(--accent-judge)]/40 text-[var(--accent-judge)] font-mono text-xs font-bold">
          <Clock className="h-3.5 w-3.5" />
          <span>// ROUND 1 LOCKS IN: 18H 45M 20S</span>
        </div>

        {/* Tactical System State */}
        <Badge tone="success">
          <span className="hud-live-dot h-1.5 w-1.5 rounded-full bg-[var(--color-success)] inline-block mr-1" />
          ONLINE
        </Badge>

        {/* Notifications Bell */}
        <Button variant="ghost" className="relative p-2 h-8 w-8">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-[var(--accent-primary)]" />
        </Button>

        {/* Language Switcher */}
        <Button variant="ghost" className="h-8 px-2.5 gap-1 font-mono text-xs">
          <Globe className="h-3.5 w-3.5" />
          <span>[VI]</span>
        </Button>
      </div>
    </header>
  );
}
