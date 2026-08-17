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
        "Content-Type": "multipart/form-data",
      },
    });

    return res.data;
  },
};
