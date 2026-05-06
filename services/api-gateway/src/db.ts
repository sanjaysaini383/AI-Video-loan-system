import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient | null = null;

export async function initPrisma(): Promise<PrismaClient | null> {
  if (!process.env.DATABASE_URL) {
    console.warn('⚠️  DATABASE_URL not set — PostgreSQL disabled');
    return null;
  }

  try {
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });
    await prisma.$connect();
    console.log('✅ PostgreSQL connected via Prisma');
    return prisma;
  } catch (error: any) {
    console.error('❌ PostgreSQL connection failed:', error.message);
    prisma = null;
    return null;
  }
}

export function getPrisma(): PrismaClient | null {
  return prisma;
}

// ===========================
// USER OPERATIONS
// ===========================
export async function createUser(data: {
  id: string;
  phoneNumber: string;
  firstName: string;
  lastName?: string;
  employmentStatus?: string;
  monthlyIncome?: number;
  loanPurpose?: string;
}) {
  if (!prisma) return null;
  try {
    return await prisma.user.upsert({
      where: { phoneNumber: data.phoneNumber },
      update: {
        firstName: data.firstName,
        lastName: data.lastName || '',
        employmentStatus: data.employmentStatus,
        monthlyIncome: data.monthlyIncome,
        loanPurpose: data.loanPurpose,
      },
      create: {
        id: data.id,
        phoneNumber: data.phoneNumber,
        firstName: data.firstName,
        lastName: data.lastName || '',
        employmentStatus: data.employmentStatus,
        monthlyIncome: data.monthlyIncome,
        loanPurpose: data.loanPurpose,
      },
    });
  } catch (error: any) {
    console.error('Prisma createUser error:', error.message);
    return null;
  }
}

export async function getUserByPhone(phoneNumber: string) {
  if (!prisma) return null;
  try {
    return await prisma.user.findUnique({ where: { phoneNumber } });
  } catch {
    return null;
  }
}

export async function getUserById(id: string) {
  if (!prisma) return null;
  try {
    return await prisma.user.findUnique({
      where: { id },
      include: {
        sessions: { orderBy: { createdAt: 'desc' }, take: 10 },
        offers: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });
  } catch {
    return null;
  }
}

// ===========================
// SESSION OPERATIONS
// ===========================
export async function createSession(data: {
  id: string;
  userId: string;
  latitude?: number;
  longitude?: number;
  userAgent?: string;
  ipAddress?: string;
  platform?: string;
}) {
  if (!prisma) return null;
  try {
    return await prisma.videoSession.create({ data });
  } catch (error: any) {
    console.error('Prisma createSession error:', error.message);
    return null;
  }
}

export async function updateSession(id: string, data: any) {
  if (!prisma) return null;
  try {
    return await prisma.videoSession.update({ where: { id }, data });
  } catch (error: any) {
    console.error('Prisma updateSession error:', error.message);
    return null;
  }
}

export async function getSessionsByUser(userId: string) {
  if (!prisma) return [];
  try {
    return await prisma.videoSession.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { offers: true },
    });
  } catch {
    return [];
  }
}

// ===========================
// OFFER OPERATIONS
// ===========================
export async function saveOffers(offers: any[], sessionId: string, userId: string) {
  if (!prisma) return null;
  try {
    const created = [];
    for (const offer of offers) {
      const record = await prisma.loanOffer.create({
        data: {
          id: offer.id,
          sessionId,
          userId,
          loanAmount: offer.loanAmount,
          tenureMonths: offer.tenureMonths,
          interestRate: offer.interestRate,
          emi: offer.emi,
          totalPayable: offer.totalPayable || 0,
          totalInterest: offer.totalInterest || 0,
          eligibilityStatus: offer.eligibilityStatus || 'pending',
          conditions: offer.conditions || [],
          loanPurpose: offer.loanPurpose,
          expiresAt: offer.expiresAt ? new Date(offer.expiresAt) : new Date(Date.now() + 48 * 60 * 60 * 1000),
        },
      });
      created.push(record);
    }
    console.log(`💾 ${created.length} offers saved to PostgreSQL`);
    return created;
  } catch (error: any) {
    console.error('Prisma saveOffers error:', error.message);
    return null;
  }
}

export async function acceptOffer(offerId: string) {
  if (!prisma) return null;
  try {
    return await prisma.loanOffer.update({
      where: { id: offerId },
      data: { accepted: true, acceptedAt: new Date() },
    });
  } catch (error: any) {
    console.error('Prisma acceptOffer error:', error.message);
    return null;
  }
}

export async function getOffersBySession(sessionId: string) {
  if (!prisma) return [];
  try {
    return await prisma.loanOffer.findMany({
      where: { sessionId },
      orderBy: { interestRate: 'asc' },
    });
  } catch {
    return [];
  }
}

// ===========================
// CONSENT OPERATIONS
// ===========================
export async function recordConsent(data: {
  sessionId: string;
  userId: string;
  consentType: string;
  verballyAgreed?: boolean;
}) {
  if (!prisma) return null;
  try {
    return await prisma.consentRecord.create({ data });
  } catch (error: any) {
    console.error('Prisma recordConsent error:', error.message);
    return null;
  }
}

// ===========================
// CLEANUP
// ===========================
export async function disconnectPrisma() {
  if (prisma) {
    await prisma.$disconnect();
    console.log('Prisma disconnected');
  }
}
