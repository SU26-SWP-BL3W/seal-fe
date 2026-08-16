'use client';

import { Calendar, Users, MapPin, ArrowRight, Trophy, Zap } from 'lucide-react';

export interface Event {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  teams: number;
  maxTeams: number;
  status: 'upcoming' | 'ongoing' | 'closed';
  prizes: string;
  image?: string;
}

export interface EventCardProps {
  event: Event;
  onJoin?: (eventId: string) => void;
}

export function EventCard({ event, onJoin }: EventCardProps) {
  const statusColors = {
    upcoming: { bg: 'bg-blue-500/10', border: 'border-blue-500/50', text: 'text-blue-400', label: 'ĐANG CHỜ' },
    ongoing: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/50', text: 'text-cyan-400', label: 'ĐANG DIỄN RA' },
    closed: { bg: 'bg-gray-500/10', border: 'border-gray-500/50', text: 'text-gray-400', label: 'ĐÃ ĐÓNG' },
  };

  const statusConfig = statusColors[event.status];
  const isFull = event.teams >= event.maxTeams;

  return (
    <div className="hud-clipped p-[1px] bg-gradient-to-br from-[#2dd4bf] to-[#38bdf8] group hover:shadow-[0_0_20px_rgba(45,212,191,0.3)] transition-all duration-300 h-full">
      <div className={`hud-clipped bg-[#111a2e] p-6 h-full flex flex-col gap-4 ${statusConfig.bg} border ${statusConfig.border}`}>
        
        {/* Header with Status Badge */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-[#f1f5f9] uppercase tracking-wide line-clamp-2 group-hover:text-[#2dd4bf] transition-colors">
              {event.title}
            </h3>
          </div>
          <div className={`px-3 py-1 rounded-sm text-xs font-mono font-bold uppercase tracking-wider whitespace-nowrap ${statusConfig.text}`}>
            {statusConfig.label}
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-[#94a3b8] line-clamp-2">
          {event.description}
        </p>

        {/* Dates */}
        <div className="flex items-center gap-2 text-xs text-[#94a3b8] font-mono">
          <Calendar className="w-4 h-4 text-[#2dd4bf] flex-shrink-0" />
          <span>{event.startDate} - {event.endDate}</span>
        </div>

        {/* Location */}
        <div className="flex items-center gap-2 text-xs text-[#94a3b8] font-mono">
          <MapPin className="w-4 h-4 text-[#2dd4bf] flex-shrink-0" />
          <span>{event.location}</span>
        </div>

        {/* Teams Info */}
        <div className="flex items-center justify-between pt-2 border-t border-[#24344d]">
          <div className="flex items-center gap-2 text-sm text-[#2dd4bf] font-mono">
            <Users className="w-4 h-4" />
            <span>{event.teams}/{event.maxTeams} đội</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-[#fbbf24] font-mono">
            <Trophy className="w-4 h-4" />
            {event.prizes}
          </div>
        </div>

        {/* Join Button */}
        <button
          onClick={() => onJoin?.(event.id)}
          disabled={isFull || event.status === 'closed'}
          className="hud-clipped w-full bg-[#2dd4bf] hover:bg-[#26c0a8] disabled:bg-[#0f4f46] text-[#0a0f1d] py-2 px-4 font-display font-bold text-sm uppercase tracking-wider transition-all duration-300 group/btn relative overflow-hidden disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-auto"
        >
          <span className="relative z-10 flex items-center gap-2">
            {isFull ? 'ĐẦY CHỖ' : event.status === 'closed' ? 'ĐÃ ĐÓNG' : 'THAM GIA'}
            {!isFull && event.status !== 'closed' && <ArrowRight className="w-4 h-4" />}
          </span>
          <div className="absolute inset-0 h-full w-full bg-gradient-to-b from-transparent via-white/20 to-transparent -translate-y-full group-hover/btn:animate-[scan_1.5s_ease-in-out_infinite]"></div>
        </button>
      </div>
    </div>
  );
}

export interface EventsGridProps {
  events: Event[];
  onJoin?: (eventId: string) => void;
  isLoading?: boolean;
}

export function EventsGrid({ events, onJoin, isLoading }: EventsGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="hud-clipped bg-[#111a2e]/50 border border-[#24344d] p-6 h-80 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4 opacity-50">∅</div>
        <h3 className="text-xl font-bold text-[#94a3b8] uppercase mb-2">Không có sự kiện nào</h3>
        <p className="text-sm text-[#475569] font-mono">Kiểm tra lại sau hoặc thay đổi bộ lọc của bạn</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {events.map((event) => (
        <EventCard 
          key={event.id} 
          event={event} 
          onJoin={onJoin}
        />
      ))}
    </div>
  );
}

export default EventCard;
