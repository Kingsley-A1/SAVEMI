import type { Metadata } from "next";
import MessageTypeLibrary, {
  messageLibraryConfigs,
} from "../../components/MessageTypeLibrary";
import { getMessages } from "../../lib/messages";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Audio Messages",
  description:
    "Listen to SAVEMI audio devotionals, Sabbath reflections, and vesper teachings rooted in Scripture.",
  openGraph: {
    title: "Audio Messages | SAVEMI",
    description:
      "SAVEMI audio devotionals, Sabbath reflections, and vesper teachings.",
  },
  alternates: { canonical: "/audio" },
};

interface AudioPageProps {
  searchParams: Promise<{ search?: string }>;
}

export default async function AudioPage({ searchParams }: AudioPageProps) {
  const params = await searchParams;
  const search = params.search?.trim() ?? "";
  const audioMessages = await getMessages({
    type: "audio",
    search: search || undefined,
    limit: null,
  });

  return (
    <MessageTypeLibrary
      items={audioMessages}
      search={search}
      config={messageLibraryConfigs.audio}
    />
  );
}
