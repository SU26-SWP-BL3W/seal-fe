"use client";

import { Link } from "@/i18n/routing";
import { useLandingPreviewViewModel } from "@/viewModels/useLandingPreviewViewModel";
import { useCountdown } from "@/lib/useCountdown";

export function LandingPortalView() {
  const { latestEvent } = useLandingPreviewViewModel();

  // Lay deadline cua su kien gan nhat hoac fallback 48 ngay
  const targetDeadline = latestEvent?.rounds?.[0]?.submissionDeadline || latestEvent?.rounds?.[0]?.endDate || "";
  const countdown = useCountdown(targetDeadline || new Date(Date.now() + 48 * 24 * 60 * 60 * 1000).toISOString());

  return (
    <div className="hex-bg min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center relative overflow-hidden py-12 px-4 selection:bg-[#00d9ff] selection:text-[#003641]">
      {/* Ambient Scanlines */}
      <div className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(transparent_50%,rgba(0,0,0,1)_50%)] bg-[length:100%_4px] z-10" />
      <div className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(90deg,transparent_50%,rgba(0,0,0,1)_50%)] bg-[length:4px_100%] z-10" />

      <main className="relative z-20 flex flex-col items-center max-w-4xl w-full">
        {/* ── Central Command Deck Portal Box (Stitch P1) ── */}
        <div className="relative bg-[#080f11]/90 backdrop-blur-md border border-[#3c494d]/40 p-8 md:p-12 flex flex-col items-center text-center w-full max-w-2xl glow-box">
          {/* 4 Cyber Corner Accents */}
          <div className="corner-accent-tl" />
          <div className="corner-accent-tr" />
          <div className="corner-accent-bl" />
          <div className="corner-accent-br" />

          {/* SEAL Shield Logo */}
          <div className="mb-6 relative group cursor-crosshair">
            <div className="absolute inset-0 bg-[#00d9ff] blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 rounded-full" />
            <svg
              className="relative z-10 transition-transform duration-300 group-hover:scale-105"
              fill="none"
              height="120"
              viewBox="0 0 120 140"
              width="100"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M60 2L110 20V60C110 95 85 125 60 138C35 125 10 95 10 60V20L60 2Z"
                fill="#080f11"
                stroke="#00d9ff"
                strokeLinejoin="round"
                strokeWidth="3"
              />
              <path
                d="M60 15L95 28V60C95 85 75 110 60 120C45 110 25 85 25 60V28L60 15Z"
                fill="none"
                stroke="#005b6c"
                strokeLinejoin="round"
                strokeWidth="2"
              />
              <path
                d="M45 45L75 75M75 45L45 75"
                stroke="#00d9ff"
                strokeLinecap="square"
                strokeWidth="4"
              />
              <circle cx="60" cy="60" fill="#080f11" r="8" stroke="#00d9ff" strokeWidth="2" />
            </svg>
          </div>

          {/* System Identifier */}
          <div className="font-display text-2xl md:text-3xl text-[#00d9ff] glow-text tracking-[0.2em] mb-1 font-bold uppercase">
            SEAL_HACK_v2.0
          </div>
          <div className="font-mono text-[11px] text-[#bbc9ce] mb-8 tracking-[0.3em] flex items-center gap-2 font-bold uppercase">
            <span className="w-8 h-px bg-[#3c494d]" />
            SECURE ACCESS TERMINAL
            <span className="w-8 h-px bg-[#3c494d]" />
          </div>

          {/* Countdown Panel */}
          <div className="bg-[#1a2123]/90 border-t border-[#00d9ff]/30 p-6 w-full mb-8 relative overflow-hidden hud-clipped">
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#00d9ff] to-transparent opacity-50" />
            <div className="font-mono text-[11px] text-[#bbc9ce] mb-3 opacity-80 tracking-wider">
              [ SYSTEM_STATUS: COUNTDOWN_INITIATED ]
            </div>
            <div className="font-mono text-3xl md:text-[42px] leading-none text-[#00d9ff] glow-text tracking-tight flex justify-center items-center gap-2 md:gap-4" suppressHydrationWarning>
              <div className="flex flex-col items-center">
                <span>{String(countdown.days).padStart(2, "0")}</span>
                <span className="font-mono text-[10px] text-[#bbc9ce]/60 mt-1 font-bold tracking-widest">DD</span>
              </div>
              <span className="opacity-50 pb-3">:</span>
              <div className="flex flex-col items-center">
                <span>{String(countdown.hours).padStart(2, "0")}</span>
                <span className="font-mono text-[10px] text-[#bbc9ce]/60 mt-1 font-bold tracking-widest">HH</span>
              </div>
              <span className="opacity-50 pb-3">:</span>
              <div className="flex flex-col items-center">
                <span>{String(countdown.minutes).padStart(2, "0")}</span>
                <span className="font-mono text-[10px] text-[#bbc9ce]/60 mt-1 font-bold tracking-widest">MM</span>
              </div>
              <span className="opacity-50 pb-3">:</span>
              <div className="flex flex-col items-center">
                <span>{String(countdown.seconds).padStart(2, "0")}</span>
                <span className="font-mono text-[10px] text-[#bbc9ce]/60 mt-1 font-bold tracking-widest">SS</span>
              </div>
            </div>
          </div>

          {/* Main Action CTAs */}
          <div className="flex flex-col gap-3 w-full max-w-sm">
            <Link href="/login" className="w-full">
              <button className="w-full bg-[#00d9ff] text-[#080f11] font-display text-lg font-bold py-3.5 px-6 rounded-[12px] rounded-br-none hover:bg-[#aeecff] transition-all flex items-center justify-center gap-2 uppercase tracking-wider relative overflow-hidden group shadow-[0_0_20px_rgba(0,217,255,0.3)]">
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                // LOGIN &gt;
              </button>
            </Link>
            <Link href="/register" className="w-full">
              <button className="w-full border border-[#00d9ff]/50 text-[#00d9ff] font-mono text-sm py-3 px-6 rounded hover:bg-[#00d9ff]/10 hover:border-[#00d9ff] transition-all flex items-center justify-center gap-2 uppercase tracking-wider">
                [ Register Identity ]
              </button>
            </Link>
            <Link href="/events" className="w-full">
              <button className="w-full border border-[#3c494d] text-[#bbc9ce] hover:text-white font-mono text-xs py-2.5 px-6 rounded hover:bg-[#1a2123] transition-all flex items-center justify-center gap-2 uppercase tracking-wider">
                &gt;&gt; Khám Phá Đấu Trường Sự Kiện
              </button>
            </Link>
          </div>

          {/* Quick Role Protocol Bar */}
          <div className="mt-8 pt-4 border-t border-[#3c494d]/40 flex flex-wrap items-center justify-center gap-2 font-mono text-[11px] text-[#bbc9ce] w-full">
            <span className="text-[#859398] font-semibold">TRUY CẬP NHANH:</span>
            <Link href="/my-team" className="text-[#38bdf8] hover:underline px-1.5 py-0.5 border border-[#38bdf8]/30 bg-[#080f11]">
              [ ĐỘI THI ]
            </Link>
            <Link href="/judge/tracks" className="text-[#fbbf24] hover:underline px-1.5 py-0.5 border border-[#fbbf24]/30 bg-[#080f11]">
              [ GIÁM KHẢO ]
            </Link>
            <Link href="/mentor/submissions" className="text-[#34d399] hover:underline px-1.5 py-0.5 border border-[#34d399]/30 bg-[#080f11]">
              [ CỐ VẤN ]
            </Link>
            <Link href="/coordinator/dashboard" className="text-[#c084fc] hover:underline px-1.5 py-0.5 border border-[#c084fc]/30 bg-[#080f11]">
              [ BAN TỔ CHỨC ]
            </Link>
          </div>
        </div>

        {/* Footer Meta Data */}
        <div className="mt-6 flex justify-between w-full max-w-2xl font-mono text-[#bbc9ce]/60 text-[11px] px-2">
          <span>NODE: ALPHA-7</span>
          <span>ENCRYPTION: AES-256-GCM</span>
          <span>SYS.VER: 9.4.1</span>
        </div>
      </main>
    </div>
  );
}
