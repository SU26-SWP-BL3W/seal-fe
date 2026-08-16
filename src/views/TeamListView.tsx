'use client';

import { useState } from 'react';
import { Users, ArrowLeft, Filter, Search, Star, CheckCircle2, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export interface TeamScoring {
  id: string;
  name: string;
  memberCount: number;
  status: 'pending' | 'scored' | 'submitted';
  score?: number;
  lastUpdated?: string;
}

export function TeamListView() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'scored' | 'submitted'>('all');
  const [isLoading, setIsLoading] = useState(false);

  // Mock data
  const mockTeams: TeamScoring[] = [
    { id: '1', name: 'Tech Innovators', memberCount: 5, status: 'scored', score: 92, lastUpdated: '16/08/2026 14:30' },
    { id: '2', name: 'Code Warriors', memberCount: 4, status: 'scored', score: 87, lastUpdated: '16/08/2026 13:45' },
    { id: '3', name: 'Digital Pioneers', memberCount: 5, status: 'pending' },
    { id: '4', name: 'AI Revolution', memberCount: 4, status: 'scored', score: 95, lastUpdated: '16/08/2026 15:00' },
    { id: '5', name: 'Cloud Masters', memberCount: 5, status: 'submitted', score: 88, lastUpdated: '16/08/2026 16:20' },
    { id: '6', name: 'Data Scientists', memberCount: 5, status: 'pending' },
    { id: '7', name: 'Mobile Apps Team', memberCount: 4, status: 'scored', score: 91, lastUpdated: '16/08/2026 11:00' },
    { id: '8', name: 'DevOps Elite', memberCount: 5, status: 'pending' },
  ];

  const filteredTeams = mockTeams.filter(team => {
    const matchesSearch = team.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || team.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: mockTeams.length,
    pending: mockTeams.filter(t => t.status === 'pending').length,
    scored: mockTeams.filter(t => t.status === 'scored').length,
    submitted: mockTeams.filter(t => t.status === 'submitted').length,
    averageScore: Math.round(
      mockTeams.filter(t => t.score).reduce((sum, t) => sum + (t.score || 0), 0) /
      mockTeams.filter(t => t.score).length
    ),
  };

  const handleScoreTeam = (teamId: string) => {
    router.push(`/judge/scoring/${teamId}`);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <AlertCircle className="w-5 h-5 text-yellow-400" />;
      case 'scored':
        return <CheckCircle2 className="w-5 h-5 text-blue-400" />;
      case 'submitted':
        return <Star className="w-5 h-5 text-green-400" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'CHỜ CHẤM';
      case 'scored':
        return 'ĐÃ CHẤM';
      case 'submitted':
        return 'ĐÃ GỬI';
      default:
        return '';
    }
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
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8 md:py-16">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-[#94a3b8] hover:text-[#2dd4bf] transition-colors mb-8 font-mono text-sm uppercase tracking-wide"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại hạng mục
        </button>

        {/* Header Section */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-6 h-6 text-[#2dd4bf]" />
            <h1 className="text-4xl md:text-5xl font-display font-bold text-[#2dd4bf] uppercase tracking-widest">
              Danh sách Đội
            </h1>
          </div>
          <p className="text-lg text-[#94a3b8] font-mono">
            Frontend Development • SEAL Hackathon 2026
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
                placeholder="Tìm kiếm đội..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-[#f1f5f9] placeholder-[#475569] focus:outline-none font-mono text-sm"
              />
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 flex-wrap">
            {(['all', 'pending', 'scored', 'submitted'] as const).map((status) => (
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
                {status === 'pending' && '◆ CHỜ CHẤM'}
                {status === 'scored' && '● ĐÃ CHẤM'}
                {status === 'submitted' && '○ ĐÃ GỬI'}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-12">
          {[
            { label: 'Tổng đội', value: stats.total, color: 'text-[#2dd4bf]' },
            { label: 'Chờ chấm', value: stats.pending, color: 'text-[#f59e0b]' },
            { label: 'Đã chấm', value: stats.scored, color: 'text-[#38bdf8]' },
            { label: 'Đã gửi', value: stats.submitted, color: 'text-[#34d399]' },
            { label: 'Trung bình', value: stats.averageScore, color: 'text-[#2dd4bf]' },
          ].map((stat, i) => (
            <div key={i} className="hud-clipped p-[1px] bg-gradient-to-br from-[#2dd4bf] to-[#38bdf8]">
              <div className="hud-clipped bg-[#111a2e] p-4 text-center">
                <div className={`text-2xl font-bold ${stat.color} mb-1`}>{stat.value}</div>
                <div className="text-xs text-[#94a3b8] font-mono uppercase tracking-wider">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Teams List */}
        <div className="space-y-3">
          {filteredTeams.map((team) => (
            <div key={team.id} className="hud-clipped p-[1px] bg-gradient-to-r from-[#2dd4bf] to-[#38bdf8]">
              <div className="hud-clipped bg-[#111a2e] px-6 py-4 flex items-center justify-between gap-4 hover:bg-[#141f31] transition-colors">
                <div className="flex items-center gap-4 flex-1">
                  {getStatusIcon(team.status)}
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-[#f1f5f9] uppercase tracking-wide">{team.name}</h3>
                    <p className="text-xs text-[#94a3b8] font-mono mt-1">
                      {team.memberCount} thành viên • {getStatusLabel(team.status)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {team.score !== undefined && (
                    <div className="text-right">
                      <div className="text-2xl font-bold text-[#fbbf24]">{team.score}</div>
                      <p className="text-xs text-[#94a3b8] font-mono">Điểm</p>
                    </div>
                  )}
                  {team.lastUpdated && (
                    <div className="text-xs text-[#94a3b8] font-mono text-right hidden md:block">
                      <p>Cập nhật</p>
                      <p>{team.lastUpdated}</p>
                    </div>
                  )}
                  <button
                    onClick={() => handleScoreTeam(team.id)}
                    className="hud-clipped px-4 py-2 bg-[#2dd4bf] hover:bg-[#26c0a8] text-[#0a0f1d] font-display font-bold text-sm uppercase tracking-wider transition-all whitespace-nowrap"
                  >
                    {team.status === 'pending' ? 'CHẤM' : 'SỬA'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredTeams.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4 opacity-50">∅</div>
            <h3 className="text-xl font-bold text-[#94a3b8] uppercase mb-2">Không có đội nào</h3>
            <p className="text-sm text-[#475569] font-mono">Thay đổi bộ lọc tìm kiếm của bạn</p>
          </div>
        )}
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

export default TeamListView;
