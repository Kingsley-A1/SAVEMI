const {
  PrismaClient,
  BookAvailability,
  MessageStatus,
  MessageType,
} = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

function getConfiguredAdminAccessCode() {
  const candidate = (
    process.env.ADMIN_ACCESS_CODE ||
    process.env.ADMIN_PASSWORD ||
    ""
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
  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction) {
    // Never delete content in production. The seed script is additive in prod —
    // it only bootstraps the admin user. Run migrations or a dedicated import
    // script to manage production data.
    console.warn(
      "[seed] Running in production mode — destructive resets are disabled. " +
      "Only the admin account will be bootstrapped.",
    );
  } else {
    // Development: wipe and rebuild sample content for a clean slate.
    console.log("[seed] Development mode — clearing existing content...");
    await prisma.quote.deleteMany();
    await prisma.book.deleteMany();
    await prisma.message.deleteMany();
    await prisma.category.deleteMany();
  }

  if (!isProduction) {
    const reflectionCategory = await prisma.category.create({
    data: {
      name: "Reflection at Eventide",
      slug: "reflection-at-eventide",
    },
  });

  const teachingCategory = await prisma.category.create({
    data: {
      name: "Sabbath Teachings",
      slug: "sabbath-teachings",
    },
  });

  const worshipCategory = await prisma.category.create({
    data: {
      name: "Vesper Worship",
      slug: "vesper-worship",
    },
  });

  await prisma.message.createMany({
    data: [
      {
        slug: "gods-grand-plan-during-sabbath-hours",
        title: "God's Grand Plan During Sabbath Hours",
        summary:
          "A Reflection at Eventide meditation on the Sabbath as a time for spiritual understanding, stillness, and renewed focus on God's purpose.",
        description:
          "This SAVEMI reflection draws believers into the biblical meaning of the seventh-day Sabbath, inviting them to rest, reflect, and recover while considering God's larger plan for humanity.",
        type: MessageType.IMAGE,
        status: MessageStatus.PUBLISHED,
        placement: "HERO",
        speaker: "Pastor Odor Victor T.",
        scriptureReference: "Genesis 2:2-3",
        eventDate: new Date("2026-04-24T18:30:00.000Z"),
        publishedAt: new Date("2026-04-24T19:00:00.000Z"),
        categoryId: reflectionCategory.id,
        coverImageKey: "/images/logo_background.jpg",
        mediaKey: "/images/logo_background.jpg",
      },
      {
        slug: "blinded-by-difficulties",
        title: "Blinded by Difficulties",
        summary:
          "A pastoral exhortation for believers navigating seasons where challenges seem louder than faith.",
        description:
          "This message addresses the spiritual danger of allowing trials to distort vision, and calls the listener back to trust, endurance, and Sabbath-centered reflection.",
        type: MessageType.VIDEO,
        status: MessageStatus.PUBLISHED,
        placement: "STANDARD",
        speaker: "Pastor Odor Victor T.",
        scriptureReference: "2 Corinthians 4:8-9",
        eventDate: new Date("2026-04-10T18:30:00.000Z"),
        publishedAt: new Date("2026-04-10T19:00:00.000Z"),
        categoryId: teachingCategory.id,
        coverImageKey: "/images/logo_background.jpg",
        mediaKey: null,
      },
      {
        slug: "conducting-your-funeral",
        title: "Conducting Your Funeral",
        summary:
          "A solemn but hopeful teaching on spiritual death, surrender, and the newness of life found in Christ.",
        description:
          "SAVEMI frames this theme as a call to die to self, embrace rebirth in Christ, and experience the kind of restoration that the Sabbath rhythm is meant to cultivate.",
        type: MessageType.VIDEO,
        status: MessageStatus.PUBLISHED,
        placement: "STANDARD",
        speaker: "Pastor Odor Victor T.",
        scriptureReference: "Romans 6:4",
        eventDate: new Date("2026-03-27T18:30:00.000Z"),
        publishedAt: new Date("2026-03-27T19:00:00.000Z"),
        categoryId: teachingCategory.id,
        coverImageKey: "/images/logo_background.jpg",
        mediaKey: null,
      },
      {
        slug: "rest-reflect-and-recover",
        title: "Rest, Reflect, and Recover",
        summary:
          "A SAVEMI devotional audio moment shaped around meditation, healing, and renewal through the Sabbath principle.",
        description:
          "This devotional listening piece emphasizes the vesper hours as a sacred invitation to quiet reflection, recovery from life's pressures, and renewed dependence on God.",
        type: MessageType.AUDIO,
        status: MessageStatus.PUBLISHED,
        placement: "STANDARD",
        speaker: "SAVEMI Ministry Team",
        scriptureReference: "Matthew 11:28",
        eventDate: new Date("2026-04-03T18:30:00.000Z"),
        publishedAt: new Date("2026-04-03T19:00:00.000Z"),
        categoryId: worshipCategory.id,
        coverImageKey: "/images/logo_background.jpg",
        mediaKey: null,
        durationSeconds: 540n,
      },
    ],
  });

  await prisma.book.createMany({
    data: [
      {
        slug: "the-pilgrims-progress",
        title: "The Pilgrim's Progress",
        tagline:
          "A classic allegory of the Christian journey from conviction to eternal hope.",
        description:
          "John Bunyan's enduring work follows Christian on his pilgrimage toward the Celestial City, making it a strong fit for SAVEMI's emphasis on perseverance, spiritual reflection, and biblical endurance.",
        author: "John Bunyan",
        coverImageKey: "/images/logo_background.jpg",
        downloadUrl: "https://www.ccel.org/ccel/bunyan/pilgrim.html",
        priceLabel: "Free",
        format: "Web / eBook source",
        pageCount: 324,
        featured: true,
        availability: BookAvailability.FREE,
        status: MessageStatus.PUBLISHED,
        publishedAt: new Date("2026-05-01T09:00:00.000Z"),
      },
      {
        slug: "the-practice-of-the-presence-of-god",
        title: "The Practice of the Presence of God",
        tagline:
          "Short spiritual counsels on living with constant awareness of God.",
        description:
          "Brother Lawrence's reflections encourage a devotional life rooted in quiet faithfulness, inward communion, and the steady awareness of God's nearness.",
        author: "Brother Lawrence",
        coverImageKey: "/images/logo_background.jpg",
        downloadUrl: "https://www.ccel.org/ccel/lawrence/practice.html",
        priceLabel: "Free",
        format: "Web / eBook source",
        pageCount: 96,
        featured: true,
        availability: BookAvailability.FREE,
        status: MessageStatus.PUBLISHED,
        publishedAt: new Date("2026-05-01T09:05:00.000Z"),
      },
      {
        slug: "all-of-grace",
        title: "All of Grace",
        tagline:
          "A clear gospel-centered appeal to rest fully in the grace of Christ.",
        description:
          "Charles Spurgeon explains salvation by grace with unusual clarity and warmth, making this a practical discipleship resource for readers who need assurance and spiritual direction.",
        author: "Charles H. Spurgeon",
        coverImageKey: "/images/logo_background.jpg",
        downloadUrl: "https://www.ccel.org/ccel/spurgeon/grace",
        priceLabel: "Free",
        format: "Web / eBook source",
        pageCount: 152,
        featured: false,
        availability: BookAvailability.FREE,
        status: MessageStatus.PUBLISHED,
        publishedAt: new Date("2026-05-01T09:10:00.000Z"),
      },
    ],
  });

  await prisma.quote.createMany({
    data: [
      {
        slug: "remember-the-sabbath-day",
        title: "Remember the Sabbath",
        text: "Remember the sabbath day, to keep it holy.",
        attribution: "Scripture",
        source: "King James Version",
        scriptureReference: "Exodus 20:8",
        imageKey: "/images/logo_background.jpg",
        featured: true,
        status: MessageStatus.PUBLISHED,
        publishedAt: new Date("2026-05-01T09:15:00.000Z"),
      },
      {
        slug: "there-remaineth-rest",
        title: "There Remaineth Rest",
        text: "There remaineth therefore a rest to the people of God.",
        attribution: "Scripture",
        source: "King James Version",
        scriptureReference: "Hebrews 4:9",
        imageKey: "/images/logo_background.jpg",
        featured: true,
        status: MessageStatus.PUBLISHED,
        publishedAt: new Date("2026-05-01T09:20:00.000Z"),
      },
      {
        slug: "come-unto-me-and-rest",
        title: "Come Unto Me",
        text:
          "Come unto me, all ye that labour and are heavy laden, and I will give you rest.",
        attribution: "Jesus Christ",
        source: "King James Version",
        scriptureReference: "Matthew 11:28",
        imageKey: "/images/logo_background.jpg",
        featured: false,
        status: MessageStatus.PUBLISHED,
        publishedAt: new Date("2026-05-01T09:25:00.000Z"),
      },
    ],
  });
  } // end if (!isProduction)
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
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();

  if (!adminEmail) {
    console.error(
      "Skipping admin seed: ADMIN_EMAIL is not set. " +
      "Set it in your .env file and run db:seed again.",
    );
    return;
  }

  const adminPassword = getConfiguredAdminAccessCode();
  const adminName =
    process.env.ADMIN_NAME || formatAdminNameFromEmail(adminEmail);

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
