"use client";

import React, { useState, useMemo } from "react";
import { Button, Card, Badge, Input, ApiMissingDataBadge } from "@/components/ui";
import { useEvents } from "@/repositories/eventsRepository";
import { Link, useRouter } from "@/i18n/routing";
import { ComprehensiveEventEditModal } from "@/components/domain/ComprehensiveEventEditModal";
import { RevokeDraftConfirmModal } from "@/components/domain/RevokeDraftConfirmModal";
import { ChevronLeft, ChevronRight } from "lucide-react";

function pickId(ev: any): string {
  return ev?.id || ev?.Id || ev?.eventId || ev?.EventId || "";
}

export function AdminEventsView() {
  const router = useRouter();
  const { data: rawEvents = [], isLoading, refetch } = useEvents();
  const eventsList: any[] = Array.isArray(rawEvents) ? rawEvents : (rawEvents as any)?.data ?? [];

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [seasonFilter, setSeasonFilter] = useState<string>("all");
  const [editingEvent, setEditingEvent] = useState<any | null>(null);
  const [revokingEvent, setRevokingEvent] = useState<any | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 5;

  // Dynamic seasons list
  const seasons = useMemo(() => {
    return Array.from(
      new Set(
        eventsList
          .map((e) => e.season || e.Season)
          .filter(Boolean)
      )
    );
  }, [eventsList]);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (filter: "all" | "active" | "inactive") => {
    setStatusFilter(filter);
    setCurrentPage(1);
  };

  const handleSeasonFilterChange = (season: string) => {
    setSeasonFilter(season);
    setCurrentPage(1);
  };

  // Filter logic
  const filteredEvents = useMemo(() => {
    return eventsList.filter((ev) => {
      const isAct = ev.status !== false && ev.Status !== false;
      if (statusFilter === "active" && !isAct) return false;
      if (statusFilter === "inactive" && isAct) return false;

      const s = ev.season || ev.Season;
      if (seasonFilter !== "all" && s !== seasonFilter) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const name = (ev.eventName || ev.EventName || "").toLowerCase();
        const seasonName = (ev.season || ev.Season || "").toLowerCase();
        const id = pickId(ev).toLowerCase();
        return name.includes(q) || seasonName.includes(q) || id.includes(q);
      }
      return true;
    });
  }, [eventsList, statusFilter, seasonFilter, searchTerm]);

  // Pagination computations
  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedEvents = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredEvents.slice(start, start + PAGE_SIZE);
  }, [filteredEvents, safePage, PAGE_SIZE]);

  const activeCount = eventsList.filter((e) => e.status !== false && e.Status !== false).length;
  const inactiveCount = eventsList.length - activeCount;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#090e11] text-[#dde4e6] font-sans py-6 px-4 md:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 font-mono text-[10px] text-zinc-500 tracking-widest uppercase">
          <span className="text-red-400 font-bold">SEAL ADMIN</span>
          <span>&gt;</span>
          <span className="text-zinc-300 font-bold">QUẢN LÝ SỰ KIỆN</span>
        </div>

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
          <div>
            <div className="font-mono text-[11px] text-amber-400 uppercase tracking-wider mb-1">
              EVENTS DIRECTORY &amp; INTERVENTION
            </div>
            <h1 className="font-display font-bold text-2xl md:text-3xl text-white uppercase tracking-wider">
              Danh Sách Sự Kiện Toàn Hệ Thống
            </h1>
            <p className="text-xs font-mono text-zinc-400 mt-1">
              Quản trị tập trung tất cả cuộc thi Hackathon, phân công Trưởng ban điều phối (EC) và giám sát tiến độ thực tế.
            </p>
          </div>

          <div className="flex items-center gap-2.5 font-mono">
            <button
              onClick={() => refetch()}
              className="px-3.5 py-2 bg-[#141f23] border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white text-xs uppercase transition-colors rounded cursor-pointer"
            >
              LÀM MỚI
            </button>

            <Link href="/admin/events/new">
              <button
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase transition-all shadow-md shadow-red-950/40 rounded cursor-pointer"
              >
                + TẠO SỰ KIỆN MỚI
              </button>
            </Link>
          </div>
        </div>

        {/* KPI Metrics Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
          <div className="p-4 bg-[#0f171c] border border-zinc-800 rounded space-y-1">
            <span className="text-[10px] text-zinc-400 uppercase block font-bold tracking-wider">TỔNG SỐ SỰ KIỆN</span>
            <div className="text-2xl font-bold text-red-400">{eventsList.length} SỰ KIỆN</div>
          </div>
          <div className="p-4 bg-[#0f171c] border border-zinc-800 rounded space-y-1">
            <span className="text-[10px] text-zinc-400 uppercase block font-bold tracking-wider">ĐANG MỞ / HOẠT ĐỘNG</span>
            <div className="text-2xl font-bold text-emerald-400">{activeCount} SỰ KIỆN</div>
          </div>
          <div className="p-4 bg-[#0f171c] border border-zinc-800 rounded space-y-1">
            <span className="text-[10px] text-zinc-400 uppercase block font-bold tracking-wider">BẢN NHÁP / TẠM DỪNG</span>
            <div className="text-2xl font-bold text-zinc-400">{inactiveCount} SỰ KIỆN</div>
          </div>
        </div>

        {/* Filter Toolbelt */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-[#0f171c] p-3 border border-zinc-800 rounded font-mono text-xs">
          <div className="sm:col-span-4">
            <select
              value={statusFilter}
              onChange={(e) => handleStatusFilterChange(e.target.value as any)}
              className="w-full h-10 px-3 py-2 bg-[#141f23] border border-zinc-700 text-white rounded focus:border-red-500 outline-none font-mono text-xs cursor-pointer"
            >
              <option value="all">— TẤT CẢ TRẠNG THÁI ({eventsList.length}) —</option>
              <option value="active">● ĐANG HOẠT ĐỘNG ({activeCount})</option>
              <option value="inactive">○ BẢN NHÁP / TẠM DỪNG ({inactiveCount})</option>
            </select>
          </div>

          <div className="sm:col-span-4">
            <select
              value={seasonFilter}
              onChange={(e) => handleSeasonFilterChange(e.target.value)}
              className="w-full h-10 px-3 py-2 bg-[#141f23] border border-zinc-700 text-white rounded focus:border-red-500 outline-none font-mono text-xs cursor-pointer"
            >
              <option value="all">— TẤT CẢ MÙA GIẢI ({seasons.length}) —</option>
              {seasons.map((s) => (
                <option key={s} value={s}>
                  MÙA: {s.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-4">
            <input
              type="text"
              placeholder="TÌM KIẾM THEO TÊN, MÙA GIẢI, ID..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full h-10 px-3 py-2 text-xs bg-[#141f23] border border-zinc-700 focus:border-red-500 font-mono text-white rounded outline-none"
            />
          </div>
        </div>

        {/* Events Table Matrix */}
        <div className="p-6 bg-[#0f171c] border border-zinc-800 rounded space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h3 className="font-display font-bold text-sm text-white uppercase tracking-wider">
              DANH SÁCH SỰ KIỆN CHI TIẾT ({filteredEvents.length})
            </h3>
            <span className="font-mono text-[10px] text-zinc-500 uppercase">
              Cập nhật thời gian thực từ cơ sở dữ liệu hệ thống
            </span>
          </div>

          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-2 font-mono text-xs text-red-400">
              <span>Đang tải danh sách sự kiện...</span>
            </div>
          ) : filteredEvents.length === 0 ? (
            <ApiMissingDataBadge
              endpoint="GET /api/Events"
              title="KHÔNG TÌM THẤY SỰ KIỆN NÀO"
              message="Chưa có sự kiện nào khớp với bộ lọc đã chọn hoặc hệ thống chưa có dữ liệu sự kiện."
            />
          ) : (
            <div className="w-full overflow-x-auto border border-zinc-800 bg-[#090e11] rounded">
              <table className="w-full text-left border-collapse font-mono text-xs">
                <thead className="bg-[#0c1216] border-b border-zinc-800">
                  <tr>
                    <th className="w-[26%] px-4 py-3.5 text-left text-zinc-400 uppercase tracking-wider">
                      TÊN SỰ KIỆN &amp; MÙA GIẢI
                    </th>
                    <th className="w-[18%] px-3.5 py-3.5 text-left text-zinc-400 uppercase tracking-wider">
                      THỜI GIAN TỔ CHỨC
                    </th>
                    <th className="w-[12%] px-3.5 py-3.5 text-left text-zinc-400 uppercase tracking-wider">
                      QUY MÔ ĐỘI THI
                    </th>
                    <th className="w-[12%] px-2.5 py-3.5 text-center text-zinc-400 uppercase tracking-wider">
                      TRẠNG THÁI
                    </th>
                    <th className="w-[32%] px-4 py-3.5 text-right text-zinc-400 uppercase tracking-wider">
                      THAO TÁC QUẢN TRỊ
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {paginatedEvents.map((ev, idx) => {
                    const evId = pickId(ev) || `ev-${idx}`;
                    const evName = ev.eventName || ev.EventName || "Sự kiện SEAL";
                    const season = ev.season || ev.Season || "Summer";
                    const year = ev.year || ev.Year || 2026;
                    const startDate = ev.startDate || ev.StartDate;
                    const endDate = ev.endDate || ev.EndDate;
                    const maxTeams = ev.maxTeams || ev.MaxTeams || 50;
                    const teamCount = ev.teamCount || ev.TeamCount || 0;
                    const isActive = ev.status !== false && ev.Status !== false;

                    return (
                      <tr
                        key={evId}
                        className="hover:bg-white/[0.03] transition-colors"
                      >
                        <td className="px-4 py-3.5 align-middle">
                          <div className="flex flex-col gap-1 min-w-0 pr-2">
                            <span className="font-bold text-white truncate block" title={evName}>
                              {evName}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="px-1.5 py-0.5 text-[9px] font-bold bg-red-950/40 text-red-300 border border-red-500/30 rounded shrink-0">
                                {season} {year}
                              </span>
                              <span className="text-[10px] text-zinc-500 truncate" title={evId}>
                                ID: {evId}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="px-3.5 py-3.5 align-middle text-zinc-400 text-[11px]">
                          <div>BẮT ĐẦU: {startDate ? new Date(startDate).toLocaleDateString("vi-VN") : "TBD"}</div>
                          <div>KẾT THÚC: {endDate ? new Date(endDate).toLocaleDateString("vi-VN") : "TBD"}</div>
                        </td>

                        <td className="px-3.5 py-3.5 align-middle">
                          <div className="text-white font-bold">
                            <span>{teamCount}</span>
                            <span className="text-zinc-500 font-normal"> / {maxTeams} ĐỘI</span>
                          </div>
                        </td>

                        <td className="px-2.5 py-3.5 align-middle text-center">
                          <span
                            className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase rounded whitespace-nowrap ${
                              isActive
                                ? "bg-emerald-950/40 text-emerald-300 border border-emerald-500/40"
                                : "bg-zinc-800/50 text-zinc-400 border border-zinc-700"
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-400" : "bg-zinc-400"}`} />
                            {isActive ? "HOẠT ĐỘNG" : "TẠM DỪNG"}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 align-middle text-right">
                          <div className="inline-flex items-center justify-end gap-1.5 flex-wrap sm:flex-nowrap">
                            <button
                              type="button"
                              onClick={() => {
                                if (isActive) {
                                  setRevokingEvent(ev);
                                } else {
                                  setEditingEvent(ev);
                                }
                              }}
                              className="text-[10.5px] font-mono border border-red-500/40 bg-red-950/20 text-red-300 hover:bg-red-950/40 px-2 py-1 h-7 rounded cursor-pointer whitespace-nowrap font-bold transition-colors"
                              title={isActive ? "Thu hồi về bản nháp để chỉnh sửa sự kiện" : "Chỉnh sửa sự kiện & các vòng thi"}
                            >
                              SỬA
                            </button>

                            <Link href={`/admin/events/${evId}`}>
                              <button
                                type="button"
                                className="text-[10.5px] font-mono border border-zinc-700 hover:border-zinc-500 bg-[#141f23] text-zinc-300 hover:text-white px-2 py-1 h-7 rounded cursor-pointer whitespace-nowrap font-bold transition-colors"
                                title="Xem chi tiết và can thiệp sự kiện"
                              >
                                CHI TIẾT
                              </button>
                            </Link>

                            <Link href={`/admin/events/coordinators?eventId=${evId}`}>
                              <button
                                type="button"
                                className="text-[10.5px] font-mono border border-red-500/40 bg-red-950/20 text-red-300 hover:bg-red-950/40 px-2 py-1 h-7 rounded cursor-pointer whitespace-nowrap font-bold transition-colors"
                                title="Phân công Event Coordinator cho sự kiện này"
                              >
                                PHÂN CÔNG EC
                              </button>
                            </Link>

                            <Link href={`/coordinator/dashboard?eventId=${evId}`}>
                              <button
                                type="button"
                                className="text-[10.5px] font-mono bg-purple-950/20 border border-purple-500/30 text-purple-300 hover:bg-purple-950/40 px-2 py-1 h-7 rounded cursor-pointer whitespace-nowrap font-bold transition-colors"
                                title="Truy cập giao diện điều phối của sự kiện này"
                              >
                                GIÁM SÁT
                              </button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Deck */}
          {filteredEvents.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-zinc-800 font-mono text-xs">
              <div className="text-zinc-400">
                Hiển thị{" "}
                <span className="text-white font-bold">
                  {(safePage - 1) * PAGE_SIZE + 1}
                </span>
                {" - "}
                <span className="text-white font-bold">
                  {Math.min(safePage * PAGE_SIZE, filteredEvents.length)}
                </span>
                {" / "}
                <span className="text-red-400 font-bold">
                  {filteredEvents.length}
                </span>{" "}
                sự kiện (Tối đa {PAGE_SIZE}/trang)
              </div>

              {totalPages > 1 && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={safePage === 1}
                    className="h-8 px-2.5 text-xs font-mono border border-zinc-800 text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/5 cursor-pointer flex items-center gap-1 rounded bg-[#141f23]"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Trước</span>
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                    if (
                      totalPages > 7 &&
                      p !== 1 &&
                      p !== totalPages &&
                      Math.abs(p - safePage) > 1
                    ) {
                      if (p === 2 || p === totalPages - 1) {
                        return (
                          <span key={p} className="px-1 text-zinc-600 select-none">
                            ...
                          </span>
                        );
                      }
                      return null;
                    }

                    const isActive = p === safePage;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setCurrentPage(p)}
                        className={`h-8 w-8 rounded text-xs font-mono font-bold transition-all cursor-pointer ${
                          isActive
                            ? "bg-red-600 text-white shadow-md shadow-red-950/50 border border-red-500"
                            : "bg-[#141f23] text-zinc-400 hover:text-white hover:border-zinc-600 border border-zinc-800"
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={safePage === totalPages}
                    className="h-8 px-2.5 text-xs font-mono border border-zinc-800 text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/5 cursor-pointer flex items-center gap-1 rounded bg-[#141f23]"
                  >
                    <span>Sau</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Xác Nhận Thu Hồi Về Bản Nháp (Có Kiểm Tra Người Dùng/Đội Thi) */}
        {revokingEvent && (
          <RevokeDraftConfirmModal
            event={revokingEvent}
            onClose={() => setRevokingEvent(null)}
            onConfirmSuccess={(updatedEvent) => {
              refetch();
              setRevokingEvent(null);
              setEditingEvent(updatedEvent);
            }}
          />
        )}

        {/* Modal Chỉnh Sửa Sự Kiện Toàn Diện Cho Admin */}
        {editingEvent && (
          <ComprehensiveEventEditModal
            event={editingEvent}
            onClose={() => setEditingEvent(null)}
            onSuccess={() => {
              refetch();
              setEditingEvent(null);
            }}
          />
        )}
      </div>
    </div>
  );
}

export default AdminEventsView;
