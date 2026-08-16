'use client';

import { useState } from 'react';
import { Search, Filter, Zap, User } from 'lucide-react';
import { AssignedEventsGrid, AssignedEvent } from '@/components/domain/EventAssignmentCard';
import { useRouter } from 'next/navigation';

import { useMyEvents } from '@/repositories/eventsRepository';

export function AssignedEventsView() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in-progress' | 'completed'>('all');

  const { data: dbEvents = [], isLoading } = useMyEvents();

  const assignedEventsList: AssignedEvent[] = dbEvents.map((e: any) => ({
    id: e.id || e.eventId || '',
    title: e.eventName || e.EventName || 'Sự kiện được phân công',
    description: e.tagline || e.description || '',
    eventDate: e.startDate ? new Date(e.startDate).toLocaleDateString('vi-VN') : '',
    totalTeams: e.teamCount || e.teamsCount || 0,
    scoredTeams: 0,
    status: 'in-progress',
    role: e.role || 'Giám Khảo / Cố Vấn',
    deadline: e.endDate ? new Date(e.endDate).toLocaleDateString('vi-VN') : '',
  }));

  // Filter events
  const filteredEvents = assignedEventsList.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.role.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || event.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: assignedEventsList.length,
    pending: assignedEventsList.filter(e => e.status === 'pending').length,
    inProgress: assignedEventsList.filter(e => e.status === 'in-progress').length,
    completed: assignedEventsList.filter(e => e.status === 'completed').length,
  };

  const handleViewEvent = (eventId: string) => {
    router.push(`/judge/events/${eventId}/categories`);
  };

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
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8 md:py-16">
        {/* Header Section */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <User className="w-6 h-6 text-[#2dd4bf]" />
            <h1 className="text-4xl md:text-5xl font-display font-bold text-[#2dd4bf] uppercase tracking-widest">
              Sự kiện được phân công
            </h1>
          </div>
          <p className="text-lg text-[#94a3b8] font-mono">
            Quản lý các sự kiện và hạng mục mà bạn được phân công chấm điểm
          </p>
        </div>

        {/* Search and Filter Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          {/* Search Bar */}
          <div className="hud-clipped p-[1px] bg-gradient-to-r from-[#2dd4bf] to-[#38bdf8]">
            <div className="hud-clipped bg-[#111a2e] px-4 py-3 flex items-center gap-3">
              <Search className="w-5 h-5 text-[#2dd4bf]/50" />
              <input
                type="text"
                placeholder="Tìm kiếm sự kiện hoặc vai trò..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-[#f1f5f9] placeholder-[#475569] focus:outline-none font-mono text-sm"
              />
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 flex-wrap">
            {(['all', 'pending', 'in-progress', 'completed'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`hud-clipped px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider transition-all ${
                  statusFilter === status
                    ? 'bg-[#2dd4bf] text-[#0a0f1d] border border-[#2dd4bf]'
                    : 'bg-transparent text-[#2dd4bf] border border-[#2dd4bf]/50 hover:border-[#2dd4bf]'
                }`}
              >
                {status === 'all' && '• TẤT CẢ'}
                {status === 'pending' && '◆ CHỜ'}
                {status === 'in-progress' && '● ĐANG DIỄN RA'}
                {status === 'completed' && '○ HOÀN THÀNH'}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {[
            { label: 'Tổng sự kiện', value: stats.total, color: 'text-[#2dd4bf]' },
            { label: 'Chờ duyệt', value: stats.pending, color: 'text-[#f59e0b]' },
            { label: 'Đang chấm', value: stats.inProgress, color: 'text-[#38bdf8]' },
            { label: 'Hoàn thành', value: stats.completed, color: 'text-[#34d399]' },
          ].map((stat, i) => (
            <div key={i} className="hud-clipped p-[1px] bg-gradient-to-br from-[#2dd4bf] to-[#38bdf8]">
              <div className="hud-clipped bg-[#111a2e] p-4 text-center">
                <div className={`text-2xl font-bold ${stat.color} mb-1`}>{stat.value}</div>
                <div className="text-xs text-[#94a3b8] font-mono uppercase tracking-wider">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Events Grid */}
        <AssignedEventsGrid 
          events={filteredEvents}
          onView={handleViewEvent}
          isLoading={isLoading}
        />
      </div>

      {/* Decorative Corner Elements */}
      <div className="fixed top-4 left-4 w-16 h-16 border-t-2 border-l-2 border-[#2dd4bf]/30 pointer-events-none hidden md:block" />
      <div className="fixed bottom-4 right-4 w-16 h-16 border-b-2 border-r-2 border-[#2dd4bf]/30 pointer-events-none hidden md:block" />

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
      `}</style>
    </main>
  );
}

export default AssignedEventsView;
