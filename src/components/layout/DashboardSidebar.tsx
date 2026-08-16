"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Trophy,
  Users,
  FileCheck2,
  Scale,
  Award,
  Bell,
  Settings,
  Shield,
  GraduationCap,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui";

interface NavItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  roleBadge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Bảng điều khiển", href: "/dashboard", icon: LayoutDashboard },
  { label: "Sự kiện & Cuộc thi", href: "/events", icon: Trophy },
  { label: "Đội thi của tôi", href: "/my-team", icon: Users, roleBadge: "Team" },
  { label: "Bài nộp giải pháp", href: "/submissions", icon: FileCheck2 },
  { label: "Bàn chấm điểm", href: "/judge/scoring", icon: Scale, roleBadge: "Judge" },
  { label: "Góp ý & Hỗ trợ", href: "/mentor/guidance", icon: GraduationCap, roleBadge: "Mentor" },
  { label: "Bảng xếp hạng", href: "/leaderboard", icon: Award },
  { label: "Thông báo", href: "/notifications", icon: Bell },
  { label: "Quản trị hệ thống", href: "/admin", icon: Shield, roleBadge: "Admin" },
  { label: "Cài đặt tài khoản", href: "/profile", icon: Settings },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 flex-shrink-0 border-r border-slate-800/80 bg-slate-950/70 backdrop-blur-xl flex flex-col justify-between h-screen sticky top-0">
      {/* Brand Header */}
      <div>
        <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-800/60">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Sparkles className="h-5 w-5 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <div className="font-sans font-bold text-base tracking-tight text-white flex items-center gap-2">
              SEAL <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">v2.0</span>
            </div>
            <p className="text-[11px] font-medium text-slate-400">Hackathon Platform</p>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="p-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-cyan-500/10 text-cyan-400 font-semibold border border-cyan-500/20 shadow-sm"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-900/80"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`h-4 w-4 transition-colors ${
                      isActive ? "text-cyan-400" : "text-slate-400 group-hover:text-slate-200"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.roleBadge && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-800/90 text-slate-300 border border-slate-700/60">
                    {item.roleBadge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Quick Info */}
      <div className="p-4 border-t border-slate-800/60 bg-slate-900/40">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-600 p-[1.5px]">
            <div className="h-full w-full rounded-full bg-slate-950 flex items-center justify-center text-xs font-bold text-cyan-400">
              U
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-200 truncate">Thí sinh SEAL</p>
            <p className="text-[11px] text-slate-400 truncate">user@fpt.edu.vn</p>
          </div>
          <Badge tone="team">Team</Badge>
        </div>
      </div>
    </aside>
  );
}
