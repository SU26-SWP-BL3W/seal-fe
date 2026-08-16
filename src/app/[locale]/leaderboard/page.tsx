import { LeaderboardView } from "@/views/LeaderboardView";

export const metadata = {
  title: "Bảng Xếp Hạng Kết Quả — SEAL Hackathon",
  description: "Bảng xếp hạng chính thức, giải thưởng và điểm số các đội thi Hackathon",
};

export default function LeaderboardPage() {
  return <LeaderboardView eventId="event-seal-2026" />;
}
