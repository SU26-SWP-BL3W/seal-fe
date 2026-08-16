import { EventsDiscoveryView } from "@/views/EventsDiscoveryView";

// Route trong app/ luôn giữ MỎNG — chỉ render View tương ứng, không chứa logic.
export default function EventsPage() {
  return <EventsDiscoveryView />;
}
