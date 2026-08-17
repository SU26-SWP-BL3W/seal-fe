import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/models/apiClient";
import type { PagedResult } from "@/models/types";

// Field/route đối chiếu trực tiếp TemplatesController.cs + Features/Templates/**/Models.
// ⚠️ BE hiện dùng 1 KHO TEMPLATE DÙNG CHUNG toàn hệ thống — chưa clone riêng cho từng sự
// kiện khi gán vào Track (`tracksRepository.useAssignTemplateToTrack`). Sửa template ở
// đây SẼ ảnh hưởng ngược mọi sự kiện đang gán nó, kể cả đã chấm dở. Đã bàn trong audit —
// hướng sửa (chưa làm): clone-on-assign khi gán template cho Track.

export interface CreateTemplatePayload {
  templateName: string;
  description?: string;
}

export interface TemplateCreated {
  id: string;
  templateName: string;
  description?: string | null;
  createdTime: string;
}

export function useCreateTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateTemplatePayload) => {
      const { data } = await apiClient.post<TemplateCreated>("/Templates", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
    },
  });
}

export interface UpdateTemplatePayload {
  templateName: string;
  description?: string;
}

export interface TemplateUpdated {
  id: string;
  templateName: string;
  description?: string | null;
  lastUpdatedTime: string;
}

export function useUpdateTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: UpdateTemplatePayload }) => {
      const { data } = await apiClient.put<TemplateUpdated>(`/Templates/${id}`, payload);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      queryClient.invalidateQueries({ queryKey: ["template", data.id] });
    },
  });
}

/** Xoá vĩnh viễn — BE nên chặn nếu template đang được Track nào gán (chưa xác nhận, kiểm khi test sống). */
export function useDeleteTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.delete<boolean>(`/Templates/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
    },
  });
}

export interface AddCriteriaToTemplatePayload {
  criteriaId: string;
  weight: number;
  maxScore: number;
}

export function useAddCriteriaToTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: AddCriteriaToTemplatePayload }) => {
      const { data } = await apiClient.post<boolean>(`/Templates/${id}/criteria`, payload);
      return data;
    },
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["template", id] });
    },
  });
}

export interface UpdateTemplateCriteriaConfigPayload {
  weight: number;
  maxScore: number;
}

export function useUpdateTemplateCriteriaConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      criteriaId,
      payload,
    }: {
      id: string;
      criteriaId: string;
      payload: UpdateTemplateCriteriaConfigPayload;
    }) => {
      const { data } = await apiClient.put<boolean>(`/Templates/${id}/criteria/${criteriaId}`, payload);
      return data;
    },
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["template", id] });
    },
  });
}

export function useRemoveCriteriaFromTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, criteriaId }: { id: string; criteriaId: string }) => {
      const { data } = await apiClient.delete<boolean>(`/Templates/${id}/criteria/${criteriaId}`);
      return data;
    },
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["template", id] });
    },
  });
}

export interface TemplateCriteriaLine {
  criteriaId: string;
  criteriaName: string;
  description?: string | null;
  weight: number;
  maxScore: number;
}

export interface Template {
  id: string;
  templateName: string;
  description?: string | null;
  createdTime: string;
  lastUpdatedTime: string;
  criterias: TemplateCriteriaLine[];
}

export function useGetTemplateById(id: string | undefined) {
  return useQuery({
    queryKey: ["template", id],
    queryFn: async () => {
      const { data } = await apiClient.get<Template>(`/Templates/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export interface GetAllTemplatesParams {
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  isAscending?: boolean;
}

export function useGetAllTemplates(params: GetAllTemplatesParams = {}) {
  return useQuery({
    queryKey: ["templates", params],
    queryFn: async () => {
      const { data } = await apiClient.get<PagedResult<Template>>("/Templates", { params });
      return data;
    },
  });
}

const TEMPLATES_STORAGE_KEY = "seal_custom_templates";
const DELETED_TEMPLATES_KEY = "seal_deleted_template_ids";

export function getStoredCustomTemplates(): Template[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(TEMPLATES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveStoredCustomTemplates(list: Template[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

export function getDeletedTemplateIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(DELETED_TEMPLATES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveDeletedTemplateId(id: string) {
  if (typeof window === "undefined" || !id) return;
  try {
    const deleted = getDeletedTemplateIds();
    if (!deleted.includes(id)) {
      localStorage.setItem(DELETED_TEMPLATES_KEY, JSON.stringify([...deleted, id]));
    }
  } catch {
    // ignore
  }
}

export function useGetTemplates(params?: { PageNumber?: number; PageSize?: number }) {
  return useQuery({
    queryKey: ["templates", params],
    queryFn: async () => {
      let apiList: Template[] = [];
      try {
        const res = await apiClient.get<PagedResult<Template>>("/Templates", {
          params: { PageNumber: 1, PageSize: 100, ...params },
        });
        apiList = res.data?.data ?? [];
      } catch (err: any) {
        console.warn("[SEAL BE-DATA MISSING] GET /api/Templates error:", err?.message);
      }

      const deletedIds = getDeletedTemplateIds();
      const customTemplates = getStoredCustomTemplates();
      const combined = [...customTemplates, ...apiList];
      const uniqueMap = new Map<string, Template>();

      combined.forEach((item: any) => {
        const itemId = item.id || item.Id || item.templateId || item.TemplateId;
        if (itemId && !deletedIds.includes(itemId) && !uniqueMap.has(itemId)) {
          uniqueMap.set(itemId, item);
        }
      });

      return Array.from(uniqueMap.values());
    },
  });
}

export const useGetTemplate = useGetTemplateById;

export const templatesRepository = {
  async getTemplates(): Promise<Template[]> {
    try {
      const res = await apiClient.get<PagedResult<Template>>("/Templates", {
        params: { PageNumber: 1, PageSize: 100 },
      });
      const deletedIds = getDeletedTemplateIds();
      return (res.data?.data ?? []).filter((t: any) => !deletedIds.includes(t.id || t.Id));
    } catch {
      return [];
    }
  },
  async getTemplateById(id: string): Promise<Template | null> {
    try {
      const res = await apiClient.get<Template>(`/Templates/${id}`);
      return res.data;
    } catch {
      return null;
    }
  },
  async createTemplate(payload: CreateTemplatePayload): Promise<TemplateCreated> {
    const res = await apiClient.post<TemplateCreated>("/Templates", payload);
    return res.data;
  },
  async updateTemplate(id: string, payload: UpdateTemplatePayload): Promise<TemplateUpdated> {
    const res = await apiClient.put<TemplateUpdated>(`/Templates/${id}`, payload);
    return res.data;
  },
  async deleteTemplate(id: string): Promise<boolean> {
    if (id) {
      saveDeletedTemplateId(id);
      const remainingCustom = getStoredCustomTemplates().filter(
        (t: any) => (t.id || t.Id || t.templateId || t.TemplateId) !== id
      );
      saveStoredCustomTemplates(remainingCustom);
    }
    try {
      const res = await apiClient.delete<boolean>(`/Templates/${id}`);
      return res.data ?? true;
    } catch {
      return true;
    }
  },
  async addCriteriaToTemplate(id: string, payload: AddCriteriaToTemplatePayload): Promise<boolean> {
    const res = await apiClient.post<boolean>(`/Templates/${id}/criteria`, payload);
    return res.data;
  },
  async removeCriteriaFromTemplate(id: string, criteriaId: string): Promise<boolean> {
    const res = await apiClient.delete<boolean>(`/Templates/${id}/criteria/${criteriaId}`);
    return res.data;
  },
};
