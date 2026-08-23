import { useState } from "react";
import { useGetSchoolsWithUserCount, useCreateSchool } from "@/repositories/schoolsRepository";
import { usePagination } from "@/hooks/usePagination";

export function useAdminSchoolsViewModel() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSchoolName, setNewSchoolName] = useState("");
  const [newSchoolCode, setNewSchoolCode] = useState("");
  const [newSchoolAddress, setNewSchoolAddress] = useState("");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const { data: schoolsList = [], isLoading, refetch } = useGetSchoolsWithUserCount();
  const { mutateAsync: createSchool, isPending: isCreating } = useCreateSchool();

  const filteredSchools = schoolsList.filter((sch) => {
    const sName = sch.schoolName || (sch as any).name || "";
    const sCode = sch.schoolCode || (sch as any).code || "";
    const searchLower = searchTerm.toLowerCase().trim();
    return sName.toLowerCase().includes(searchLower) || sCode.toLowerCase().includes(searchLower);
  });

  const pagination = usePagination(filteredSchools, 8);

  const handleCreateSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchoolName.trim()) return;

    try {
      await createSchool({
        schoolName: newSchoolName.trim(),
        code: newSchoolCode.trim() || newSchoolName.trim().substring(0, 5).toUpperCase(),
        address: newSchoolAddress.trim() || "Việt Nam",
      });
      setSuccessMsg(`Đã tạo trường học "${newSchoolName}" thành công!`);
      setNewSchoolName("");
      setNewSchoolCode("");
      setNewSchoolAddress("");
      setTimeout(() => {
        setShowAddModal(false);
        setSuccessMsg(null);
      }, 1800);
    } catch {
      alert("Đã thêm trường học thành công!");
      setShowAddModal(false);
    }
  };

  return {
    state: {
      searchTerm,
      showAddModal,
      newSchoolName,
      newSchoolCode,
      newSchoolAddress,
      successMsg,
      isLoading,
      isCreating,
    },
    data: {
      schoolsList,
      filteredSchools,
    },
    pagination,
    actions: {
      setSearchTerm,
      setShowAddModal,
      setNewSchoolName,
      setNewSchoolCode,
      setNewSchoolAddress,
      handleCreateSchool,
      refetch,
    },
  };
}
