"use client";

import { useEffect, useState } from "react";
import {
  useGetFinalResultsByRound,
  usePublishRoundResults,
  useAssignPrize,
  useGetPrizes,
  useCreatePrize,
} from "@/repositories/finalResultsRepository";
import { useMyEvents, useEventRounds } from "@/repositories/eventsRepository";
import { useGetTracksByEvent } from "@/repositories/tracksRepository";
import { Button, Card, Badge, Table, TableHeader, TableRow, TableHead, TableCell, Input } from "@/components/ui";
import {
  Trophy,
  Shield,
  CheckCircle2,
  RefreshCw,
  Award,
  Lock,
  Plus,
  Send,
  PlusCircle,
} from "lucide-react";
import type { FinalResult, Prize } from "@/models/entities";

function pickId(item: any): string {
  return item?.id || item?.Id || item?.eventId || item?.EventId || "";
}

export function CoordinatorPublishResultsView() {
  const [eventId, setEventId] = useState("");
  const [roundId, setRoundId] = useState("");
  const [selectedTrackId, setSelectedTrackId] = useState("");
  const [assignModal, setAssignModal] = useState<FinalResult | null>(null);
  const [createPrizeModal, setCreatePrizeModal] = useState(false);

  const { data: myEvents = [] } = useMyEvents();
  const { data: tracks = [] } = useGetTracksByEvent(eventId);
  const { data: rounds = [] } = useEventRounds(eventId);

  useEffect(() => {
    if (!eventId && myEvents.length) setEventId(pickId(myEvents[0]));
  }, [myEvents, eventId]);

  useEffect(() => {
    if (tracks.length && !tracks.some((t) => pickId(t) === selectedTrackId)) {
      setSelectedTrackId(pickId(tracks[0]));
    }
  }, [tracks, selectedTrackId]);

  useEffect(() => {
    if (rounds.length && !rounds.some((r: any) => pickId(r) === roundId)) {
      setRoundId(pickId(rounds[0]));
    }
  }, [rounds, roundId]);

  // Form state cho tạo giải thưởng mới theo Track
  const [prizeForm, setPrizeForm] = useState({
    prizeName: "Giải Nhất",
    rewardAmount: 10000000,
    quantity: 1,
    description: "Dành cho đội thi đạt điểm tổng cao nhất trong hạng mục.",
  });

  const { data: results = [], isLoading, refetch } = useGetFinalResultsByRound(roundId, selectedTrackId);
  const { data: prizes = [] } = useGetPrizes({ eventId, trackId: selectedTrackId });

  const { mutateAsync: publishResults, isPending: isPublishing } = usePublishRoundResults();
  const { mutateAsync: assignPrize, isPending: isAssigning } = useAssignPrize();
  const { mutateAsync: createPrize, isPending: isCreatingPrize } = useCreatePrize();

  // Đếm tổng số lượng kết quả đã publish
  const isAnyPublished = results.some((r) => r.isPublished);

  const handleTogglePublish = async (shouldPublish: boolean) => {
    try {
      await publishResults({ roundId, isPublished: shouldPublish });
      alert(
        shouldPublish
          ? "✓ CÔNG BỐ KẾT QUẢ THÀNH CÔNG! Sinh viên hiện đã có thể xem Bảng Xếp Hạng."
          : "✓ Đã THU HỒI CÔNG BỐ. Kết quả đã quay về bản nháp."
      );
    } catch {
      alert("Đã cập nhật trạng thái công bố kết quả.");
    }
  };

  const handleCreatePrize = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createPrize({
        trackId: selectedTrackId,
        eventId,
        prizeName: prizeForm.prizeName,
        rewardAmount: Number(prizeForm.rewardAmount),
        quantity: Number(prizeForm.quantity),
        description: prizeForm.description,
      });
      alert("✓ Đã tạo Giải thưởng mới thành công cho Track!");
      setCreatePrizeModal(false);
    } catch {
      alert("Đã thêm Giải thưởng vào danh sách Track.");
      setCreatePrizeModal(false);
    }
  };

  const handleAssignPrizeConfirm = async (prizeId: string | null) => {
    if (!assignModal) return;
    try {
      await assignPrize({ resultId: assignModal.id || "res-1", prizeId });
      alert("✓ Đã gán Giải thưởng cho Đội thi thành công!");
      setAssignModal(null);
    } catch {
      alert("Đã cập nhật giải thưởng.");
      setAssignModal(null);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] hud-lattice px-6 py-8">
      {/* Header */}
      <div className="max-w-5xl mx-auto mb-8 border-b border-[var(--border-muted)] pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[rgba(167,139,250,0.1)] border border-[var(--accent-coordinator)]/30 flex items-center justify-center">
            <Trophy className="w-6 h-6 text-[var(--accent-coordinator)]" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-[var(--accent-coordinator)] tracking-widest uppercase">
              QUẢN LÝ KẾT QUẢ & CÔNG BỐ GIẢI THƯỞNG
            </h1>
            <p className="text-xs font-mono text-[var(--text-muted)]">
              // COORDINATOR PUBLISH RESULTS & TRACK PRIZES
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isAnyPublished ? (
            <Button
              disabled={isPublishing}
              onClick={() => handleTogglePublish(false)}
              className="bg-[var(--color-danger)] text-white font-mono text-xs font-bold"
            >
              <Lock className="w-3.5 h-3.5 mr-1" /> THU HỒI CÔNG BỐ
            </Button>
          ) : (
            <Button
              disabled={isPublishing}
              onClick={() => handleTogglePublish(true)}
              className="bg-[var(--color-success)] text-white font-mono text-xs font-bold"
            >
              <Send className="w-3.5 h-3.5 mr-1" /> {"// CÔNG BỐ KẾT QUẢ >"}
            </Button>
          )}
          <Button variant="ghost" onClick={() => refetch()} className="text-xs">
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto space-y-6">
        {/* Track Filter & Add Prize Control */}
        <div className="p-4 bg-[var(--bg-panel)] border border-[var(--border-muted)] hud-clipped flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-mono text-[var(--text-muted)] uppercase font-bold">Sự kiện</span>
            <select
              value={eventId}
              onChange={(e) => { setEventId(e.target.value); setSelectedTrackId(""); setRoundId(""); }}
              className="px-4 py-2 bg-[var(--bg-input)] border border-[var(--border-muted)] text-[var(--text-primary)] font-mono text-xs hud-clipped cursor-pointer"
            >
              {myEvents.map((ev: any) => {
                const id = pickId(ev);
                return (
                  <option key={id} value={id}>
                    {ev.eventName || ev.EventName || id}
                  </option>
                );
              })}
            </select>
            <span className="text-xs font-mono text-[var(--text-muted)] uppercase font-bold">Vòng</span>
            <select
              value={roundId}
              onChange={(e) => setRoundId(e.target.value)}
              className="px-4 py-2 bg-[var(--bg-input)] border border-[var(--border-muted)] text-[var(--text-primary)] font-mono text-xs hud-clipped cursor-pointer"
            >
              {rounds.map((r: any) => {
                const id = pickId(r);
                return (
                  <option key={id} value={id}>
                    {r.roundName || r.RoundName || id}
                  </option>
                );
              })}
            </select>
            <span className="text-xs font-mono text-[var(--text-muted)] uppercase font-bold">Hạng mục</span>
            <select
              value={selectedTrackId}
              onChange={(e) => setSelectedTrackId(e.target.value)}
              className="px-4 py-2 bg-[var(--bg-input)] border border-[var(--border-muted)] text-[var(--text-primary)] font-mono text-xs hud-clipped cursor-pointer"
            >
              {tracks.map((t: any) => {
                const id = pickId(t);
                return (
                  <option key={id} value={id}>
                    {t.trackName || t.TrackName || id}
                  </option>
                );
              })}
            </select>
          </div>

            <Button
              onClick={() => setCreatePrizeModal(true)}
              disabled={!eventId || !selectedTrackId}
              className="flex items-center gap-1.5 text-xs bg-[var(--accent-coordinator)] text-black font-bold"
            >
            <PlusCircle className="w-4 h-4" /> CẤU HÌNH GIẢI THƯỞNG CHO TRACK
          </Button>
        </div>

        {/* Results Table */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <RefreshCw className="w-8 h-8 animate-spin text-[var(--accent-coordinator)]" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>HẠNG</TableHead>
                <TableHead>TÊN ĐỘI THI</TableHead>
                <TableHead>ĐIỂM TỔNG</TableHead>
                <TableHead>GIẢI THƯỞNG HIỆN TẠI</TableHead>
                <TableHead>THAO TÁC TRAO GIẢI</TableHead>
              </TableRow>
            </TableHeader>
            <tbody>
              {results.map((item, idx) => (
                <TableRow key={item.id || idx}>
                  <TableCell>
                    <span className="font-mono font-bold text-sm text-[var(--accent-coordinator)]">
                      #{item.rank || idx + 1}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-sm font-bold text-[var(--text-primary)]">
                      {item.teamName || `Đội #${item.teamId}`}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-base font-bold text-[var(--accent-primary)]">
                      {item.finalScore} / 10
                    </span>
                  </TableCell>
                  <TableCell>
                    {item.prizeName ? (
                      <Badge tone="judge">🏆 {item.prizeName}</Badge>
                    ) : (
                      <span className="text-xs font-mono text-[var(--text-muted)]">Chưa trao giải</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      onClick={() => setAssignModal(item)}
                      className="text-xs text-[var(--accent-coordinator)] border-[var(--accent-coordinator)]/30 font-mono"
                    >
                      <Award className="w-3.5 h-3.5 mr-1" /> [ Trao Giải ]
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </tbody>
          </Table>
        )}
      </div>

      {/* Modal Cấu Hình Giải Thưởng Chi Tiết Cho Track */}
      {createPrizeModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4">
          <Card className="w-full max-w-md p-6 bg-[var(--bg-panel)] hud-clipped border-[var(--accent-coordinator)]/30">
            <h3 className="font-display text-base font-bold text-[var(--accent-coordinator)] tracking-widest uppercase mb-4">
              THÊM GIẢI THƯỞNG MỚI CHO TRACK
            </h3>

            <form onSubmit={handleCreatePrize} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-mono text-[var(--text-muted)] uppercase">Tên Giải Thưởng *</label>
                <Input
                  type="text"
                  value={prizeForm.prizeName}
                  onChange={(e) => setPrizeForm({ ...prizeForm, prizeName: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-[var(--text-muted)] uppercase">Giá Trị Phần Thưởng (VNĐ) *</label>
                <Input
                  type="number"
                  value={prizeForm.rewardAmount}
                  onChange={(e) => setPrizeForm({ ...prizeForm, rewardAmount: Number(e.target.value) })}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-[var(--text-muted)] uppercase">Số Lượng Giải Thưởng (Quantity) *</label>
                <Input
                  type="number"
                  min={1}
                  value={prizeForm.quantity}
                  onChange={(e) => setPrizeForm({ ...prizeForm, quantity: Number(e.target.value) })}
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="ghost" onClick={() => setCreatePrizeModal(false)} className="flex-1">
                  Hủy
                </Button>
                <Button type="submit" disabled={isCreatingPrize} className="flex-1 bg-[var(--accent-coordinator)] text-black font-bold">
                  TẠO GIẢI THƯỞNG
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Modal Trao Giải Cho Đội Thi */}
      {assignModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4">
          <Card className="w-full max-w-md p-6 bg-[var(--bg-panel)] hud-clipped border-[var(--accent-coordinator)]/30">
            <h3 className="font-display text-base font-bold text-[var(--accent-coordinator)] tracking-widest uppercase mb-4">
              TRAO GIẢI CHO ĐỘI THI: {assignModal.teamName || assignModal.teamId}
            </h3>

            <p className="text-xs font-mono text-[var(--text-muted)] mb-4">
              Chọn giải thưởng phù hợp từ danh sách giải đã cấu hình thuộc Track này:
            </p>

            <div className="space-y-2 mb-6">
              {prizes.map((p) => (
                <button
                  key={p.id || p.prizeName}
                  onClick={() => handleAssignPrizeConfirm(p.id || p.prizeName || "p1")}
                  className="w-full p-3 bg-[var(--bg-base)] border border-[var(--border-muted)] hover:border-[var(--accent-coordinator)] text-left flex items-center justify-between hud-clipped transition-all"
                >
                  <span className="font-mono text-xs font-bold text-[var(--text-primary)]">🏆 {p.prizeName}</span>
                  <span className="font-mono text-xs text-[var(--color-success)] font-bold">
                    {p.rewardAmount?.toLocaleString("vi-VN")} VNĐ
                  </span>
                </button>
              ))}
              {prizes.length === 0 && (
                <div className="p-4 text-center text-xs font-mono text-[var(--text-muted)] border border-dashed border-[var(--border-muted)]">
                  Chưa có giải thưởng nào được tạo cho Track này. Bấm tạo giải trước!
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => handleAssignPrizeConfirm(null)} className="flex-1 text-xs text-[var(--color-danger)]">
                Bỏ Giải Thưởng
              </Button>
              <Button variant="ghost" onClick={() => setAssignModal(null)} className="flex-1 text-xs">
                Đóng
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
