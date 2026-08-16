"use client";

import { Check, X } from "lucide-react";
import type { MemberItem } from "@/viewModels/teamTypes";
import { MAX_MEMBERS, MIN_MEMBERS } from "./teamStatus";

export interface RegistrationRequirements {
  memberCount: number;
  hasEnoughMembers: boolean;
  membersWithoutProfile: MemberItem[];
}

export function buildRequirements(members: MemberItem[]): RegistrationRequirements {
  const memberCount = members.length;
  return {
    memberCount,
    hasEnoughMembers: memberCount >= MIN_MEMBERS && memberCount <= MAX_MEMBERS,
    // BE chặn chốt đăng ký khi thành viên chưa nộp hồ sơ thí sinh, không phải khi
    // hồ sơ chưa được duyệt — checklist phải bám đúng điều kiện đó.
    membersWithoutProfile: members.filter((m) => !m.hasStudentProfile),
  };
}

// Dùng chung cho cả banner trên trang lẫn hộp thoại ghi danh để hai nơi không
// bao giờ mô tả điều kiện khác nhau.
export function RegistrationChecklist({ requirements }: { requirements: RegistrationRequirements }) {
  const { memberCount, hasEnoughMembers, membersWithoutProfile } = requirements;

  const items = [
    {
      ok: hasEnoughMembers,
      label: `Đủ ${MIN_MEMBERS}–${MAX_MEMBERS} thành viên`,
      detail: `Hiện có ${memberCount} người`,
    },
    {
      ok: membersWithoutProfile.length === 0,
      label: "Mọi thành viên đã nộp hồ sơ thí sinh",
      detail:
        membersWithoutProfile.length === 0
          ? "Tất cả đã nộp hồ sơ"
          : `Chưa nộp: ${membersWithoutProfile.map((m) => m.fullName).join(", ")}`,
    },
  ];

  return (
    <ul className="flex flex-col gap-[var(--space-sm)]">
      {items.map((item) => (
        <li key={item.label} className="flex items-start gap-[var(--space-sm)]">
          {item.ok ? (
            <Check className="mt-0.5 size-4 shrink-0 text-[color:var(--color-success)]" aria-hidden="true" />
          ) : (
            <X className="mt-0.5 size-4 shrink-0 text-[color:var(--color-warning)]" aria-hidden="true" />
          )}
          <div className="min-w-0">
            <div className="font-mono text-xs text-[color:var(--text-primary)]">{item.label}</div>
            <div
              className={`font-mono text-[10px] text-pretty ${
                item.ok ? "text-[color:var(--text-muted)]" : "text-[color:var(--color-warning)]"
              }`}
            >
              {item.detail}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
