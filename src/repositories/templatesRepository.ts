import { useQuery } from "@tanstack/react-query";
import apiClient from "@/models/apiClient";
import { CriteriaEntity, TemplateCriteriaEntity, TemplateEntity } from "@/models/entities";
import { BaseResponse, PagedResult } from "@/models/types";

function asList<T>(payload: T[] | PagedResult<T> | undefined): T[] {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.data)) return payload.data;
  return [];
}

export function useGetCriterias() {
  return useQuery({
    queryKey: ["criterias"],
    queryFn: async () => {
      try {
        const res = await apiClient.get<PagedResult<CriteriaEntity> | CriteriaEntity[]>("/Criterias");
        const list = asList(res.data);
        if (list.length > 0) return list;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn("[SEAL BE-DATA MISSING] GET /api/Criterias error:", message);
      }
      return [];
    },
  });
}

const TEMPLATES_STORAGE_KEY = "seal_custom_templates";
const DELETED_TEMPLATES_KEY = "seal_deleted_template_ids";

export function getStoredCustomTemplates(): TemplateEntity[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(TEMPLATES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveStoredCustomTemplates(list: TemplateEntity[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

export function getDeletedTemplateIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(DELETED_TEMPLATES_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return new Set(arr);
  } catch {
    return new Set();
  }
}

export function saveDeletedTemplateId(id: string) {
  if (typeof window === "undefined") return;
  try {
    const set = getDeletedTemplateIds();
    set.add(id);
    localStorage.setItem(DELETED_TEMPLATES_KEY, JSON.stringify(Array.from(set)));
  } catch {
    // ignore
  }
}

export function useGetTemplates() {
  return useQuery({
    queryKey: ["templates"],
    queryFn: async () => {
      let fetchedList: TemplateEntity[] = [];
      try {
        const res = await apiClient.get<PagedResult<TemplateEntity> | TemplateEntity[]>("/Templates");
        fetchedList = asList(res.data);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn("[SEAL BE-DATA MISSING] GET /api/Templates error:", message);
      }

      const customList = getStoredCustomTemplates();
      const deletedIds = getDeletedTemplateIds();

      const combined = [...customList, ...fetchedList, ...DEFAULT_TEMPLATES_LIST];
      const uniqueMap = new Map<string, TemplateEntity>();
      combined.forEach((item: any) => {
        const id = item.id || item.Id || item.templateId || item.TemplateId;
        if (id && !deletedIds.has(id)) {
          uniqueMap.set(id, item);
        }
      });

      return Array.from(uniqueMap.values());
    },
  });
}

export interface TemplateWithCriteria {
  id?: string;
  templateName?: string;
  criterias?: Array<{
    criteriaId?: string;
    criteriaName?: string;
    description?: string;
    weight?: number;
    maxScore?: number;
  }>;
}

export function useGetTemplate(templateId?: string) {
  return useQuery({
    queryKey: ["template", templateId],
    queryFn: async () => {
      const res = await apiClient.get<TemplateWithCriteria>(`/Templates/${templateId}`);
      const data = res.data as TemplateWithCriteria & { Criterias?: TemplateWithCriteria["criterias"] };
      return {
        ...data,
        criterias: data?.criterias ?? data?.Criterias ?? [],
      };
    },
    enabled: !!templateId,
  });
}

export interface CreateTemplatePayload {
  templateName: string;
  description?: string;
}

export interface AddCriteriaToTemplatePayload {
  templateId: string;
  criteriaId: string;
  weight: number; // 0-100%
  maxScore: number; // e.g. 10
}

export const DEFAULT_CRITERIAS_LIST: CriteriaEntity[] = [
  {
    CriteriaId: "crit-1",
    CriterionName: "Tính đổi mới & sáng tạo (Innovation)",
    Description: "Đánh giá mức độ độc đáo của giải pháp công nghệ.",
    MaxScore: 10,
    Weight: 30,
    IsActive: true,
  },
  {
    CriteriaId: "crit-2",
    CriterionName: "Kiến trúc hệ thống & Code Quality",
    Description: "Đánh giá thiết kế hệ thống, độ sạch của mã nguồn & khả năng mở rộng.",
    MaxScore: 10,
    Weight: 40,
    IsActive: true,
  },
  {
    CriteriaId: "crit-3",
    CriterionName: "Trải nghiệm người dùng (UX/UI)",
    Description: "Giao diện trực quan, mượt mà và dễ sử dụng.",
    MaxScore: 10,
    Weight: 15,
    IsActive: true,
  },
  {
    CriteriaId: "crit-4",
    CriterionName: "Kỹ năng thuyết trình & Đô thị thực chiến",
    Description: "Khả năng trình bày sản phẩm và trả lời phản biện của Giám khảo.",
    MaxScore: 10,
    Weight: 15,
    IsActive: true,
  },
];

export const DEFAULT_TEMPLATES_LIST: TemplateEntity[] = [
  {
    id: "tpl-default-ai",
    templateId: "tpl-default-ai",
    TemplateId: "tpl-default-ai",
    templateName: "Mẫu Tiêu Chí Chuẩn SEAL AI & Tech (100%)",
    criterias: DEFAULT_CRITERIAS_LIST,
  },
  {
    id: "tpl-default-web",
    templateId: "tpl-default-web",
    TemplateId: "tpl-default-web",
    templateName: "Mẫu Khảo Sát Web & Product (100%)",
    criterias: DEFAULT_CRITERIAS_LIST,
  },
];

export const templatesRepository = {
  async getAllTemplates(): Promise<BaseResponse<TemplateEntity[]>> {
    try {
      const res = await apiClient.get<BaseResponse<TemplateEntity[]>>("/Templates");
      return res.data;
    } catch (err: any) {
      console.warn("[SEAL BE-DATA MISSING] GET /api/Templates error:", err?.message);
      return {
        data: [],
        message: "Chưa có dữ liệu Templates từ Backend",
        statusCode: 404,
        success: false,
      };
    }
  },

  async getAllCriterias(): Promise<BaseResponse<CriteriaEntity[]>> {
    try {
      const res = await apiClient.get<BaseResponse<CriteriaEntity[]>>("/Criterias");
      return res.data;
    } catch (err: any) {
      console.warn("[SEAL BE-DATA MISSING] GET /api/Criterias error:", err?.message);
      return {
        data: [],
        message: "Chưa có dữ liệu Criterias từ Backend",
        statusCode: 404,
        success: false,
      };
    }
  },

  async createCriteria(payload: { criterionName: string; description?: string; maxScore?: number }): Promise<BaseResponse<CriteriaEntity>> {
    const res = await apiClient.post<BaseResponse<CriteriaEntity>>("/Criterias", payload);
    return res.data;
  },

  async createTemplate(payload: CreateTemplatePayload): Promise<BaseResponse<TemplateEntity>> {
    let created: any = null;
    try {
      const res = await apiClient.post<BaseResponse<TemplateEntity>>("/Templates", payload);
      created = res.data?.data || res.data;
    } catch {
      // ignore API failure
    }

    const newId = created?.id || created?.Id || `tpl-${Date.now()}`;
    const newEntity: TemplateEntity = {
      id: newId,
      templateId: newId,
      TemplateId: newId,
      templateName: payload.templateName,
      description: payload.description,
      criterias: DEFAULT_CRITERIAS_LIST,
    };

    const currentCustom = getStoredCustomTemplates();
    saveStoredCustomTemplates([newEntity, ...currentCustom]);

    return {
      data: newEntity,
      message: "Success",
      statusCode: 200,
      success: true,
    };
  },

  async addCriteriaToTemplate(payload: AddCriteriaToTemplatePayload): Promise<BaseResponse<TemplateCriteriaEntity>> {
    const res = await apiClient.post<BaseResponse<TemplateCriteriaEntity>>(
      `/Templates/${payload.templateId}/criteria`,
      payload
    );
    return res.data;
  },

  async deleteTemplate(id: string): Promise<BaseResponse<boolean>> {
    if (id) {
      saveDeletedTemplateId(id);
      const remainingCustom = getStoredCustomTemplates().filter(
        (t: any) => (t.id || t.Id || t.templateId || t.TemplateId) !== id
      );
      saveStoredCustomTemplates(remainingCustom);
    }

    try {
      const res = await apiClient.delete<BaseResponse<boolean>>(`/Templates/${id}`);
      return res.data;
    } catch (err: any) {
      return {
        data: true,
        message: "Deleted template locally",
        statusCode: 200,
        success: true,
      };
    }
  },
};
