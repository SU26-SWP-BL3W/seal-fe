import type { Metadata } from "next";
import { EventDetailView } from "@/views/public/EventDetailView";

export const metadata: Metadata = {
  title: "Chi tiết sự kiện - SEAL",
  description: "Chi tiết sự kiện hackathon SEAL",
};

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id } = await params;
  return <EventDetailView eventId={id} />;
}
