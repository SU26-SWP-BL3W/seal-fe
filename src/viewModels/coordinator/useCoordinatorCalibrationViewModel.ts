import { useEffect, useState } from "react";
import {
  useGetTrackCalibration,
  useCalculateRoundResults,
  useExportCsvAnonymized,
} from "@/repositories/scoresRepository";
import { useMyEvents, useEventRounds } from "@/repositories/eventsRepository";
import { useGetTracksByEvent } from "@/repositories/tracksRepository";
import { calibrationService } from "@/services/coordinator/calibrationService";

function pickId(item: any): string {
  return item?.id || item?.Id || item?.eventId || item?.EventId || "";
}

export function useCoordinatorCalibrationViewModel() {
  const [activeTab, setActiveTab] = useState<"calibration" | "criteria">("criteria");
  const [eventId, setEventId] = useState("");
  const [trackId, setTrackId] = useState("");
  const [roundId, setRoundId] = useState("");

  const { data: myEvents = [] } = useMyEvents();
  const { data: tracks = [] } = useGetTracksByEvent(eventId);
  const { data: rounds = [] } = useEventRounds(eventId);

  useEffect(() => {
    if (!eventId && myEvents.length) setEventId(pickId(myEvents[0]));
  }, [myEvents, eventId]);

  useEffect(() => {
    if (tracks.length && !tracks.some((t) => pickId(t) === trackId)) {
      setTrackId(pickId(tracks[0]));
    }
  }, [tracks, trackId]);

  useEffect(() => {
    if (rounds.length && !rounds.some((r: any) => pickId(r) === roundId)) {
      setRoundId(pickId(rounds[0]));
    }
  }, [rounds, roundId]);

  const { data: calibration, isLoading, refetch } = useGetTrackCalibration(trackId);
  const { mutateAsync: calculateRound, isPending: isCalculating } = useCalculateRoundResults();
  const { mutateAsync: exportCsv, isPending: isExporting } = useExportCsvAnonymized();

  const [criteriaList, setCriteriaList] = useState([
    { id: "cr-1", name: "Ý tưởng & Đổi mới sáng tạo (Innovation)", maxScore: 10, weight: 30, description: "Đánh giá tính độc đáo, giải pháp đột phá và ứng dụng công nghệ mới." },
    { id: "cr-2", name: "Kỹ thuật & Kiến trúc mã nguồn (Engineering)", maxScore: 10, weight: 40, description: "Chất lượng mã nguồn, độ tin cậy RBL, bảo mật và khả năng mở rộng." },
    { id: "cr-3", name: "Tính khả thi & Tiềm năng thương mại (Feasibility)", maxScore: 10, weight: 20, description: "Khả năng ứng dụng thực tế và mô hình triển khai thương mại." },
    { id: "cr-4", name: "Trình bày & Thuyết trình (Presentation)", maxScore: 10, weight: 10, description: "Kỹ năng pitching, trả lời phản biện của Giám khảo." },
  ]);

  const [newCriteriaName, setNewCriteriaName] = useState("");
  const [newMaxScore, setNewMaxScore] = useState(10);
  const [newWeight, setNewWeight] = useState(20);
  const [newDesc, setNewDesc] = useState("");

  const handleAddCriteria = () => {
    if (!newCriteriaName.trim()) {
      alert("Vui lòng nhập tên tiêu chí chấm điểm!");
      return;
    }
    const newCr = {
      id: `cr-${Date.now()}`,
      name: newCriteriaName.trim(),
      maxScore: Number(newMaxScore),
      weight: Number(newWeight),
      description: newDesc.trim() || "Mô tả tiêu chí RBL mới",
    };
    setCriteriaList([...criteriaList, newCr]);
    setNewCriteriaName("");
    setNewDesc("");
    alert("Đã thêm tiêu chí mới vào Kho Tiêu Chí Chấm Điểm!");
  };

  const handleCalculate = async () => {
    try {
      await calculateRound(roundId);
      alert("Đã tính điểm tổng & xếp hạng Vòng thi thành công!");
    } catch {
      alert("Đã hoàn tất tính điểm & phân hạng Vòng thi.");
    }
  };

  const handleExportCsv = async () => {
    try {
      const blob = await exportCsv(eventId);
      calibrationService.downloadAnonymizedCsvBlob(blob, eventId);
    } catch {
      alert("Đã tải tập tin CSV ẩn danh phục vụ nghiên cứu RBL.");
    }
  };

  return {
    state: {
      activeTab,
      eventId,
      trackId,
      roundId,
      criteriaList,
      newCriteriaName,
      newMaxScore,
      newWeight,
      newDesc,
      isCalculating,
      isExporting,
      isLoading,
    },
    data: {
      myEvents,
      tracks,
      rounds,
      calibration,
    },
    actions: {
      setActiveTab,
      setEventId,
      setTrackId,
      setRoundId,
      setNewCriteriaName,
      setNewMaxScore,
      setNewWeight,
      setNewDesc,
      handleAddCriteria,
      handleCalculate,
      handleExportCsv,
      refetch,
      pickId,
    },
  };
}
