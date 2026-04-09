import type { Prisma } from "@prisma/client";
import { MessageType as DbMessageType } from "@prisma/client";
import { isDatabaseConfigured, prisma } from "./db";
import { resolveAssetUrl } from "./r2";

export type MessageType = "video" | "audio" | "image";

export interface Message {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  date: string;
  type: MessageType;
  speaker: string | null;
  scriptureReference: string | null;
  category: string | null;
  coverImageUrl: string | null;
  downloadUrl: string | null;
}

export interface GetMessagesOptions {
  limit?: number;
  search?: string;
  category?: string;
  speaker?: string;
  type?: MessageType;
}

const messageSelect = {
  id: true,
  slug: true,
  title: true,
  summary: true,
  description: true,
  type: true,
  speaker: true,
  scriptureReference: true,
  eventDate: true,
  publishedAt: true,
  createdAt: true,
  coverImageKey: true,
  mediaKey: true,
  category: {
    select: {
      name: true,
    },
  },
} as const;

type MessageRecord = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  type: "VIDEO" | "AUDIO" | "IMAGE";
  speaker: string | null;
  scriptureReference: string | null;
  eventDate: Date | null;
  publishedAt: Date | null;
  createdAt: Date;
  coverImageKey: string | null;
  mediaKey: string | null;
  category: { name: string } | null;
};

function formatDate(value: Date | null): string {
  if (!value) {
    return "Date to be confirmed";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(value);
}

function mapMessageType(type?: MessageType): DbMessageType | undefined {
  if (!type) {
    return undefined;
  }

  switch (type) {
    case "video":
      return DbMessageType.VIDEO;
    case "audio":
      return DbMessageType.AUDIO;
    case "image":
      return DbMessageType.IMAGE;
    default:
      return undefined;
  }
}

function buildWhereClause(
  options: GetMessagesOptions,
): Prisma.MessageWhereInput {
  const where: Prisma.MessageWhereInput = {
    status: "PUBLISHED",
  };

  if (options.search) {
    where.OR = [
      { title: { contains: options.search, mode: "insensitive" } },
      { summary: { contains: options.search, mode: "insensitive" } },
      { description: { contains: options.search, mode: "insensitive" } },
    ];
  }

  if (options.category) {
    where.category = {
      slug: options.category,
    };
  }

  if (options.speaker) {
    where.speaker = {
      contains: options.speaker,
      mode: "insensitive",
    };
  }

  const mappedType = mapMessageType(options.type);

  if (mappedType) {
    where.type = mappedType;
  }

  return where;
}

async function mapMessage(message: MessageRecord): Promise<Message> {
  return {
    id: message.id,
    slug: message.slug,
    title: message.title,
    summary: message.summary,
    description: message.description,
    date: formatDate(
      message.eventDate ?? message.publishedAt ?? message.createdAt,
    ),
    type: message.type.toLowerCase() as MessageType,
    speaker: message.speaker,
    scriptureReference: message.scriptureReference,
    category: message.category?.name ?? null,
    coverImageUrl: await resolveAssetUrl(message.coverImageKey),
    downloadUrl: await resolveAssetUrl(message.mediaKey),
  };
}

export async function getMessages(
  options: GetMessagesOptions = {},
): Promise<Message[]> {
  if (!isDatabaseConfigured()) {
    return [];
  }

  try {
    const records = await prisma.message.findMany({
      where: buildWhereClause(options),
      orderBy: [
        { publishedAt: "desc" },
        { eventDate: "desc" },
        { createdAt: "desc" },
      ],
      take: options.limit ?? 24,
      select: messageSelect,
    });

    return Promise.all(
      records.map((message) => mapMessage(message as MessageRecord)),
    );
  } catch {
    return [];
  }
}

export async function getMessageById(
  idOrSlug: string,
): Promise<Message | undefined> {
  if (!isDatabaseConfigured()) {
    return undefined;
  }

  try {
    const record = await prisma.message.findFirst({
      where: {
        status: "PUBLISHED",
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
      select: messageSelect,
    });

    if (!record) {
      return undefined;
    }

    return mapMessage(record as MessageRecord);
  } catch {
    return undefined;
  }
}
