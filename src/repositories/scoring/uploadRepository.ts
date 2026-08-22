import apiClient from "@/models/apiClient";

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
        "Content-Type": undefined, // Để Axios / browser tự tạo multipart/form-data; boundary=...
      },
    });

    const raw = res.data as any;
    const url = raw?.fileUrl || raw?.FileUrl || raw?.data?.fileUrl || (typeof raw === "string" ? raw : "");
    return { fileUrl: url };
  },
};
