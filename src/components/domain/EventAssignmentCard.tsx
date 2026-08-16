'use client';

import { Calendar, Users, CheckCircle2, AlertCircle, ArrowRight, Zap } from 'lucide-react';

export interface AssignedEvent {
  id: string;
  title: string;
  description: string;
  eventDate: string;
  totalTeams: number;
  scoredTeams: number;
  status: 'pending' | 'in-progress' | 'completed';
  role: string;
  deadline: string;
}

export interface EventAssignmentCardProps {
  event: AssignedEvent;
  onView?: (eventId: string) => void;
}

export function EventAssignmentCard({ event, onView }: EventAssignmentCardProps) {
  const statusConfig = {
    pending: { color: 'bg-yellow-500/10', border: 'border-yellow-500/50', text: 'text-yellow-400', label: 'CHỜ DUYỆT' },
    'in-progress': { color: 'bg-blue-500/10', border: 'border-blue-500/50', text: 'text-blue-400', label: 'ĐANG CHẤM' },
    completed: { color: 'bg-green-500/10', border: 'border-green-500/50', text: 'text-green-400', label: 'HOÀN THÀNH' },
  };

  const config = statusConfig[event.status];
  const progress = (event.scoredTeams / event.totalTeams) * 100;

  return (
    <div className="hud-clipped p-[1px] bg-gradient-to-br from-[#2dd4bf] to-[#38bdf8] group hover:shadow-[0_0_20px_rgba(45,212,191,0.3)] transition-all duration-300 h-full">
      <div className={`hud-clipped bg-[#111a2e] p-6 h-full flex flex-col gap-4 ${config.color} border ${config.border}`}>
        
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-[#f1f5f9] uppercase tracking-wide line-clamp-2 group-hover:text-[#2dd4bf] transition-colors">
              {event.title}
            </h3>
          </div>
          <div className={`px-3 py-1 rounded-sm text-xs font-mono font-bold uppercase tracking-wider whitespace-nowrap ${config.text}`}>
            {config.label}
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-[#94a3b8] line-clamp-2">
          {event.description}
        </p>

        {/* Role */}
        <div className="bg-[#0f172a]/50 px-3 py-2 rounded-sm border border-[#2dd4bf]/20">
          <p className="text-xs text-[#94a3b8] font-mono uppercase tracking-widest">Vai trò</p>
          <p className="text-sm font-bold text-[#2dd4bf] mt-1">{event.role}</p>
        </div>

        {/* Date & Deadline */}
        <div className="flex items-center gap-2 text-xs text-[#94a3b8] font-mono">
          <Calendar className="w-4 h-4 text-[#2dd4bf] flex-shrink-0" />
          <span>{event.eventDate} • Hạn: {event.deadline}</span>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2 pt-2 border-t border-[#24344d]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#94a3b8] font-mono">Tiến độ chấm điểm</span>
            <span className="text-sm font-bold text-[#2dd4bf]">{event.scoredTeams}/{event.totalTeams}</span>
          </div>
          <div className="w-full bg-[#0f172a] rounded-sm border border-[#24344d] overflow-hidden h-2">
            <div
              className="h-full bg-gradient-to-r from-[#2dd4bf] to-[#38bdf8] transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* View Button */}
        <button
          onClick={() => onView?.(event.id)}
          className="hud-clipped w-full bg-[#2dd4bf] hover:bg-[#26c0a8] text-[#0a0f1d] py-2 px-4 font-display font-bold text-sm uppercase tracking-wider transition-all duration-300 group/btn relative overflow-hidden flex items-center justify-center gap-2 mt-auto"
        >
          <span className="relative z-10 flex items-center gap-2">
            XEM CHI TIẾT <ArrowRight className="w-4 h-4" />
          </span>
          <div className="absolute inset-0 h-full w-full bg-gradient-to-b from-transparent via-white/20 to-transparent -translate-y-full group-hover/btn:animate-[scan_1.5s_ease-in-out_infinite]"></div>
        </button>
      </div>
    </div>
  );
}

export interface AssignedEventsGridProps {
  events: AssignedEvent[];
  onView?: (eventId: string) => void;
  isLoading?: boolean;
}

export function AssignedEventsGrid({ events, onView, isLoading }: AssignedEventsGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="hud-clipped bg-[#111a2e]/50 border border-[#24344d] p-6 h-96 animate-pulse"
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
        <p className="text-sm text-[#475569] font-mono">Hiện tại bạn chưa được phân công sự kiện nào</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {events.map((event) => (
        <EventAssignmentCard 
          key={event.id} 
          event={event} 
          onView={onView}
        />
      ))}
    </div>
  );
}

export default EventAssignmentCard;
