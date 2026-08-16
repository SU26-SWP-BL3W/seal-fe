import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/models/apiClient";
import type { School, PagedResult } from "@/models/entities";

export const DEFAULT_SCHOOLS_LIST: School[] = [
  {
    id: "sch-01",
    schoolId: "sch-01",
    schoolName: "Đại học FPT HCM (FPTU)",
    code: "FPTU_HCM",
    address: "Khu Công Nghệ Cao, TP. Thủ Đức, TP. Hồ Chí Minh",
  },
  {
    id: "sch-02",
    schoolId: "sch-02",
    schoolName: "Đại học Bách Khoa HCM (HCMUT)",
    code: "HCMUT",
    address: "268 Lý Thường Kiệt, Quận 10, TP. Hồ Chí Minh",
  },
  {
    id: "sch-03",
    schoolId: "sch-03",
    schoolName: "Đại học Khoa học Tự nhiên (HCMUS)",
    code: "HCMUS",
    address: "227 Nguyễn Văn Cừ, Quận 5, TP. Hồ Chí Minh",
  },
  {
    id: "sch-04",
    schoolId: "sch-04",
    schoolName: "Đại học Công Nghệ Thông Tin (UIT)",
    code: "UIT",
    address: "Khu phố 6, P. Linh Trung, TP. Thủ Đức, TP. Hồ Chí Minh",
  },
  {
    id: "sch-05",
    schoolId: "sch-05",
    schoolName: "Đại học Văn Lang (VLU)",
    code: "VLU",
    address: "69/68 Đặng Thùy Trâm, Q. Bình Thạnh, TP. Hồ Chí Minh",
  },
  {
    id: "sch-06",
    schoolId: "sch-06",
    schoolName: "Đại học Bách Khoa Hà Nội (HUST)",
    code: "HUST",
    address: "Số 1 Đại Cồ Việt, Hai Bà Trưng, Hà Nội",
  },
];

/**
 * GET /api/Schools — Lấy danh sách trường học.
 * apiClient đã tự bóc 1 lớp BaseResponse (xem models/apiClient.ts response
 * interceptor), nên res.data ở đây đã LÀ PagedResult<School> — mảng thật nằm ở
 * res.data.data (1 lớp), không phải res.data.data.data (đã từng đoán sai 1 lớp
 * khiến trang luôn hiện "0 trường" dù DB có dữ liệu thật).
 */
export function useGetSchools() {
  return useQuery({
    queryKey: ["schools"],
    queryFn: async () => {
      const res = await apiClient.get<PagedResult<School> | School[]>("/Schools", {
        params: { PageNumber: 1, PageSize: 100 },
      });
      if (Array.isArray(res.data)) return res.data;
      if (Array.isArray(res.data?.data)) return res.data.data;
      return [];
    },
    staleTime: 1000 * 60 * 10,
  });
}

/** POST /api/Schools — Tạo trường mới (Admin) */
export function useCreateSchool() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { schoolName: string; code?: string; address?: string }) => {
      const res = await apiClient.post("/Schools", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schools"] });
    },
  });
}
