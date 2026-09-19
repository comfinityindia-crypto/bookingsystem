/**
 * prisma/seed.ts
 * Seeds the Comfinity tenant, employees, and meeting types for development.
 * Run: npx prisma db seed
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as bcrypt from "bcryptjs";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres.cgojufoorcxrrxixasbt:Soorajsu%4012345@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres";
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding ARMI database...");

  // ── Tenant ──────────────────────────────────────────────────────────
  const tenant = await prisma.tenant.upsert({
    where: { slug: "comfinity" },
    update: {},
    create: {
      name: "Comfinity Technologies",
      slug: "comfinity",
      brandColor: "#0066FF",
    },
  });
  console.log("✅ Tenant created:", tenant.name);

  // ── Admin User ───────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash("armi-admin-2026", 12);
  const adminUser = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: "admin@comfinity.com" } },
    update: {},
    create: {
      tenantId: tenant.id,
      name: "Admin",
      email: "admin@comfinity.com",
      passwordHash,
      role: "SUPER_ADMIN",
    },
  });
  console.log("✅ Admin user created:", adminUser.email);

  // ── Meeting Types ────────────────────────────────────────────────────
  const meetingTypes = await Promise.all([
    prisma.meetingType.upsert({
      where: { tenantId_slug: { tenantId: tenant.id, slug: "coffee-chat" } },
      update: {},
      create: {
        tenantId: tenant.id,
        name: "Virtual Coffee Chat",
        slug: "coffee-chat",
        description: "A casual 30-minute conversation to get to know each other.",
        emoji: "☕",
        durationMinutes: 30,
        bufferAfter: 15,
        aiQuestionSet: [
          "What would you like to get out of this conversation?",
          "What are you currently working on or exploring?",
        ],
      },
    }),
    prisma.meetingType.upsert({
      where: { tenantId_slug: { tenantId: tenant.id, slug: "business-discussion" } },
      update: {},
      create: {
        tenantId: tenant.id,
        name: "Business Discussion",
        slug: "business-discussion",
        description: "Discuss a specific business challenge or opportunity.",
        emoji: "💡",
        durationMinutes: 30,
        bufferAfter: 15,
        aiQuestionSet: [
          "What business challenge are you looking to solve?",
          "What have you already tried or explored?",
          "What does success look like for you?",
        ],
      },
    }),
    prisma.meetingType.upsert({
      where: { tenantId_slug: { tenantId: tenant.id, slug: "partnership-discussion" } },
      update: {},
      create: {
        tenantId: tenant.id,
        name: "Partnership Discussion",
        slug: "partnership-discussion",
        description: "Explore how we can work together and build something meaningful.",
        emoji: "🤝",
        durationMinutes: 60,
        bufferAfter: 15,
        aiQuestionSet: [
          "What kind of partnership are you looking to explore?",
          "What does your organisation do and what stage are you at?",
          "What is the specific opportunity you see with Comfinity?",
        ],
      },
    }),
  ]);
  console.log("✅ Meeting types created:", meetingTypes.length);

  // ── Employees ────────────────────────────────────────────────────────
  const sooraj = await prisma.employee.upsert({
    where: { tenantId_slug: { tenantId: tenant.id, slug: "sooraj" } },
    update: {},
    create: {
      tenantId: tenant.id,
      name: "Sooraj Sudevan",
      slug: "sooraj",
      email: "sooraj@comfinity.com",
      designation: "Co-Founder",
      bio: "Technology entrepreneur focused on business problem solving, AI, automation and building practical technology solutions.",
      expertiseTags: ["AI", "Business Strategy", "Technology", "Partnerships"],
      timezone: "Asia/Kolkata",
      dailyMeetingLimit: 4,
      bufferMinutes: 15,
      isActive: true,
      // Default availability: Mon–Fri 9 AM–6 PM IST
      availability: {
        create: [
          { dayOfWeek: 1, startTime: "09:00", endTime: "18:00", isAvailable: true },
          { dayOfWeek: 2, startTime: "09:00", endTime: "18:00", isAvailable: true },
          { dayOfWeek: 3, startTime: "09:00", endTime: "18:00", isAvailable: true },
          { dayOfWeek: 4, startTime: "09:00", endTime: "18:00", isAvailable: true },
          { dayOfWeek: 5, startTime: "09:00", endTime: "18:00", isAvailable: true },
        ],
      },
    },
    include: { availability: true },
  });

  const anoop = await prisma.employee.upsert({
    where: { tenantId_slug: { tenantId: tenant.id, slug: "anoop" } },
    update: {},
    create: {
      tenantId: tenant.id,
      name: "Anoop",
      slug: "anoop",
      email: "anoop@comfinity.com",
      designation: "Head of Technology",
      bio: "Full-stack technology leader specialising in scalable architecture, cloud infrastructure and software delivery.",
      expertiseTags: ["Engineering", "Cloud", "Architecture", "DevOps"],
      timezone: "Asia/Kolkata",
      dailyMeetingLimit: 3,
      bufferMinutes: 15,
      isActive: true,
      availability: {
        create: [
          { dayOfWeek: 1, startTime: "09:00", endTime: "18:00", isAvailable: true },
          { dayOfWeek: 2, startTime: "09:00", endTime: "18:00", isAvailable: true },
          { dayOfWeek: 3, startTime: "09:00", endTime: "18:00", isAvailable: true },
          { dayOfWeek: 4, startTime: "09:00", endTime: "18:00", isAvailable: true },
          { dayOfWeek: 5, startTime: "09:00", endTime: "18:00", isAvailable: true },
        ],
      },
    },
    include: { availability: true },
  });

  const sarah = await prisma.employee.upsert({
    where: { tenantId_slug: { tenantId: tenant.id, slug: "sarah" } },
    update: {},
    create: {
      tenantId: tenant.id,
      name: "Sarah",
      slug: "sarah",
      email: "sarah@comfinity.com",
      designation: "Business Development",
      bio: "Partnerships and growth specialist helping businesses identify the right opportunities and build lasting commercial relationships.",
      expertiseTags: ["Partnerships", "Growth", "Sales", "Strategy"],
      timezone: "Asia/Kolkata",
      dailyMeetingLimit: 5,
      bufferMinutes: 15,
      isActive: true,
      availability: {
        create: [
          { dayOfWeek: 1, startTime: "09:00", endTime: "18:00", isAvailable: true },
          { dayOfWeek: 2, startTime: "09:00", endTime: "18:00", isAvailable: true },
          { dayOfWeek: 3, startTime: "09:00", endTime: "18:00", isAvailable: true },
          { dayOfWeek: 4, startTime: "09:00", endTime: "18:00", isAvailable: true },
          { dayOfWeek: 5, startTime: "09:00", endTime: "18:00", isAvailable: true },
        ],
      },
    },
    include: { availability: true },
  });

  console.log("✅ Employees created:", [sooraj.name, anoop.name, sarah.name].join(", "));

  // ── Link employees to meeting types ─────────────────────────────────
  const coffeeChat = meetingTypes[0];
  const bizDiscussion = meetingTypes[1];
  const partnershipDiscussion = meetingTypes[2];

  // All three employees can do coffee chat
  for (const employee of [sooraj, anoop, sarah]) {
    await prisma.meetingTypeEmployee.upsert({
      where: { meetingTypeId_employeeId: { meetingTypeId: coffeeChat.id, employeeId: employee.id } },
      update: {},
      create: { meetingTypeId: coffeeChat.id, employeeId: employee.id },
    });
  }

  // Sooraj + Sarah for business/partnership
  for (const employee of [sooraj, sarah]) {
    await prisma.meetingTypeEmployee.upsert({
      where: { meetingTypeId_employeeId: { meetingTypeId: bizDiscussion.id, employeeId: employee.id } },
      update: {},
      create: { meetingTypeId: bizDiscussion.id, employeeId: employee.id },
    });
    await prisma.meetingTypeEmployee.upsert({
      where: { meetingTypeId_employeeId: { meetingTypeId: partnershipDiscussion.id, employeeId: employee.id } },
      update: {},
      create: { meetingTypeId: partnershipDiscussion.id, employeeId: employee.id },
    });
  }

  console.log("✅ Meeting type assignments created");
  console.log("\n🎉 Seed complete! ARMI is ready for Comfinity.");
  console.log("   Admin login: admin@comfinity.com / armi-admin-2026");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
