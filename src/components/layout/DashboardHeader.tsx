"use client";

import { Bell, Clock, Search, Globe } from "lucide-react";
import { Badge, Button } from "@/components/ui";

export function DashboardHeader() {
  return (
    <header className="h-16 px-8 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-xl flex items-center justify-between sticky top-0 z-30">
      {/* Left: Search Bar & Live Status */}
      <div className="flex items-center gap-4 flex-1 max-w-lg">
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Tìm kiếm sự kiện, bài nộp, đội thi..."
            className="w-full rounded-xl border border-slate-800/90 bg-slate-900/60 pl-10 pr-4 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/20 transition-all"
          />
        </div>
      </div>

      {/* Right: Countdown, Notifications, Profile Actions */}
      <div className="flex items-center gap-3">
        {/* Countdown Timer Badge */}
        <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono font-semibold">
          <Clock className="h-3.5 w-3.5" />
          <span>Hạn nộp Vòng 1: 18h 45m</span>
        </div>

        {/* Status Indicator */}
        <Badge tone="success" dot>
          Hệ thống hoạt động
        </Badge>

        {/* Notifications Bell */}
        <Button variant="ghost" size="sm" className="relative p-2 h-9 w-9 rounded-xl">
          <Bell className="h-4 w-4 text-slate-300" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
        </Button>

        {/* Language Switcher */}
        <Button variant="ghost" size="sm" className="h-9 px-3 rounded-xl gap-1.5 text-xs text-slate-300">
          <Globe className="h-3.5 w-3.5 text-slate-400" />
          <span>VI</span>
        </Button>
      </div>
    </header>
  );
}
