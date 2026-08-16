'use client';

import { useState } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Trophy,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Share2,
  Heart,
  MoreVertical,
} from 'lucide-react';
import { DeclineInvitationModal } from '@/components/domain/DeclineInvitationModal';
import { Link } from '@/i18n/routing';

export interface Team {
  id: string;
  name: string;
  members: number;
  status: 'confirmed' | 'pending';
}

export interface EventDetailsViewProps {
  eventId?: string;
}

import { useMyEvents } from '@/repositories/eventsRepository';

export function EventDetailsView({ eventId }: EventDetailsViewProps) {
  const [isDeclineOpen, setIsDeclineOpen] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const { data: dbEvents = [] } = useMyEvents();
  const dbEvent = dbEvents.find((e: any) => (e.id || e.eventId) === eventId) || dbEvents[0];

  const event = {
    id: dbEvent?.id || dbEvent?.eventId || eventId || '',
    title: dbEvent?.eventName || dbEvent?.EventName || 'Sự kiện thi đấu',
    description: (dbEvent as any)?.tagline || (dbEvent as any)?.description || '',
    longDescription: (dbEvent as any)?.description || (dbEvent as any)?.tagline || '',
    startDate: dbEvent?.startDate ? new Date(dbEvent.startDate).toLocaleDateString('vi-VN') : '',
    endDate: dbEvent?.endDate ? new Date(dbEvent.endDate).toLocaleDateString('vi-VN') : '',
    location: (dbEvent as any)?.location || 'FPT University',
    maxTeams: dbEvent?.maxTeams || 50,
    registeredTeams: (dbEvent as any)?.teamCount || (dbEvent as any)?.teamsCount || 0,
    status: 'upcoming',
    prizes: {
      first: (dbEvent as any)?.totalPrizeVnd ? `${new Intl.NumberFormat('vi-VN').format((dbEvent as any).totalPrizeVnd)} VNĐ` : '0 VNĐ',
      second: '0 VNĐ',
      third: '0 VNĐ',
    },
    categories: ((dbEvent as any)?.tracks || []).length > 0 ? (dbEvent as any).tracks : ['Hạng mục chuyên môn'],
    schedule: [] as Array<{ date: string; time: string; event: string }>,
    teams: [] as Array<{ id: string; name: string; members: number; status: 'confirmed' | 'pending' }>,
  };

  const handleJoin = async () => {
    setIsJoining(true);
    try {
      // TODO: Call join event API
      console.log('Joining event:', eventId);
      setTimeout(() => {
        setIsJoining(false);
      }, 2000);
    } catch (err) {
      console.error('Error joining event:', err);
      setIsJoining(false);
    }
  };

  const handleDecline = async (reason: string) => {
    try {
      // TODO: Call decline API
      console.log('Declined event with reason:', reason);
      setIsDeclineOpen(false);
    } catch (err) {
      console.error('Error declining event:', err);
    }
  };

  const daysLeft = Math.ceil(
    (new Date(event.startDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <main className="min-h-screen bg-[#0a0f1d] text-[#f1f5f9] antialiased">
      {/* Hexagon Pattern Background */}
      <div
        className="absolute inset-0 top-0 opacity-3"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='104' viewBox='0 0 60 104' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 17.3V51.9L30 69.2L0 51.9V17.3Z' fill='none' stroke='%232dd4bf' stroke-width='1'/%3E%3Cpath d='M30 69.2L60 86.5V104M30 69.2L0 86.5V104M30 -17.3V0' fill='none' stroke='%232dd4bf' stroke-width='1'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
        }}
      />

      {/* Gradient Overlays */}
      <div className="absolute inset-0 top-0 bg-gradient-to-b from-[#0a0f1d]/90 via-transparent to-[#0a0f1d] pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        {/* Back Button */}
        <Link
          href="/events"
          className="inline-flex items-center gap-2 text-[#94a3b8] hover:text-[#2dd4bf] transition-colors mb-8 font-mono text-sm uppercase tracking-wide"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại danh sách
        </Link>

        {/* Header Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Bar */}
            <div className="hud-clipped p-[1px] bg-gradient-to-r from-[#2dd4bf] to-[#38bdf8]">
              <div className="hud-clipped bg-[#111a2e] px-6 py-4 flex items-center gap-3">
                {event.status === 'upcoming' && (
                  <>
                    <AlertCircle className="w-5 h-5 text-[#38bdf8]" />
                    <div>
                      <p className="text-xs font-mono uppercase tracking-widest text-[#94a3b8]">
                        TRẠNG THÁI
                      </p>
                      <p className="text-lg font-bold text-[#38bdf8]">
                        SẮP DIỄN RA • {daysLeft} NGÀY NỮA
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Title */}
            <div>
              <h1 className="text-4xl md:text-5xl font-display font-bold text-[#f1f5f9] uppercase tracking-widest mb-4">
                {event.title}
              </h1>
              <p className="text-lg text-[#94a3b8] leading-relaxed">
                {event.description}
              </p>
              <p className="text-base text-[#94a3b8] leading-relaxed mt-4">
                {event.longDescription}
              </p>
            </div>

            {/* Key Info Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: Calendar, label: 'Ngày bắt đầu', value: event.startDate },
                { icon: MapPin, label: 'Địa điểm', value: event.location },
                { icon: Trophy, label: 'Tổng giải', value: '1 tỷ VNĐ' },
                { icon: Users, label: 'Đội tham gia', value: `${event.registeredTeams}/${event.maxTeams}` },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="hud-clipped p-[1px] bg-gradient-to-br from-[#2dd4bf] to-[#38bdf8]">
                    <div className="hud-clipped bg-[#111a2e] p-4 space-y-2">
                      <Icon className="w-5 h-5 text-[#2dd4bf]" />
                      <p className="text-xs text-[#94a3b8] font-mono uppercase tracking-widest">
                        {item.label}
                      </p>
                      <p className="text-base font-bold text-[#f1f5f9]">{item.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Categories */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-[#2dd4bf] uppercase tracking-widest font-mono">
                Hạng mục tham gia
              </h3>
              <div className="flex flex-wrap gap-2">
                {event.categories.map((cat: any, i: number) => (
                  <div key={i} className="hud-clipped px-4 py-2 bg-[#1e293b] border border-[#2dd4bf]/30 text-sm font-mono text-[#2dd4bf]">
                    ▸ {cat}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Prizes Card */}
            <div className="hud-clipped p-[2px] bg-gradient-to-br from-[#fbbf24] to-[#f59e0b]">
              <div className="hud-clipped bg-[#111a2e] p-6 space-y-4">
                <h3 className="text-xl font-bold text-[#fbbf24] uppercase tracking-widest">
                  Giải Thưởng
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#94a3b8] font-mono">🥇 Hạng 1</span>
                    <span className="text-lg font-bold text-[#fbbf24]">{event.prizes.first}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#94a3b8] font-mono">🥈 Hạng 2</span>
                    <span className="text-lg font-bold text-[#94a3b8]">{event.prizes.second}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#94a3b8] font-mono">🥉 Hạng 3</span>
                    <span className="text-lg font-bold text-[#94a3b8]">{event.prizes.third}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleJoin}
                disabled={isJoining}
                className="hud-clipped w-full bg-[#2dd4bf] hover:bg-[#26c0a8] disabled:bg-[#0f4f46] text-[#0a0f1d] py-3 px-4 font-display font-bold text-lg uppercase tracking-wider transition-all group relative overflow-hidden disabled:cursor-not-allowed"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isJoining ? 'ĐANG ĐĂNG KÝ...' : '✓ THAM GIA'}
                </span>
                <div className="absolute inset-0 h-full w-full bg-gradient-to-b from-transparent via-white/20 to-transparent -translate-y-full group-hover:animate-[scan_1.5s_ease-in-out_infinite]"></div>
              </button>

              <button
                onClick={() => setIsDeclineOpen(true)}
                className="hud-clipped-reverse w-full bg-transparent hover:bg-[#1e293b]/50 text-[#f1f5f9] border border-[#24344d] hover:border-[#f87171]/50 py-3 px-4 font-display font-bold text-sm uppercase tracking-wider transition-all"
              >
                ✕ TỪ CHỐI
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => setIsSaved(!isSaved)}
                  className="hud-clipped flex-1 bg-transparent hover:bg-[#1e293b]/50 text-[#2dd4bf] border border-[#2dd4bf]/50 hover:border-[#2dd4bf] py-2 px-4 font-display font-bold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                >
                  <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                  {isSaved ? 'LƯU' : 'LƯU'}
                </button>
                <button className="hud-clipped flex-1 bg-transparent hover:bg-[#1e293b]/50 text-[#2dd4bf] border border-[#2dd4bf]/50 hover:border-[#2dd4bf] py-2 px-4 font-display font-bold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2">
                  <Share2 className="w-4 h-4" />
                  CHIA SẺ
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Schedule Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-[#2dd4bf] uppercase tracking-widest mb-6 font-display">
            Lịch trình sự kiện
          </h2>
          <div className="space-y-3">
            {event.schedule.map((item, i) => (
              <div key={i} className="hud-clipped p-[1px] bg-gradient-to-r from-[#2dd4bf]/50 to-[#38bdf8]/50">
                <div className="hud-clipped bg-[#111a2e] px-6 py-4 flex items-center gap-4">
                  <Clock className="w-5 h-5 text-[#2dd4bf] flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-mono text-xs text-[#94a3b8] uppercase tracking-widest">
                      {item.date} • {item.time}
                    </p>
                    <p className="text-lg font-bold text-[#f1f5f9]">{item.event}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Teams Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-[#2dd4bf] uppercase tracking-widest mb-6 font-display">
            Đội tham gia ({event.teams.length}/{event.maxTeams})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {event.teams.map((team) => (
              <div key={team.id} className="hud-clipped p-[1px] bg-gradient-to-br from-[#2dd4bf] to-[#38bdf8]">
                <div className="hud-clipped bg-[#111a2e] p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {team.status === 'confirmed' ? (
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-yellow-400" />
                    )}
                    <div>
                      <p className="font-bold text-[#f1f5f9]">{team.name}</p>
                      <p className="text-xs text-[#94a3b8] font-mono">
                        {team.members} thành viên • {team.status === 'confirmed' ? 'Xác nhận' : 'Chờ xác nhận'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Decorative Corner Elements */}
        <div className="fixed top-4 left-4 w-16 h-16 border-t-2 border-l-2 border-[#2dd4bf]/30 pointer-events-none hidden md:block" />
        <div className="fixed bottom-4 right-4 w-16 h-16 border-b-2 border-r-2 border-[#2dd4bf]/30 pointer-events-none hidden md:block" />
      </div>

      {/* Decline Modal */}
      <DeclineInvitationModal
        isOpen={isDeclineOpen}
        eventTitle={event.title}
        onConfirm={handleDecline}
        onCancel={() => setIsDeclineOpen(false)}
      />

      {/* Global Styles */}
      <style>{`
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }

        .hud-clipped {
          clip-path: polygon(
            15px 0,
            100% 0,
            100% calc(100% - 15px),
            calc(100% - 15px) 100%,
            0 100%,
            0 15px
          );
        }

        .hud-clipped-reverse {
          clip-path: polygon(
            0 0,
            calc(100% - 15px) 0,
            100% 15px,
            100% 100%,
            15px 100%,
            0 calc(100% - 15px)
          );
        }

        .sci-input {
          background-color: rgba(15, 24, 38, 0.7);
          border: 1px solid #1e293b;
          transition: all 0.3s ease;
        }

        .sci-input:focus {
          border-color: #2dd4bf;
          box-shadow: 0 0 10px rgba(45, 212, 191, 0.2);
          outline: none;
        }
      `}</style>
    </main>
  );
}

export default EventDetailsView;
