"use client";

import { useMemo, useState } from "react";
import { Badge, Button, Card, SkeletonRows } from "@/components/ui";
import { useGetTeamsByEvent } from "@/repositories/teamsRepository";
import { useGetTracksByEvent } from "@/repositories/tracksRepository";
import { JoinRequestEmailModal } from "./JoinRequestEmailModal";
import { Mail, Search, Sparkles, UserCheck, Users } from "lucide-react";
import { MAX_MEMBERS, MIN_MEMBERS } from "./teamStatus";

interface Props {
  eventId?: string;
  eventName?: string;
  onSwitchToCreate?: () => void;
}

function pick(obj: unknown, ...keys: string[]): string {
  const record = obj as Record<string, unknown> | null | undefined;
  for (const key of keys) {
    const value = record?.[key];
    if (value != null && value !== "") return String(value);
  }
  return "";
}

export function AvailableTeamsList({ eventId, eventName, onSwitchToCreate }: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTrackId, setSelectedTrackId] = useState<string>("ALL");
  const [onlyRecruiting, setOnlyRecruiting] = useState<boolean>(true);
  const [selectedTeamForEmail, setSelectedTeamForEmail] = useState<any | null>(null);

  const { data: rawTeams = [], isLoading: isLoadingTeams, refetch } = useGetTeamsByEvent(eventId);
  const { data: tracks = [] } = useGetTracksByEvent(eventId);

  const trackList = Array.isArray(tracks) ? tracks : [];
  const trackMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of trackList as any[]) {
      const id = t.id || t.Id || t.trackId;
      const name = t.trackName || t.TrackName || t.name || id;
      if (id) map.set(id, name);
    }
    return map;
  }, [trackList]);

  const teams = useMemo(() => {
    const list: any[] = Array.isArray(rawTeams)
      ? rawTeams
      : (rawTeams as any)?.data?.items ?? (rawTeams as any)?.items ?? (rawTeams as any)?.data ?? [];

    return list.map((t) => {
      const statusRaw = pick(t, "status", "Status");
      const memberCount = Number(t.memberCount ?? t.MemberCount ?? (t.members?.length || t.Members?.length || 1));
      const trackId = pick(t, "trackId", "TrackId");
      const trackName = trackMap.get(trackId) || pick(t, "trackName", "TrackName") || "Hạng mục chung";
      const isRecruiting = (statusRaw === "Forming" || statusRaw === "0" || statusRaw === "Rejected" || !statusRaw) && memberCount < MAX_MEMBERS;

      return {
        id: pick(t, "id", "Id", "teamId", "TeamId"),
        name: pick(t, "name", "Name", "teamName", "TeamName") || "Đội chưa đặt tên",
        description: pick(t, "description", "Description") || "Đội thi đang tìm kiếm đồng đội cùng phát triển dự án.",
        status: statusRaw,
        trackId,
        trackName,
        leaderName: pick(t, "leaderName", "LeaderName", "leaderFullName") || "Đội trưởng",
        leaderEmail: pick(t, "leaderEmail", "LeaderEmail") || "leader@fpt.edu.vn",
        memberCount,
        isRecruiting,
        createdTime: pick(t, "createdTime", "CreatedTime"),
      };
    });
  }, [rawTeams, trackMap]);

  const filteredTeams = useMemo(() => {
    return teams.filter((t) => {
      if (onlyRecruiting && !t.isRecruiting) return false;
      if (selectedTrackId !== "ALL" && t.trackId !== selectedTrackId) return false;
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchName = t.name.toLowerCase().includes(query);
        const matchDesc = t.description.toLowerCase().includes(query);
        const matchTrack = t.trackName.toLowerCase().includes(query);
        const matchLeader = t.leaderName.toLowerCase().includes(query);
        if (!matchName && !matchDesc && !matchTrack && !matchLeader) return false;
      }
      return true;
    });
  }, [teams, onlyRecruiting, selectedTrackId, searchTerm]);

  return (
    <div className="space-y-6 font-mono">
      {/* Search & Filter Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-[#10171a] border border-zinc-800 p-4 hud-clipped">
        {/* Search Box */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Tìm theo tên đội, kỹ năng, đội trưởng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-black/60 border border-zinc-700 rounded text-xs text-white placeholder:text-zinc-500 focus:border-cyan-400 outline-none"
          />
        </div>

        {/* Track Filter */}
        <select
          value={selectedTrackId}
          onChange={(e) => setSelectedTrackId(e.target.value)}
          className="px-3 py-2 bg-black/60 border border-zinc-700 rounded text-xs text-zinc-200 focus:border-cyan-400 outline-none cursor-pointer"
        >
          <option value="ALL">Tất cả hạng mục ({trackList.length})</option>
          {trackList.map((t: any) => {
            const id = t.id || t.Id || t.trackId;
            const name = t.trackName || t.TrackName || t.name || id;
            return (
              <option key={id} value={id}>
                {name}
              </option>
            );
          })}
        </select>

        {/* Recruiting Only Toggle */}
        <button
          type="button"
          onClick={() => setOnlyRecruiting(!onlyRecruiting)}
          className={`px-3 py-2 text-xs font-bold uppercase rounded border transition-colors flex items-center gap-1.5 cursor-pointer ${
            onlyRecruiting
              ? "bg-amber-500/15 text-amber-300 border-amber-500/40"
              : "bg-zinc-900 text-zinc-400 border-zinc-700 hover:text-white"
          }`}
        >
          <Sparkles className="size-3.5" />
          <span>{onlyRecruiting ? "Đang tuyển quân" : "Tất cả trạng thái"}</span>
        </button>
      </div>

      {/* Teams Grid */}
      {isLoadingTeams ? (
        <SkeletonRows rows={4} />
      ) : filteredTeams.length === 0 ? (
        <Card className="text-center py-12 px-4 space-y-4 border border-zinc-800 bg-[#10171a]">
          <div className="flex justify-center">
            <div className="size-12 rounded-full bg-zinc-800/80 flex items-center justify-center text-zinc-400">
              <Users className="size-6" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="font-display text-base font-bold uppercase text-white">
              Không tìm thấy đội thi nào phù hợp
            </h3>
            <p className="text-xs text-zinc-400 max-w-md mx-auto">
              Chưa có đội nào phù hợp với bộ lọc hiện tại. Bạn có thể xóa bộ lọc tìm kiếm hoặc tự tạo một đội thi mới để chiêu mộ đồng đội!
            </p>
          </div>
          {onSwitchToCreate && (
            <Button
              accent="team"
              onClick={onSwitchToCreate}
              className="text-xs font-bold uppercase"
            >
              + Tạo Đội Thi Mới Ngay
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTeams.map((t) => {
            const missingCount = MAX_MEMBERS - t.memberCount;
            const isNeedMin = t.memberCount < MIN_MEMBERS;

            return (
              <div
                key={t.id}
                className="bg-[#10171a] border border-zinc-800 hover:border-cyan-500/50 transition-all p-5 hud-clipped flex flex-col justify-between space-y-4 shadow-sm group"
              >
                <div className="space-y-3">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold uppercase hud-clipped">
                      {t.trackName}
                    </span>

                    {t.isRecruiting ? (
                      <span className="px-2 py-0.5 bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-bold uppercase hud-clipped animate-pulse">
                        Đang tuyển {missingCount} bạn
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-emerald-950/50 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold uppercase hud-clipped">
                        Đã đủ thành viên
                      </span>
                    )}
                  </div>

                  {/* Team Title & Description */}
                  <div>
                    <h3 className="font-display text-lg font-bold uppercase text-white group-hover:text-cyan-300 transition-colors">
                      {t.name}
                    </h3>
                    <p className="mt-1 text-xs text-zinc-400 line-clamp-2 leading-relaxed font-sans">
                      {t.description}
                    </p>
                  </div>

                  {/* Member Progress Bar */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-zinc-400 flex items-center gap-1.5">
                        <Users className="size-3.5 text-cyan-400" />
                        Đội hình:
                      </span>
                      <span className={`font-bold tabular-nums ${isNeedMin ? "text-amber-400" : "text-emerald-400"}`}>
                        {t.memberCount}/{MAX_MEMBERS} thành viên
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-800 overflow-hidden rounded-full">
                      <div
                        className={`h-full transition-all duration-300 ${
                          isNeedMin ? "bg-amber-400" : "bg-cyan-400"
                        }`}
                        style={{ width: `${(t.memberCount / MAX_MEMBERS) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Leader Info */}
                  <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400">
                    <div className="flex items-center gap-1.5 truncate">
                      <UserCheck className="size-3.5 text-zinc-500 shrink-0" />
                      <span className="truncate">
                        Đội trưởng: <strong className="text-zinc-200">{t.leaderName}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Join Request Action */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedTeamForEmail({
                        ...t,
                        eventName: eventName || "Sự kiện Hackathon SEAL",
                      })
                    }
                    className="w-full py-2.5 px-4 bg-cyan-950/60 border border-cyan-500/40 hover:bg-cyan-500 hover:text-black text-cyan-300 font-bold uppercase text-xs transition-all hud-clipped flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    <Mail className="size-3.5" />
                    <span>Gửi Email Đề Nghị Gia Nhập</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Join Request Email Modal */}
      <JoinRequestEmailModal
        open={Boolean(selectedTeamForEmail)}
        team={selectedTeamForEmail}
        onClose={() => setSelectedTeamForEmail(null)}
      />
    </div>
  );
}
