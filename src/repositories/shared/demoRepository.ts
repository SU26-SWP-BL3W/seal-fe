import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/models/apiClient";

// Field/route đối chiếu trực tiếp DemoController.cs — chỉ Admin ([AdminAuthorize]).
// Dùng để sinh nhanh dữ liệu demo/QA thay vì tạo thủ công từng bước qua UI.

/** POST /api/Demo/setup-demo-events?targetDate= — 2 sự kiện demo (Nộp bài + Chấm điểm) quanh 1 ngày mốc. */
export function useSetupDemoEvents() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (targetDate: string) => {
      const { data } = await apiClient.post<boolean>("/Demo/setup-demo-events", undefined, {
        params: { targetDate },
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}

/** POST /api/Demo/setup-demo-appeal-event?targetDate= — 1 sự kiện demo ở giai đoạn Phúc khảo, đã có điểm. */
export function useSetupDemoAppealEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (targetDate: string) => {
      const { data } = await apiClient.post<boolean>("/Demo/setup-demo-appeal-event", undefined, {
        params: { targetDate },
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}

/**
 * POST /api/Demo/setup-full-event-demo?targetDate= — sinh TRỌN VẸN 1 sự kiện chuẩn quốc tế:
 * giải thưởng, mẫu tiêu chí, vòng/hạng mục, tài khoản BTC/Giám khảo/Cố vấn/25 thí sinh (5 đội),
 * bài nộp, nhận xét mentor, điểm chi tiết, xếp hạng, phúc khảo, thông báo hệ thống.
 */
export function useSetupFullEventDemo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (targetDate: string | undefined = undefined) => {
      const { data } = await apiClient.post<any>("/Demo/setup-full-event-demo", undefined, {
        params: targetDate ? { targetDate } : undefined,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}
