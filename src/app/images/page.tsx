import type { Metadata } from "next";
import MessageTypeLibrary, {
  messageLibraryConfigs,
} from "../../components/MessageTypeLibrary";
import { getMessages } from "../../lib/messages";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Image Messages",
  description:
    "View SAVEMI visual Sabbath messages, scripture reflections, and shareable ministry images.",
  openGraph: {
    title: "Image Messages | SAVEMI",
    description:
      "SAVEMI visual Sabbath messages, scripture reflections, and shareable ministry images.",
  },
  alternates: { canonical: "/images" },
};

interface ImagesPageProps {
  searchParams: Promise<{ search?: string }>;
}

export default async function ImagesPage({ searchParams }: ImagesPageProps) {
  const params = await searchParams;
  const search = params.search?.trim() ?? "";
  const imageMessages = await getMessages({
    type: "image",
    search: search || undefined,
    limit: null,
  });

  return (
    <MessageTypeLibrary
      items={imageMessages}
      search={search}
      config={messageLibraryConfigs.image}
    />
  );
}
