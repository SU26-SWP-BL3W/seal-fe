import { LeaderboardView } from "@/views/team/LeaderboardView";

export default async function EventLeaderboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <LeaderboardView eventId={id} />;
}
