'use client';

import { useState } from 'react';
import { Search, Filter, Zap } from 'lucide-react';
import { EventsGrid, Event } from '@/components/domain/EventCard';

export function EventsListView() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'upcoming' | 'ongoing' | 'closed'>('all');
  const [isLoading, setIsLoading] = useState(false);

  // Mock data - replace with API call
  const mockEvents: Event[] = [
    {
      id: '1',
      title: 'SEAL Hackathon 2026',
      description: 'Cuộc thi lập trình quy mô toàn quốc với giải thưởng hơn 1 tỷ đồng',
      startDate: '01/09/2026',
      endDate: '03/09/2026',
      location: 'TP. Hồ Chí Minh',
      teams: 45,
      maxTeams: 50,
      status: 'upcoming',
      prizes: '1 tỷ VNĐ',
    },
    {
      id: '2',
      title: 'Innovation Summit 2026',
      description: 'Sự kiện kết nối các startup và nhà đầu tư hàng đầu',
      startDate: '15/08/2026',
      endDate: '17/08/2026',
      location: 'Hà Nội',
      teams: 32,
      maxTeams: 40,
      status: 'ongoing',
      prizes: '500M VNĐ',
    },
    {
      id: '3',
      title: 'Code Challenge 2026',
      description: 'Thách thức lập trình với các bài toán khó nhất năm',
      startDate: '01/07/2026',
      endDate: '05/07/2026',
      location: 'Online',
      teams: 150,
      maxTeams: 150,
      status: 'closed',
      prizes: '300M VNĐ',
    },
    {
      id: '4',
      title: 'AI & ML Bootcamp',
      description: 'Khóa học intensive về AI và Machine Learning',
      startDate: '10/09/2026',
      endDate: '15/09/2026',
      location: 'TP. Hồ Chí Minh',
      teams: 28,
      maxTeams: 35,
      status: 'upcoming',
      prizes: '200M VNĐ',
    },
    {
      id: '5',
      title: 'Web3 Developer Conference',
      description: 'Hội nghị về công nghệ Blockchain và Web3',
      startDate: '20/08/2026',
      endDate: '22/08/2026',
      location: 'Đà Nẵng',
      teams: 38,
      maxTeams: 50,
      status: 'upcoming',
      prizes: '400M VNĐ',
    },
    {
      id: '6',
      title: 'Cloud Computing Challenge',
      description: 'Cuộc thi thiết kế và triển khai hệ thống trên Cloud',
      startDate: '25/08/2026',
      endDate: '28/08/2026',
      location: 'Online',
      teams: 22,
      maxTeams: 30,
      status: 'upcoming',
      prizes: '350M VNĐ',
    },
  ];

  // Filter events
  const filteredEvents = mockEvents.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || event.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleJoin = (eventId: string) => {
    console.log('Join event:', eventId);
    // TODO: Implement join event logic
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
            <Zap className="w-6 h-6 text-[#2dd4bf]" />
            <h1 className="text-4xl md:text-5xl font-display font-bold text-[#2dd4bf] uppercase tracking-widest">
              Danh sách sự kiện
            </h1>
          </div>
          <p className="text-lg text-[#94a3b8] font-mono">
            Khám phá các cuộc thi hackathon và sự kiện công nghệ hàng đầu
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
                placeholder="Tìm kiếm sự kiện..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-[#f1f5f9] placeholder-[#475569] focus:outline-none font-mono text-sm"
              />
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 flex-wrap">
            {(['all', 'upcoming', 'ongoing', 'closed'] as const).map((status) => (
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
                {status === 'upcoming' && '◆ SẮP TỚI'}
                {status === 'ongoing' && '● ĐANG DIỄN RA'}
                {status === 'closed' && '○ ĐÃ ĐÓNG'}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {[
            { label: 'Tổng sự kiện', value: mockEvents.length, color: 'text-[#2dd4bf]' },
            { label: 'Sắp tới', value: mockEvents.filter(e => e.status === 'upcoming').length, color: 'text-[#38bdf8]' },
            { label: 'Đang diễn ra', value: mockEvents.filter(e => e.status === 'ongoing').length, color: 'text-[#34d399]' },
            { label: 'Tổng đội tham gia', value: mockEvents.reduce((sum, e) => sum + e.teams, 0), color: 'text-[#fbbf24]' },
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
        <EventsGrid 
          events={filteredEvents}
          onJoin={handleJoin}
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

export default EventsListView;
