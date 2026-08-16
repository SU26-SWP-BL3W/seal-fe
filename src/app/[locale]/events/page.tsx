import type { Metadata } from "next";
import { EventsDiscoveryView } from "@/views/EventsDiscoveryView";

export const metadata: Metadata = {
  title: "Danh sách sự kiện - SEAL",
  description: "Danh sách các cuộc thi hackathon và sự kiện công nghệ SEAL",
};

export default function EventsDiscoveryPage() {
  return <EventsDiscoveryView />;
}
