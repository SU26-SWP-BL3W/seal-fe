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
  Hexagon,
} from "lucide-react";
import { Badge } from "@/components/ui";

interface NavItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  roleBadge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: "BẢNG ĐIỀU KHIỂN", href: "/dashboard", icon: LayoutDashboard },
  { label: "SỰ KIỆN & GIẢI ĐẤU", href: "/events", icon: Trophy },
  { label: "KHÔNG GIAN ĐỘI THI", href: "/my-team", icon: Users, roleBadge: "[TEAM]" },
  { label: "BÀI NỘP GIẢI PHÁP", href: "/submissions", icon: FileCheck2 },
  { label: "BÀN CHẤM ĐIỂM", href: "/judge/scoring", icon: Scale, roleBadge: "[JUDGE]" },
  { label: "HẠNG MỤC CỐ VẤN", href: "/mentor/tracks", icon: GraduationCap, roleBadge: "[MENTOR]" },
  { label: "ĐỘI THI CỐ VẤN", href: "/mentor/teams", icon: Users, roleBadge: "[MENTOR]" },
  { label: "BÀI NỘP & GÓP Ý", href: "/mentor/submissions", icon: FileCheck2, roleBadge: "[MENTOR]" },
  { label: "BẢNG XẾP HẠNG", href: "/leaderboard", icon: Award },
  { label: "TRUNG TÂM THÔNG BÁO", href: "/notifications", icon: Bell },
  { label: "QUẢN TRỊ HỆ THỐNG", href: "/admin", icon: Shield, roleBadge: "[ADM]" },
  { label: "CÀI ĐẶT TÀI KHOẢN", href: "/profile", icon: Settings },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[260px] flex-shrink-0 border-r border-[var(--border-muted)] bg-[var(--bg-panel)] flex flex-col justify-between h-screen sticky top-0 z-20">
      {/* Brand Header */}
      <div>
        <div className="h-16 px-5 flex items-center gap-3 border-b border-[var(--border-muted)] bg-[var(--bg-base)]">
          <div className="h-9 w-9 hud-clipped bg-[var(--accent-primary)] flex items-center justify-center text-[var(--bg-base)] shadow-[0_0_12px_rgba(0,217,255,0.4)]">
            <Hexagon className="h-5 w-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="font-display font-bold text-base tracking-wider text-[var(--text-primary)] flex items-center gap-2">
              SEAL <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] border border-[var(--accent-primary)]/40">HUD v2.0</span>
            </div>
            <p className="text-[10px] font-mono text-[var(--text-muted)] tracking-widest uppercase">// COMMAND DECK</p>
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
                className={`group flex items-center justify-between px-3 py-2.5 font-mono text-xs font-bold tracking-wider uppercase transition-all duration-150 ${
                  isActive
                    ? "hud-clipped border-l-2 border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] shadow-[0_0_10px_rgba(0,217,255,0.15)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-input)]"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`h-4 w-4 transition-colors ${
                      isActive ? "text-[var(--accent-primary)]" : "text-[var(--text-muted)] group-hover:text-[var(--text-primary)]"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.roleBadge && (
                  <span className="text-[9px] font-mono font-bold px-1 py-0.5 rounded bg-[var(--bg-input)] text-[var(--text-muted)] border border-[var(--border-muted)]">
                    {item.roleBadge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Quick Info */}
      <div className="p-3 border-t border-[var(--border-muted)] bg-[var(--bg-base)]">
        <div className="flex items-center justify-between p-2 hud-clipped bg-[var(--bg-panel)] border border-[var(--border-muted)]">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-7 w-7 rounded bg-[var(--accent-team)]/20 border border-[var(--accent-team)]/40 flex items-center justify-center text-xs font-mono font-bold text-[var(--accent-team)]">
              US
            </div>
            <div className="min-w-0">
              <p className="text-xs font-mono font-bold text-[var(--text-primary)] truncate">NGUYỄN VĂN A</p>
              <p className="text-[10px] font-mono text-[var(--text-muted)] truncate">SE180000</p>
            </div>
          </div>
          <Badge tone="team">[LEAD]</Badge>
        </div>
      </div>
    </aside>
  );
}
