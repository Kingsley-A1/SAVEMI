import type { Metadata } from "next";
import MessageTypeLibrary, {
  messageLibraryConfigs,
} from "../../components/MessageTypeLibrary";
import { getMessages } from "../../lib/messages";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Video Messages",
  description:
    "Watch SAVEMI video messages, Sabbath teachings, and Reflection at Eventide worship content.",
  openGraph: {
    title: "Video Messages | SAVEMI",
    description:
      "SAVEMI video messages, Sabbath teachings, and Reflection at Eventide worship content.",
  },
  alternates: { canonical: "/videos" },
};

interface VideosPageProps {
  searchParams: Promise<{ search?: string }>;
}

export default async function VideosPage({ searchParams }: VideosPageProps) {
  const params = await searchParams;
  const search = params.search?.trim() ?? "";
  const videoMessages = await getMessages({
    type: "video",
    search: search || undefined,
    limit: null,
  });

  return (
    <MessageTypeLibrary
      items={videoMessages}
      search={search}
      config={messageLibraryConfigs.video}
    />
  );
}
