'use client';

import { useState } from 'react';
import { Search, Filter, Zap, User } from 'lucide-react';
import { AssignedEventsGrid, AssignedEvent } from '@/components/domain/EventAssignmentCard';
import { useRouter } from 'next/navigation';

export function AssignedEventsView() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in-progress' | 'completed'>('all');
  const [isLoading, setIsLoading] = useState(false);

  // Mock data - replace with API call
  const mockEvents: AssignedEvent[] = [
    {
      id: '1',
      title: 'SEAL Hackathon 2026',
      description: 'Chấm điểm các dự án Web Development trong cuộc thi lập trình quốc gia',
      eventDate: '01/09/2026',
      totalTeams: 15,
      scoredTeams: 12,
      status: 'in-progress',
      role: 'Judge - Web Development',
      deadline: '05/09/2026',
    },
    {
      id: '2',
      title: 'Innovation Summit 2026',
      description: 'Đánh giá các ý tưởng startup và mô hình kinh doanh',
      eventDate: '15/08/2026',
      totalTeams: 20,
      scoredTeams: 20,
      status: 'completed',
      role: 'Mentor - Startup',
      deadline: '17/08/2026',
    },
    {
      id: '3',
      title: 'Code Challenge 2026',
      description: 'Chấm điểm bài thi lập trình thuật toán',
      eventDate: '01/07/2026',
      totalTeams: 25,
      scoredTeams: 0,
      status: 'pending',
      role: 'Judge - Algorithm',
      deadline: '03/07/2026',
    },
    {
      id: '4',
      title: 'AI & ML Bootcamp',
      description: 'Kiểm tra và chấm điểm các bài tập AI/ML',
      eventDate: '10/09/2026',
      totalTeams: 30,
      scoredTeams: 18,
      status: 'in-progress',
      role: 'Mentor - AI/ML',
      deadline: '15/09/2026',
    },
    {
      id: '5',
      title: 'Web3 Developer Conference',
      description: 'Đánh giá các dự án Blockchain và Web3',
      eventDate: '20/08/2026',
      totalTeams: 12,
      scoredTeams: 5,
      status: 'in-progress',
      role: 'Judge - Blockchain',
      deadline: '22/08/2026',
    },
    {
      id: '6',
      title: 'Cloud Computing Challenge',
      description: 'Chấm điểm hệ thống triển khai trên Cloud',
      eventDate: '25/08/2026',
      totalTeams: 18,
      scoredTeams: 18,
      status: 'completed',
      role: 'Judge - Cloud',
      deadline: '28/08/2026',
    },
  ];

  // Filter events
  const filteredEvents = mockEvents.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.role.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || event.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: mockEvents.length,
    pending: mockEvents.filter(e => e.status === 'pending').length,
    inProgress: mockEvents.filter(e => e.status === 'in-progress').length,
    completed: mockEvents.filter(e => e.status === 'completed').length,
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
