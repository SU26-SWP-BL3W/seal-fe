import { LeaderboardView } from "@/views/LeaderboardView";

export default async function LeaderboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <LeaderboardView eventId={id} />;
}
