'use client';

import { useState } from 'react';
import {
  ArrowLeft,
  Star,
  Send,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Users,
  BarChart3,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export interface ScoringCriteria {
  id: string;
  name: string;
  description: string;
  weight: number;
  maxScore: number;
  score?: number;
}

export interface ScoringDashboardViewProps {
  teamId?: string;
  teamName?: string;
}

export function ScoringDashboardView({ teamId, teamName }: ScoringDashboardViewProps) {
  const router = useRouter();
  const [scores, setScores] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  // Mock criteria data
  const criteria: ScoringCriteria[] = [
    {
      id: '1',
      name: 'Code Quality',
      description: 'Đánh giá chất lượng code, cấu trúc, tính dễ bảo trì',
      weight: 20,
      maxScore: 100,
    },
    {
      id: '2',
      name: 'UI/UX Design',
      description: 'Đánh giá giao diện, trải nghiệm người dùng, tính thẩm mỹ',
      weight: 25,
      maxScore: 100,
    },
    {
      id: '3',
      name: 'Responsive Design',
      description: 'Đánh giá khả năng tương thích với nhiều kích thước màn hình',
      weight: 15,
      maxScore: 100,
    },
    {
      id: '4',
      name: 'Performance',
      description: 'Đánh giá tốc độ load, tối ưu hóa, hiệu năng ứng dụng',
      weight: 20,
      maxScore: 100,
    },
    {
      id: '5',
      name: 'Accessibility',
      description: 'Đánh giá khả năng tiếp cận cho người khuyết tật',
      weight: 20,
      maxScore: 100,
    },
  ];

  const handleScoreChange = (criteriaId: string, value: number) => {
    const maxScore = criteria.find(c => c.id === criteriaId)?.maxScore || 100;
    if (value >= 0 && value <= maxScore) {
      setScores(prev => ({ ...prev, [criteriaId]: value }));
      setError('');
    }
  };

  const handleReset = () => {
    setScores({});
    setFeedback('');
    setError('');
  };

  const handleSubmit = async () => {
    // Validation
    if (criteria.length !== Object.keys(scores).length) {
      setError('Vui lòng chấm điểm cho tất cả tiêu chí');
      return;
    }

    if (!feedback.trim()) {
      setError('Vui lòng nhập nhận xét');
      return;
    }

    setIsSubmitting(true);

    try {
      // TODO: Call scoring API
      await new Promise(resolve => setTimeout(resolve, 2000));
      setIsSubmitted(true);

      setTimeout(() => {
        router.back();
      }, 2000);
    } catch (err) {
      setError('Có lỗi xảy ra khi gửi điểm');
      setIsSubmitting(false);
    }
  };

  // Calculate weighted score
  const filledScores = Object.keys(scores).length;
  const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);
  const weightedScore = criteria.reduce((sum, c) => {
    const score = scores[c.id];
    return score !== undefined ? sum + (score / 100) * c.weight : sum;
  }, 0);
  const finalScore = filledScores === criteria.length ? Math.round(weightedScore) : 0;

  if (isSubmitted) {
    return (
      <main className="min-h-screen bg-[#0a0f1d] text-[#f1f5f9] antialiased flex items-center justify-center">
        <div className="relative z-10 text-center">
          <div className="flex justify-center mb-8">
            <div className="w-24 h-24 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center animate-pulse">
              <CheckCircle2 className="w-12 h-12 text-green-400" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-[#2dd4bf] uppercase mb-4">Gửi điểm thành công!</h1>
          <p className="text-lg text-[#94a3b8] font-mono mb-8">
            Điểm của {teamName || 'đội'} đã được lưu và gửi
          </p>
          <button
            onClick={() => router.back()}
            className="hud-clipped px-8 py-3 bg-[#2dd4bf] hover:bg-[#26c0a8] text-[#0a0f1d] font-display font-bold uppercase tracking-wider transition-all"
          >
            Quay lại
          </button>
        </div>

        <style>{`
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
        `}</style>
      </main>
    );
  }

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
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8 md:py-16">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-[#94a3b8] hover:text-[#2dd4bf] transition-colors mb-8 font-mono text-sm uppercase tracking-wide"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại danh sách đội
        </button>

        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-[#2dd4bf] uppercase tracking-widest mb-2">
            Chấm điểm - {teamName || 'Đội'}
          </h1>
          <p className="text-lg text-[#94a3b8] font-mono">
            Frontend Development • SEAL Hackathon 2026
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/50 rounded-sm text-red-400 text-sm font-mono flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Score Summary Card */}
        <div className="hud-clipped p-[2px] bg-gradient-to-br from-[#fbbf24] to-[#f59e0b] mb-12">
          <div className="hud-clipped bg-[#111a2e] p-8">
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-5xl font-bold text-[#fbbf24] mb-2">{finalScore}</div>
                <p className="text-xs text-[#94a3b8] font-mono uppercase tracking-widest">Điểm cuối</p>
              </div>
              <div className="text-center border-l border-r border-[#24344d]">
                <div className="text-3xl font-bold text-[#38bdf8] mb-2">{filledScores}/{criteria.length}</div>
                <p className="text-xs text-[#94a3b8] font-mono uppercase tracking-widest">Tiêu chí</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i <= Math.round(finalScore / 20)
                          ? 'fill-current text-[#fbbf24]'
                          : 'text-[#475569]'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-[#94a3b8] font-mono uppercase tracking-widest">Đánh giá</p>
              </div>
            </div>
          </div>
        </div>

        {/* Scoring Form */}
        <div className="space-y-6 mb-12">
          <h2 className="text-2xl font-bold text-[#2dd4bf] uppercase tracking-widest font-display">
            Tiêu chí chấm điểm
          </h2>

          {criteria.map((crit) => (
            <div key={crit.id} className="hud-clipped p-[1px] bg-gradient-to-r from-[#2dd4bf] to-[#38bdf8]">
              <div className="hud-clipped bg-[#111a2e] p-6">
                {/* Criteria Header */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-[#f1f5f9] uppercase tracking-wide">
                      {crit.name}
                    </h3>
                    <p className="text-sm text-[#94a3b8] mt-2">{crit.description}</p>
                  </div>
                  <div className="text-right whitespace-nowrap">
                    <div className="text-sm font-mono text-[#94a3b8]">Trọng số</div>
                    <div className="text-xl font-bold text-[#2dd4bf]">{crit.weight}%</div>
                  </div>
                </div>

                {/* Score Input */}
                <div className="space-y-2 pt-4 border-t border-[#24344d]">
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="0"
                      max={crit.maxScore}
                      step="1"
                      value={scores[crit.id] || 0}
                      onChange={(e) => handleScoreChange(crit.id, parseInt(e.target.value))}
                      disabled={isSubmitting}
                      className="flex-1 h-2 bg-[#0f172a] rounded-sm border border-[#24344d] appearance-none cursor-pointer accent-[#2dd4bf]"
                    />
                    <div className="w-16">
                      <input
                        type="number"
                        min="0"
                        max={crit.maxScore}
                        value={scores[crit.id] || 0}
                        onChange={(e) => handleScoreChange(crit.id, parseInt(e.target.value) || 0)}
                        disabled={isSubmitting}
                        className="sci-input hud-clipped-reverse w-full px-3 py-2 text-center text-sm text-[#f1f5f9] bg-[#0f172a]/70 border border-[#1e293b] focus:border-[#2dd4bf] focus:outline-none transition-all font-mono font-bold"
                      />
                    </div>
                    <span className="text-sm text-[#94a3b8] font-mono min-w-fit">/ {crit.maxScore}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Feedback Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-[#2dd4bf] uppercase tracking-widest font-display mb-6">
            Nhận xét chi tiết
          </h2>
          <div className="hud-clipped p-[1px] bg-gradient-to-r from-[#2dd4bf] to-[#38bdf8]">
            <div className="hud-clipped bg-[#111a2e] p-6">
              <label htmlFor="feedback" className="block text-xs uppercase text-[#2dd4bf] tracking-widest font-mono font-semibold mb-3">
                &gt; CHI TIẾT CÁC NHẬN XÉT
              </label>
              <textarea
                id="feedback"
                placeholder="Nhập các nhận xét, gợi ý cải thiện cho đội..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                disabled={isSubmitting}
                rows={6}
                maxLength={1000}
                className="sci-input hud-clipped-reverse w-full px-4 py-3 text-sm text-[#f1f5f9] placeholder-[#475569] bg-[#0f172a]/70 border border-[#1e293b] focus:border-[#2dd4bf] focus:shadow-[0_0_10px_rgba(45,212,191,0.2)] focus:outline-none transition-all resize-none"
              />
              <div className="text-xs text-[#94a3b8] text-right mt-2 font-mono">
                {feedback.length} / 1000
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={handleReset}
            disabled={isSubmitting}
            className="hud-clipped flex-1 bg-transparent hover:bg-[#1e293b]/50 text-[#f1f5f9] border border-[#24344d] hover:border-[#2dd4bf]/50 py-3 px-6 font-display font-bold text-lg uppercase tracking-wider transition-all disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            RESET
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || filledScores !== criteria.length}
            className="hud-clipped flex-1 bg-[#2dd4bf] hover:bg-[#26c0a8] disabled:bg-[#0f4f46] text-[#0a0f1d] py-3 px-6 font-display font-bold text-lg uppercase tracking-wider transition-all group relative overflow-hidden disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <span className="relative z-10 flex items-center gap-2">
              {isSubmitting ? 'ĐANG GỬI...' : 'GỬI ĐIỂM'}
              {!isSubmitting && <Send className="w-5 h-5" />}
            </span>
            <div className="absolute inset-0 h-full w-full bg-gradient-to-b from-transparent via-white/20 to-transparent -translate-y-full group-hover:animate-[scan_1.5s_ease-in-out_infinite]"></div>
          </button>
        </div>
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

        input[type="range"] {
          width: 100%;
          background: linear-gradient(to right, #2dd4bf 0%, #2dd4bf var(--value), #0f172a var(--value), #0f172a 100%);
        }
      `}</style>
    </main>
  );
}

export default ScoringDashboardView;
