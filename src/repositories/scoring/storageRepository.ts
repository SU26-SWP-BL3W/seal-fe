import { useMutation } from "@tanstack/react-query";
import apiClient from "@/models/apiClient";

// Field/route đối chiếu trực tiếp StorageController.cs.
//
// ⚠️ Controller này KHÔNG theo convention BaseResponse như mọi controller khác khi
// lỗi — `Upload`/`Download` trả thẳng chuỗi lỗi qua `BadRequest(string)` /
// `StatusCode(500, string)`, không bọc `{data,message,statusCode,success}`. Interceptor
// dùng chung ở apiClient.ts vẫn hoạt động (nhánh "tolerate non-enveloped response"),
// nhưng `err.response.data` ở đây là STRING thô, không phải `ApiError{message,...}`
// như các repository khác — component bắt lỗi ở đây không tự tin `err.response.data.message`.

export interface UploadFileResult {
  fileUrl: string;
}

/** POST /Storage/upload — multipart/form-data, field "file" + query "folder" (mặc định "general"). */
export function useUploadFile() {
  return useMutation({
    mutationFn: async ({ file, folder = "general" }: { file: File; folder?: string }) => {
      const formData = new FormData();
      formData.append("file", file);
      const { data } = await apiClient.post<UploadFileResult>("/Storage/upload", formData, {
        params: { folder },
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    },
  });
}

/**
 * GET /Storage/download?fileUrl=... — [Authorize], nên KHÔNG dùng `<a href>` thẳng
 * (trình duyệt không gắn Bearer header khi điều hướng link) — phải fetch qua JS rồi
 * tự tạo object URL. Trả về Blob thô; nơi gọi tự quyết hiển thị (ảnh/preview) hay tải
 * xuống (tạo `<a>` ẩn + click, giống pattern export CSV ở scoresRepository.ts).
 */
export async function downloadFile(fileUrl: string): Promise<Blob> {
  const response = await apiClient.get("/Storage/download", {
    params: { fileUrl },
    responseType: "blob",
  });
  return response.data as Blob;
}
