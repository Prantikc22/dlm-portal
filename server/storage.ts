import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, and, desc, like, inArray } from "drizzle-orm";
import { 
  users, companies, supplierProfiles, skus, rfqs, rfqItems, 
  supplierInvites, quotes, curatedOffers, orders, documents,
  type User, type Company, type SupplierProfile, type SKU, type RFQ, 
  type Quote, type CuratedOffer, type Order,
  type InsertUser, type InsertCompany, type InsertSupplierProfile, 
  type InsertRFQ, type InsertQuote
} from "@shared/schema";
import { randomUUID } from "crypto";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

export interface IStorage {
  // User management
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserCompany(userId: string, companyId: string): Promise<void>;

  // Company management
  getCompany(id: string): Promise<Company | undefined>;
  createCompany(company: InsertCompany): Promise<Company>;

  // Supplier management
  getSupplierProfile(companyId: string): Promise<SupplierProfile | undefined>;
  createSupplierProfile(profile: InsertSupplierProfile): Promise<SupplierProfile>;
  getSuppliersByCapabilities(capabilities: string[]): Promise<Array<{ user: User; company: Company; profile: SupplierProfile }>>;

  // SKU management
  getAllSKUs(): Promise<SKU[]>;
  getSKUByCode(code: string): Promise<SKU | undefined>;
  getSKUsByIndustry(industry: string): Promise<SKU[]>;

  // RFQ management
  createRFQ(rfq: InsertRFQ): Promise<RFQ>;
  getRFQ(id: string): Promise<RFQ | undefined>;
  getRFQsByBuyer(buyerId: string): Promise<RFQ[]>;
  updateRFQStatus(id: string, status: string): Promise<void>;

  // Quote management
  createQuote(quote: InsertQuote): Promise<Quote>;
  getQuotesByRFQ(rfqId: string): Promise<Quote[]>;
  getQuotesBySupplier(supplierId: string): Promise<Quote[]>;

  // Invite management
  createSupplierInvite(rfqId: string, supplierId: string, invitedBy: string): Promise<void>;
  getSupplierInvites(supplierId: string): Promise<Array<{ invite: any; rfq: RFQ }>>;

  // Order management
  createOrder(orderData: any): Promise<Order>;
  getOrdersByBuyer(buyerId: string): Promise<Order[]>;
  getOrdersBySupplier(supplierId: string): Promise<Order[]>;
  updateOrderStatus(id: string, status: string): Promise<void>;
}

export class SupabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async updateUserCompany(userId: string, companyId: string): Promise<void> {
    await db.update(users).set({ companyId }).where(eq(users.id, userId));
  }

  async getCompany(id: string): Promise<Company | undefined> {
    const result = await db.select().from(companies).where(eq(companies.id, id)).limit(1);
    return result[0];
  }

  async createCompany(company: InsertCompany): Promise<Company> {
    const result = await db.insert(companies).values(company).returning();
    return result[0];
  }

  async getSupplierProfile(companyId: string): Promise<SupplierProfile | undefined> {
    const result = await db.select().from(supplierProfiles).where(eq(supplierProfiles.companyId, companyId)).limit(1);
    return result[0];
  }

  async createSupplierProfile(profile: InsertSupplierProfile): Promise<SupplierProfile> {
    const result = await db.insert(supplierProfiles).values(profile).returning();
    return result[0];
  }

  async getSuppliersByCapabilities(capabilities: string[]): Promise<Array<{ user: User; company: Company; profile: SupplierProfile }>> {
    // This would need a more complex query with JSONB operations
    const result = await db
      .select({
        user: users,
        company: companies,
        profile: supplierProfiles,
      })
      .from(users)
      .innerJoin(companies, eq(users.companyId, companies.id))
      .innerJoin(supplierProfiles, eq(companies.id, supplierProfiles.companyId))
      .where(eq(users.role, "supplier"));
    
    return result;
  }

  async getAllSKUs(): Promise<SKU[]> {
    return await db.select().from(skus).where(eq(skus.active, true)).orderBy(skus.industry, skus.processName);
  }

  async getSKUByCode(code: string): Promise<SKU | undefined> {
    const result = await db.select().from(skus).where(eq(skus.code, code)).limit(1);
    return result[0];
  }

  async getSKUsByIndustry(industry: string): Promise<SKU[]> {
    return await db.select().from(skus).where(and(eq(skus.industry, industry), eq(skus.active, true)));
  }

  async createRFQ(rfq: InsertRFQ): Promise<RFQ> {
    const rfqNumber = `RFQ-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    const result = await db.insert(rfqs).values({ ...rfq, rfqNumber }).returning();
    return result[0];
  }

  async getRFQ(id: string): Promise<RFQ | undefined> {
    const result = await db.select().from(rfqs).where(eq(rfqs.id, id)).limit(1);
    return result[0];
  }

  async getRFQsByBuyer(buyerId: string): Promise<RFQ[]> {
    return await db.select().from(rfqs).where(eq(rfqs.buyerId, buyerId)).orderBy(desc(rfqs.createdAt));
  }

  async updateRFQStatus(id: string, status: string): Promise<void> {
    await db.update(rfqs).set({ status: status as any }).where(eq(rfqs.id, id));
  }

  async createQuote(quote: InsertQuote): Promise<Quote> {
    const result = await db.insert(quotes).values(quote).returning();
    return result[0];
  }

  async getQuotesByRFQ(rfqId: string): Promise<Quote[]> {
    return await db.select().from(quotes).where(eq(quotes.rfqId, rfqId));
  }

  async getQuotesBySupplier(supplierId: string): Promise<Quote[]> {
    return await db.select().from(quotes).where(eq(quotes.supplierId, supplierId)).orderBy(desc(quotes.createdAt));
  }

  async createSupplierInvite(rfqId: string, supplierId: string, invitedBy: string): Promise<void> {
    await db.insert(supplierInvites).values({
      rfqId,
      supplierId,
      invitedBy,
      responseDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    });
  }

  async getSupplierInvites(supplierId: string): Promise<Array<{ invite: any; rfq: RFQ }>> {
    const result = await db
      .select({
        invite: supplierInvites,
        rfq: rfqs,
      })
      .from(supplierInvites)
      .innerJoin(rfqs, eq(supplierInvites.rfqId, rfqs.id))
      .where(eq(supplierInvites.supplierId, supplierId))
      .orderBy(desc(supplierInvites.invitedAt));
    
    return result;
  }

  async createOrder(orderData: any): Promise<Order> {
    const orderNumber = `ORD-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    const result = await db.insert(orders).values({ ...orderData, orderNumber }).returning();
    return result[0];
  }

  async getOrdersByBuyer(buyerId: string): Promise<Order[]> {
    return await db.select().from(orders).where(eq(orders.buyerId, buyerId)).orderBy(desc(orders.createdAt));
  }

  async getOrdersBySupplier(supplierId: string): Promise<Order[]> {
    return await db.select().from(orders).where(eq(orders.supplierId, supplierId)).orderBy(desc(orders.createdAt));
  }

  async updateOrderStatus(id: string, status: string): Promise<void> {
    await db.update(orders).set({ status: status as any, updatedAt: new Date() }).where(eq(orders.id, id));
  }
}

export const storage = new SupabaseStorage();
