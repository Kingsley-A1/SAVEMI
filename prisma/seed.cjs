const { PrismaClient, MessageStatus, MessageType } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

function getConfiguredAdminAccessCode() {
  const candidate = (
    process.env.ADMIN_ACCESS_CODE || process.env.ADMIN_PASSWORD || ""
  ).trim();

  return candidate.length === 6 ? candidate : null;
}

function formatAdminNameFromEmail(email) {
  const localPart = String(email).split("@")[0]?.trim();

  if (!localPart) {
    return "SAVEMI Admin";
  }

  return localPart
    .replace(/[._-]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

async function main() {
  await prisma.message.deleteMany();
  await prisma.category.deleteMany();

  const worshipCategory = await prisma.category.create({
    data: {
      name: "Vesper Worship",
      slug: "vesper-worship",
    },
  });

  const devotionCategory = await prisma.category.create({
    data: {
      name: "Devotional Reflections",
      slug: "devotional-reflections",
    },
  });

  await prisma.message.createMany({
    data: [
      {
        slug: "evening-reflection-hope-and-renewal",
        title: "Evening Reflection: Hope and Renewal",
        summary: "A calm reflection on trusting God at the close of day.",
        description:
          "A reflective message shaped to slow the pace of the evening and re-center attention on God's care, hope, and Sabbath peace.",
        type: MessageType.VIDEO,
        status: MessageStatus.PUBLISHED,
        placement: "STANDARD",
        speaker: "SAVEMI Ministry Team",
        scriptureReference: "Psalm 4:8",
        eventDate: new Date("2026-02-10T18:30:00.000Z"),
        publishedAt: new Date("2026-02-10T19:00:00.000Z"),
        categoryId: worshipCategory.id,
        coverImageKey: "/images/logo_background.jpg",
        mediaKey:
          "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
        durationSeconds: 178,
      },
      {
        slug: "vesper-hymns-evening-praise",
        title: "Vesper Hymns: Evening Praise",
        summary:
          "A devotional listening moment built around restful evening praise.",
        description:
          "A short set of devotional hymns intended to support quiet reflection and spiritual restoration as Sabbath worship approaches.",
        type: MessageType.AUDIO,
        status: MessageStatus.PUBLISHED,
        placement: "STANDARD",
        speaker: "SAVEMI Music Ministry",
        scriptureReference: "Psalm 92:1-2",
        eventDate: new Date("2026-02-17T18:30:00.000Z"),
        publishedAt: new Date("2026-02-17T19:00:00.000Z"),
        categoryId: worshipCategory.id,
        coverImageKey: "/images/logo_background.jpg",
        mediaKey:
          "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        durationSeconds: 372,
      },
      {
        slug: "sunset-reflections-restoration",
        title: "Sunset Reflections: Restoration",
        summary:
          "A visual reflection built around stillness, evening light, and renewal.",
        description:
          "A contemplative visual piece that pairs scripture-centered reflection with the quiet atmosphere of the SAVEMI visual identity.",
        type: MessageType.IMAGE,
        status: MessageStatus.PUBLISHED,
        placement: "STANDARD",
        speaker: "SAVEMI Creative Team",
        scriptureReference: "Matthew 11:28",
        eventDate: new Date("2026-01-30T18:30:00.000Z"),
        publishedAt: new Date("2026-01-30T19:00:00.000Z"),
        categoryId: devotionCategory.id,
        coverImageKey: "/images/logo_background.jpg",
        mediaKey: "/images/logo_background.jpg",
      },
    ],
  });
}

main()
  .then(() => seedAdmin())
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

async function seedAdmin() {
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@savemi.org").trim().toLowerCase();
  const adminPassword = getConfiguredAdminAccessCode();
  const adminName = process.env.ADMIN_NAME || formatAdminNameFromEmail(adminEmail);

  if (!adminPassword) {
    console.log(
      "Skipping admin seed: set ADMIN_ACCESS_CODE or ADMIN_PASSWORD to an exact 6-character value.",
    );
    return;
  }

  const passwordHash = await bcrypt.hash(adminPassword, 12);
  await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: { passwordHash, name: adminName },
    create: { email: adminEmail, passwordHash, name: adminName },
  });
  console.log("Admin user synced:", adminEmail);
}
