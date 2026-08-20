/**
 * साहारा demo seed data.
 * All people, phone numbers and stories are fictional.
 * Run with: npm run db:seed
 */
import { PrismaClient } from "@prisma/client";
import { randomBytes, scryptSync } from "crypto";

const prisma = new PrismaClient();

/**
 * Safety guard: this seed DESTROYS ALL DATA. It refuses to run in production
 * or against a non-local database unless explicitly forced.
 */
function assertSeedSafety() {
  const url = process.env.DATABASE_URL ?? "";
  const isLocal = /@(localhost|127\.0\.0\.1)[:/]/.test(url) || url.startsWith("file:");
  const forced = process.env.SEED_FORCE === "yes-destroy-data";
  if ((process.env.NODE_ENV === "production" || !isLocal) && !forced) {
    console.error(
      "Refusing to seed: NODE_ENV is production or DATABASE_URL is not local.\n" +
        "This seed deletes ALL data. If you really mean it, set SEED_FORCE=yes-destroy-data.",
    );
    process.exit(1);
  }
}

// Same scheme as lib/password.ts (kept dependency-free so the seed can run standalone).
function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function daysFromNow(days: number, hour = 10): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d;
}

async function main() {
  assertSeedSafety();
  console.log("Seeding साहारा demo data…");
  const verifiedNow = new Date();

  // Clean slate (order matters for FK constraints)
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.incident.deleteMany();
  await prisma.emergencyAlert.deleteMany();
  await prisma.review.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.message.deleteMany();
  await prisma.messageThread.deleteMany();
  await prisma.visitPhoto.deleteMany();
  await prisma.visitReport.deleteMany();
  await prisma.visit.deleteMany();
  await prisma.companionAssignment.deleteMany();
  await prisma.bookingService.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.service.deleteMany();
  await prisma.availability.deleteMany();
  await prisma.companionVerification.deleteMany();
  await prisma.companionProfile.deleteMany();
  await prisma.emergencyContact.deleteMany();
  await prisma.elderProfile.deleteMany();
  await prisma.familyProfile.deleteMany();
  await prisma.user.deleteMany();

  // ---------- Users ----------
  const admin = await prisma.user.create({
    data: {
      email: "admin@sahara.demo",
      passwordHash: hashPassword("Admin@123"),
      emailVerifiedAt: verifiedNow,
      name: "साहारा Admin",
      phone: "+977-1-5551000",
      role: "ADMIN",
      countryCode: "NP",
    },
  });

  const familyUser = await prisma.user.create({
    data: {
      email: "family@sahara.demo",
      passwordHash: hashPassword("Family@123"),
      emailVerifiedAt: verifiedNow,
      name: "Anisha Sharma",
      phone: "+61-400-555-123",
      role: "FAMILY",
      countryCode: "AU",
      familyProfile: {
        create: {
          residenceCity: "Sydney",
          residenceCountry: "Australia",
          timezone: "Australia/Sydney",
        },
      },
    },
    include: { familyProfile: true },
  });
  const family = familyUser.familyProfile!;

  const companionUser = await prisma.user.create({
    data: {
      email: "companion@sahara.demo",
      passwordHash: hashPassword("Companion@123"),
      emailVerifiedAt: verifiedNow,
      name: "Ramesh Maharjan",
      phone: "+977-98-5555-2001",
      role: "COMPANION",
      countryCode: "NP",
      companionProfile: {
        create: {
          bio: "Retired schoolteacher from Lalitpur. I enjoy long conversations, chess, and helping elders with errands around the city.",
          citizenshipDoc: "citizenship-ramesh.pdf",
          policeReportDoc: "police-report-ramesh.pdf",
          referenceNotes: "Two references from Patan community centre — both confirmed.",
          languages: "ne,en,new",
          skills: "companionship,errands,technology-help,first-aid-basics",
          serviceAreas: "Lalitpur,Kathmandu",
          hourlyRateNpr: 600,
          verification: {
            create: {
              status: "VERIFIED",
              idSubmitted: true,
              policeReportSubmitted: true,
              referencesChecked: true,
              phoneVerified: true,
              addressVerified: true,
              interviewCompleted: true,
              orientationCompleted: true,
              skillsReviewed: true,
              emergencyTrainingDone: true,
              finalApproval: true,
              adminNotes: "Excellent interview. Warm and patient manner.",
              reviewedAt: daysFromNow(-40),
            },
          },
          availability: {
            create: [
              { weekday: 0, startTime: "09:00", endTime: "17:00" },
              { weekday: 1, startTime: "09:00", endTime: "17:00" },
              { weekday: 2, startTime: "09:00", endTime: "17:00" },
              { weekday: 3, startTime: "09:00", endTime: "17:00" },
              { weekday: 4, startTime: "09:00", endTime: "13:00" },
            ],
          },
        },
      },
    },
    include: { companionProfile: true },
  });
  const companion = companionUser.companionProfile!;

  await prisma.user.create({
    data: {
      email: "applicant@sahara.demo",
      passwordHash: hashPassword("Applicant@123"),
      emailVerifiedAt: verifiedNow,
      name: "Sunita Tamang",
      phone: "+977-98-5555-3002",
      role: "COMPANION",
      countryCode: "NP",
      companionProfile: {
        create: {
          bio: "Community health volunteer from Bhaktapur. I would love to support elders in my neighbourhood.",
          citizenshipDoc: "citizenship-sunita.pdf",
          languages: "ne,en",
          skills: "companionship,medicine-pickup,grocery-shopping",
          serviceAreas: "Bhaktapur,Kathmandu",
          hourlyRateNpr: 500,
          verification: {
            create: {
              status: "UNDER_REVIEW",
              idSubmitted: true,
              policeReportSubmitted: false,
              referencesChecked: false,
              phoneVerified: true,
              addressVerified: false,
              interviewCompleted: false,
              orientationCompleted: false,
              skillsReviewed: false,
              emergencyTrainingDone: false,
              finalApproval: false,
              adminNotes: "Waiting for police report.",
            },
          },
        },
      },
    },
    include: { companionProfile: true },
  });

  // ---------- Elder ----------
  const elder = await prisma.elderProfile.create({
    data: {
      familyId: family.id,
      fullName: "Krishna Bahadur Sharma",
      nickname: "Buwa",
      age: 74,
      addressLine: "House 12, Maitri Marg, Baluwatar",
      city: "Kathmandu",
      district: "Kathmandu",
      locationNotes: "Blue gate opposite the small Ganesh temple.",
      preferredLanguage: "ne",
      mobilityNotes: "Walks with a cane. Avoids long stairs.",
      healthNotes: "Mild hypertension. Takes morning blood-pressure medicine.",
      serviceNotes: "Enjoys tea at 4pm, likes talking about history and football.",
      consentToShare: true,
      elderAccessCode: "SAHARA1",
      emergencyContacts: {
        create: [
          {
            name: "Hari Prasad Sharma",
            relation: "Brother (lives nearby)",
            phone: "+977-98-5555-4100",
            isLocal: true,
            isPrimary: true,
          },
          {
            name: "Anisha Sharma",
            relation: "Daughter (Australia)",
            phone: "+61-400-555-123",
            isLocal: false,
            isPrimary: false,
          },
        ],
      },
    },
  });

  // ---------- Services ----------
  const servicesData = [
    { slug: "companionship", name: "Companionship Visit", nameNe: "साथी भेटघाट", description: "A friendly visit with conversation, tea, games or a gentle walk — meaningful company for your loved one.", icon: "🫶", estimatedMinutes: 120, basePriceNpr: 1200, transportRequired: false, requiresApproval: false },
    { slug: "grocery", name: "Grocery Shopping", nameNe: "किराना किनमेल", description: "We buy groceries from the local shops your family trusts and deliver them home.", icon: "🛒", estimatedMinutes: 90, basePriceNpr: 800, transportRequired: true, requiresApproval: false },
    { slug: "medicine", name: "Medicine Pickup", nameNe: "औषधि ल्याइदिने", description: "Collect prescribed medicines from the pharmacy and check refill dates.", icon: "💊", estimatedMinutes: 60, basePriceNpr: 600, transportRequired: true, requiresApproval: false },
    { slug: "hospital", name: "Hospital / Clinic Assistance", nameNe: "अस्पताल सहयोग", description: "Accompany your loved one to appointments, help with queues and paperwork, and share an update afterwards.", icon: "🏥", estimatedMinutes: 240, basePriceNpr: 2500, transportRequired: true, requiresApproval: true },
    { slug: "bank", name: "Bank Visit Assistance", nameNe: "बैंक सहयोग", description: "Accompany to the bank for routine work. Companions never handle passwords or PINs.", icon: "🏦", estimatedMinutes: 120, basePriceNpr: 1000, transportRequired: true, requiresApproval: true },
    { slug: "utility", name: "Utility Bill Payment", nameNe: "बिल भुक्तानी", description: "Pay electricity, water, internet or phone bills at the counter and bring back the receipt.", icon: "🧾", estimatedMinutes: 60, basePriceNpr: 500, transportRequired: true, requiresApproval: false },
    { slug: "pension", name: "Pension Collection Assistance", nameNe: "पेन्सन सहयोग", description: "Accompany to the pension office or bank on collection day and help with the queue.", icon: "📋", estimatedMinutes: 180, basePriceNpr: 1500, transportRequired: true, requiresApproval: true },
    { slug: "technology", name: "Technology Assistance", nameNe: "प्रविधि सहयोग", description: "Patient help with phones, TVs and apps — so staying in touch never feels hard.", icon: "📱", estimatedMinutes: 60, basePriceNpr: 600, transportRequired: false, requiresApproval: false },
    { slug: "video-call", name: "Video-Call Assistance", nameNe: "भिडियो कल सहयोग", description: "We set up the call and stay nearby so your family video call goes smoothly.", icon: "📞", estimatedMinutes: 45, basePriceNpr: 400, transportRequired: false, requiresApproval: false },
    { slug: "household", name: "Light Household Assistance", nameNe: "घरायसी सहयोग", description: "Small tasks around the house — changing a bulb, organising shelves, light tidying.", icon: "🏠", estimatedMinutes: 90, basePriceNpr: 700, transportRequired: false, requiresApproval: false },
    { slug: "errand", name: "Custom Errand", nameNe: "अन्य काम", description: "Tell us what is needed — post office, tailor, temple visit — and we will arrange it.", icon: "🎯", estimatedMinutes: 90, basePriceNpr: 800, transportRequired: true, requiresApproval: true },
    { slug: "welfare-check", name: "Emergency Welfare Check", nameNe: "आपतकालीन जाँच", description: "Can't reach your loved one? A companion visits promptly to check they are safe and calls you back.", icon: "🚨", estimatedMinutes: 60, basePriceNpr: 1500, transportRequired: true, requiresApproval: false },
  ];
  const services: Record<string, { id: string; basePriceNpr: number; name: string }> = {};
  for (const s of servicesData) {
    services[s.slug] = await prisma.service.create({ data: s });
  }

  // ---------- Completed booking (with visit report, review, payment) ----------
  const completed = await prisma.booking.create({
    data: {
      code: "SB-2026-0001",
      familyId: family.id,
      elderId: elder.id,
      status: "COMPLETED",
      requestedDate: daysFromNow(-6),
      requestedTime: "10:00",
      durationMin: 180,
      instructions:
        "Please pick up Buwa's blood-pressure medicine from Om Pharmacy and spend some time chatting. He loves talking about the 1970s.",
      estimatedNpr: 1800,
      finalNpr: 1800,
      services: {
        create: [
          { serviceId: services["companionship"].id, priceNpr: 1200 },
          { serviceId: services["medicine"].id, priceNpr: 600 },
        ],
      },
      assignment: {
        create: {
          companionId: companion.id,
          status: "ACCEPTED",
          assignedById: admin.id,
          respondedAt: daysFromNow(-8),
        },
      },
      visit: {
        create: {
          status: "COMPLETED",
          startedAt: daysFromNow(-6, 10),
          completedAt: daysFromNow(-6, 13),
          report: {
            create: {
              arrivalTime: "10:05",
              departureTime: "13:00",
              servicesCompleted: "Companionship Visit, Medicine Pickup",
              tasksCompleted: "Collected BP medicine (30-day supply), had tea together, walked in the garden.",
              wellbeingNote: "Krishna dai was cheerful and talkative. Appetite seems good.",
              foodNote: "Kitchen well stocked; daughter-in-law's neighbour delivers vegetables twice a week.",
              medicineNote: "Medicine collected from Om Pharmacy. Next refill due in about 4 weeks.",
              appointmentNote: "No appointments this week.",
              householdConcern: "The bathroom bulb is flickering — may need replacement soon.",
              safetyConcern: "",
              companionNotes: "We talked about his teaching days and football. He asked me to bring old photos next time.",
              followUpRecommended: false,
              incidentReported: false,
              familyAcknowledged: true,
              acknowledgedAt: daysFromNow(-5),
              submittedAt: daysFromNow(-6, 14),
              photos: {
                create: [
                  { fileName: "garden-tea.jpg", caption: "Afternoon tea in the garden" },
                  { fileName: "medicine-receipt.jpg", caption: "Pharmacy receipt" },
                ],
              },
            },
          },
        },
      },
      payment: {
        create: {
          familyId: family.id,
          amountNpr: 1800,
          method: "INTERNATIONAL_CARD",
          status: "PAID",
          provider: "demo",
          reference: "DEMO-PAY-90311",
          paidAt: daysFromNow(-8),
        },
      },
      review: {
        create: {
          familyId: family.id,
          companionId: companion.id,
          rating: 5,
          comment: "Ramesh dai is wonderful. Buwa was so happy after the visit. Thank you साहारा!",
        },
      },
    },
  });

  // ---------- Upcoming booking (confirmed) ----------
  const upcoming = await prisma.booking.create({
    data: {
      code: "SB-2026-0002",
      familyId: family.id,
      elderId: elder.id,
      status: "CONFIRMED",
      requestedDate: daysFromNow(3),
      requestedTime: "14:00",
      durationMin: 150,
      instructions: "Grocery list will be shared in messages. Please also help Buwa join our family video call at 4pm Nepal time.",
      estimatedNpr: 1200,
      services: {
        create: [
          { serviceId: services["grocery"].id, priceNpr: 800 },
          { serviceId: services["video-call"].id, priceNpr: 400 },
        ],
      },
      assignment: {
        create: {
          companionId: companion.id,
          status: "ACCEPTED",
          assignedById: admin.id,
          respondedAt: daysFromNow(-1),
        },
      },
      visit: { create: { status: "SCHEDULED" } },
      payment: {
        create: {
          familyId: family.id,
          amountNpr: 1200,
          method: "ESEWA",
          status: "PAID",
          provider: "demo",
          reference: "DEMO-PAY-90427",
          paidAt: daysFromNow(-1),
        },
      },
    },
  });

  // ---------- New request awaiting assignment ----------
  await prisma.booking.create({
    data: {
      code: "SB-2026-0003",
      familyId: family.id,
      elderId: elder.id,
      status: "AWAITING_ASSIGNMENT",
      requestedDate: daysFromNow(9),
      requestedTime: "09:00",
      durationMin: 240,
      instructions: "Routine check-up at Norvic Hospital, Dr. Shrestha, 10am. Please take a taxi both ways.",
      estimatedNpr: 2500,
      services: { create: [{ serviceId: services["hospital"].id, priceNpr: 2500 }] },
      payment: {
        create: {
          familyId: family.id,
          amountNpr: 2500,
          method: "INTERNATIONAL_CARD",
          status: "PENDING",
          provider: "demo",
        },
      },
    },
  });

  // ---------- Messages ----------
  await prisma.messageThread.create({
    data: {
      bookingId: upcoming.id,
      subject: "Booking SB-2026-0002 — Grocery & video call",
      messages: {
        create: [
          {
            senderId: familyUser.id,
            body: "Namaste Ramesh dai! Grocery list: rice 5kg, lentils, seasonal vegetables, milk, and Wai Wai for the grandkids' visit next month 😊",
            readBy: `${familyUser.id},${companionUser.id}`,
          },
          {
            senderId: companionUser.id,
            body: "Namaste Anisha ji! Noted. I will go to the usual shop in Baluwatar. I'll have Buwa ready for the video call at 4pm sharp.",
            readBy: `${familyUser.id},${companionUser.id}`,
          },
          {
            senderId: familyUser.id,
            body: "Thank you so much! He's really looking forward to seeing you again.",
            readBy: familyUser.id,
          },
        ],
      },
    },
  });

  // ---------- Emergency alert demo (resolved historical) ----------
  await prisma.emergencyAlert.create({
    data: {
      elderId: elder.id,
      bookingId: completed.id,
      raisedBy: "elder",
      status: "RESOLVED",
      locationText: "Home — Baluwatar, Kathmandu",
      description: "SOS pressed from elder screen. Krishna dai felt dizzy after climbing stairs.",
      acknowledgedAt: daysFromNow(-15, 11),
      resolvedAt: daysFromNow(-15, 12),
      resolvedNote: "Local brother Hari visited within 20 minutes. Doctor consulted by phone — advised rest. Family informed.",
      createdAt: daysFromNow(-15, 10),
    },
  });

  // ---------- Notifications ----------
  await prisma.notification.createMany({
    data: [
      {
        userId: familyUser.id,
        type: "BOOKING",
        title: "Booking confirmed",
        body: "Ramesh Maharjan accepted your booking SB-2026-0002 for grocery shopping and video-call help.",
        linkUrl: "/family/bookings",
      },
      {
        userId: familyUser.id,
        type: "VISIT",
        title: "Visit report ready",
        body: "The report for booking SB-2026-0001 has been submitted. See how the visit went.",
        linkUrl: "/family/reports",
      },
      {
        userId: companionUser.id,
        type: "BOOKING",
        title: "New visit assigned",
        body: "You have an upcoming visit on " + daysFromNow(3).toDateString() + " at 14:00.",
        linkUrl: "/companion/visits",
      },
    ],
  });

  // ---------- Audit log samples ----------
  await prisma.auditLog.createMany({
    data: [
      { actorId: admin.id, action: "companion.approve", entity: `CompanionProfile:${companion.id}`, detail: "Final approval granted after orientation." },
      { actorId: admin.id, action: "booking.assign", entity: `Booking:${upcoming.id}`, detail: "Assigned Ramesh Maharjan." },
    ],
  });

  console.log("Seed complete.");
  console.log("Demo accounts:");
  console.log("  Family    family@sahara.demo    / Family@123");
  console.log("  Companion companion@sahara.demo / Companion@123");
  console.log("  Applicant applicant@sahara.demo / Applicant@123");
  console.log("  Admin     admin@sahara.demo     / Admin@123");
  console.log("  Elder screen access code: SAHARA1  (at /elder)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
