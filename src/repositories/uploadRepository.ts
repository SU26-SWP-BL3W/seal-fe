import apiClient from "@/models/apiClient";

// StorageController.Upload thật chỉ trả { fileUrl }, KHÔNG có fileName/fileSize.
// apiClient đã bóc vỏ BaseResponse trong interceptor nên res.data ở đây CHÍNH LÀ
// UploadFileResponse, không phải BaseResponse<UploadFileResponse> — bản cũ đọc
// res.data như còn nguyên vỏ, khiến mọi nơi gọi .data.fileUrl luôn undefined.
export interface UploadFileResponse {
  fileUrl: string;
}

export const uploadRepository = {
  /** POST /api/Storage/upload — multipart/form-data, field "file". */
  async uploadFile(file: File): Promise<UploadFileResponse> {
    const formData = new FormData();
    formData.append("file", file);

    const res = await apiClient.post<UploadFileResponse>("/Storage/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return res.data;
  },
};
