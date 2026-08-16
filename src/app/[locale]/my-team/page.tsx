import { MyTeamView } from "@/views/MyTeamView";

// Route trong app/ luôn giữ MỎNG — chỉ render View tương ứng, không chứa logic.
export default function MyTeamPage() {
  return <MyTeamView />;
}
