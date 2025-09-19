import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
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

// In-memory storage for development/testing when database is unavailable
class InMemoryStorage implements IStorage {
  private users: User[] = [];
  private companies: Company[] = [];
  private skus: SKU[] = [
    // Mechanical Manufacturing Industry
    {
      id: randomUUID(),
      code: "MECH_CNC_001",
      industry: "mechanical_manufacturing",
      processName: "CNC Machining - Precision Parts",
      description: "Precision CNC machining for mechanical components including brackets, housings, and custom parts",
      defaultMoq: 100,
      defaultLeadTimeDays: 14,
      parametersSchema: {
        material: ["Aluminum 6061", "Steel 4140", "Stainless Steel 316"],
        tolerance: "±0.1mm",
        finish: ["Anodized", "Powder Coated", "Raw"]
      },
      active: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: randomUUID(),
      code: "MECH_CAST_001",
      industry: "mechanical_manufacturing",
      processName: "Investment Casting - Mechanical Components",
      description: "Investment casting for complex mechanical parts with tight tolerances",
      defaultMoq: 500,
      defaultLeadTimeDays: 21,
      parametersSchema: {
        material: ["Aluminum A356", "Steel 1045", "Cast Iron"],
        complexity: ["Simple", "Medium", "Complex"],
        finish: ["As Cast", "Machined", "Painted"]
      },
      active: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: randomUUID(),
      code: "MECH_SHEET_001",
      industry: "mechanical_manufacturing",
      processName: "Sheet Metal Fabrication",
      description: "Sheet metal cutting, bending, and forming for custom fabrications",
      defaultMoq: 50,
      defaultLeadTimeDays: 10,
      parametersSchema: {
        material: ["Mild Steel", "Stainless Steel", "Aluminum"],
        thickness: ["1mm", "2mm", "3mm", "5mm"],
        finish: ["Galvanized", "Powder Coated", "Raw"]
      },
      active: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    // Electronics & Electrical Industry
    {
      id: randomUUID(),
      code: "ELEC_PCB_001",
      industry: "electronics_electrical",
      processName: "PCB Manufacturing & Assembly",
      description: "Complete PCB fabrication and SMT assembly services",
      defaultMoq: 50,
      defaultLeadTimeDays: 10,
      parametersSchema: {
        layers: ["2-Layer", "4-Layer", "6-Layer", "8-Layer"],
        thickness: "1.6mm",
        finish: ["HASL", "ENIG", "OSP"]
      },
      active: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: randomUUID(),
      code: "ELEC_MOLD_001",
      industry: "electronics_electrical",
      processName: "Injection Molding - Electronics Housings",
      description: "Injection molding for electronic device enclosures and housings",
      defaultMoq: 1000,
      defaultLeadTimeDays: 18,
      parametersSchema: {
        material: ["ABS", "PC", "PC+ABS", "Nylon"],
        color: ["Black", "White", "Clear", "Custom"],
        texture: ["Smooth", "Textured", "Matte"]
      },
      active: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    // Packaging & Printing Industry
    {
      id: randomUUID(),
      code: "PACK_CORR_001",
      industry: "packaging_printing",
      processName: "Corrugated Box Manufacturing",
      description: "Custom corrugated packaging and shipping boxes",
      defaultMoq: 1000,
      defaultLeadTimeDays: 7,
      parametersSchema: {
        style: ["Regular Slotted", "Full Overlap", "Half Slotted"],
        flute: ["Single Wall", "Double Wall", "Triple Wall"],
        printing: ["1 Color", "2 Color", "4 Color", "Digital"]
      },
      active: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: randomUUID(),
      code: "PACK_FLEX_001",
      industry: "packaging_printing",
      processName: "Flexible Packaging - Pouches & Films",
      description: "Flexible packaging solutions including pouches, films, and bags",
      defaultMoq: 5000,
      defaultLeadTimeDays: 12,
      parametersSchema: {
        material: ["PE", "PP", "PET", "Aluminum Foil"],
        type: ["Stand-up Pouch", "Flat Pouch", "Roll Film"],
        printing: ["Gravure", "Flexographic", "Digital"]
      },
      active: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    // Textile & Leather Industry
    {
      id: randomUUID(),
      code: "TEXT_EMBB_001",
      industry: "textile_leather",
      processName: "Custom Embroidery Services",
      description: "Custom embroidery for apparel, caps, and textile products",
      defaultMoq: 100,
      defaultLeadTimeDays: 5,
      parametersSchema: {
        fabric: ["Cotton", "Polyester", "Cotton Blend", "Denim"],
        colors: ["1-3 Colors", "4-6 Colors", "7+ Colors"],
        size: ["Small (2-3 inch)", "Medium (4-5 inch)", "Large (6+ inch)"]
      },
      active: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    // Construction & Infrastructure Industry
    {
      id: randomUUID(),
      code: "CONST_STEEL_001",
      industry: "construction_infrastructure",
      processName: "Structural Steel Fabrication",
      description: "Custom structural steel fabrication for construction and infrastructure",
      defaultMoq: 1,
      defaultLeadTimeDays: 30,
      parametersSchema: {
        grade: ["A36", "A572 Grade 50", "A992"],
        coating: ["Galvanized", "Painted", "Raw"],
        certification: ["AISC", "AWS D1.1", "Custom"]
      },
      active: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];
  private rfqs: RFQ[] = [];
  private quotes: Quote[] = [];
  private orders: Order[] = [];

  async getUser(id: string): Promise<User | undefined> {
    return this.users.find(u => u.id === id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.users.find(u => u.email === email);
  }

  async createUser(user: InsertUser): Promise<User> {
    const newUser: User = {
      id: randomUUID(),
      email: user.email,
      password: user.password,
      role: user.role || "buyer",
      name: user.name || null,
      companyId: user.companyId || null,
      phone: user.phone || null,
      isVerified: user.isVerified || false,
      metadata: user.metadata || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.push(newUser);
    return newUser;
  }

  async updateUserCompany(userId: string, companyId: string): Promise<void> {
    const user = this.users.find(u => u.id === userId);
    if (user) {
      user.companyId = companyId;
      user.updatedAt = new Date();
    }
  }

  async getCompany(id: string): Promise<Company | undefined> {
    return this.companies.find(c => c.id === id);
  }

  async createCompany(company: InsertCompany): Promise<Company> {
    const newCompany: Company = {
      id: randomUUID(),
      name: company.name,
      gstin: company.gstin || null,
      pan: company.pan || null,
      address: company.address || null,
      city: company.city || null,
      state: company.state || null,
      country: company.country || "India",
      documents: company.documents || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.companies.push(newCompany);
    return newCompany;
  }

  // Stub implementations for other methods
  async getSupplierProfile(): Promise<any> { return undefined; }
  async createSupplierProfile(): Promise<any> { return {} as any; }
  async getSuppliersByCapabilities(): Promise<any> { return []; }
  async getAllSKUs(): Promise<SKU[]> { return this.skus; }
  async getSKUByCode(): Promise<any> { return undefined; }
  async getSKUsByIndustry(industry: string): Promise<SKU[]> {
    return this.skus.filter(sku => sku.industry === industry && sku.active);
  }
  async createRFQ(rfq: InsertRFQ): Promise<RFQ> {
    const rfqNumber = `RFQ-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    const newRFQ: RFQ = {
      id: randomUUID(),
      rfqNumber,
      buyerId: rfq.buyerId,
      companyId: rfq.companyId,
      title: rfq.title,
      description: rfq.description || null,
      industry: rfq.industry,
      category: rfq.category,
      specifications: rfq.specifications,
      quantity: rfq.quantity,
      preferredDeliveryDate: rfq.preferredDeliveryDate || null,
      attachments: rfq.attachments || null,
      priority: rfq.priority || "standard",
      status: "open",
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.rfqs.push(newRFQ);
    return newRFQ;
  }
  
  async getRFQ(id: string): Promise<RFQ | undefined> {
    return this.rfqs.find(r => r.id === id);
  }
  
  async getRFQsByBuyer(buyerId: string): Promise<RFQ[]> {
    return this.rfqs.filter(r => r.buyerId === buyerId);
  }
  async updateRFQStatus(): Promise<void> {}
  async createQuote(): Promise<any> { return {} as any; }
  async getQuotesByRFQ(): Promise<Quote[]> { return []; }
  async getQuotesBySupplier(): Promise<Quote[]> { return []; }
  async createSupplierInvite(): Promise<void> {}
  async getSupplierInvites(): Promise<any> { return []; }
  async createOrder(): Promise<any> { return {} as any; }
  async getOrdersByBuyer(): Promise<Order[]> { return []; }
  async getOrdersBySupplier(): Promise<Order[]> { return []; }
  async updateOrderStatus(): Promise<void> {}
}

// Database connection setup  
let db: any = null;
let dbConnectionFailed = false;

if (process.env.DATABASE_URL) {
  try {
    const sql = postgres(process.env.DATABASE_URL);
    db = drizzle(sql);
    console.log("Database connection established, using Supabase storage");
  } catch (error) {
    console.error("Database connection failed during setup:", error);
    dbConnectionFailed = true;
  }
} else {
  console.warn("DATABASE_URL not found");
  dbConnectionFailed = true;
}

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

// Wrapper storage that falls back to in-memory when database operations fail
class FallbackStorage implements IStorage {
  private inMemoryStorage = new InMemoryStorage();
  private supabaseStorage = new SupabaseStorage();
  private useFallback = dbConnectionFailed;

  private async withFallback<T>(operation: (storage: IStorage) => Promise<T>): Promise<T> {
    if (this.useFallback) {
      return operation(this.inMemoryStorage);
    }
    
    try {
      return await operation(this.supabaseStorage);
    } catch (error) {
      console.error("Database operation failed, falling back to in-memory storage:", error);
      this.useFallback = true;
      return operation(this.inMemoryStorage);
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.withFallback(async (storage) => storage.getUser(id));
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.withFallback(async (storage) => storage.getUserByEmail(email));
  }

  async createUser(user: InsertUser): Promise<User> {
    return this.withFallback(async (storage) => storage.createUser(user));
  }

  async updateUserCompany(userId: string, companyId: string): Promise<void> {
    return this.withFallback(async (storage) => storage.updateUserCompany(userId, companyId));
  }

  async getCompany(id: string): Promise<Company | undefined> {
    return this.withFallback(async (storage) => storage.getCompany(id));
  }

  async createCompany(company: InsertCompany): Promise<Company> {
    return this.withFallback(async (storage) => storage.createCompany(company));
  }

  // Delegate other methods with fallback
  async getSupplierProfile(companyId: string): Promise<any> {
    return this.withFallback(async function() { return this.getSupplierProfile(companyId); });
  }

  async createSupplierProfile(profile: any): Promise<any> {
    return this.withFallback(async function() { return this.createSupplierProfile(profile); });
  }

  async getSuppliersByCapabilities(capabilities: string[]): Promise<any> {
    return this.withFallback(async function() { return this.getSuppliersByCapabilities(capabilities); });
  }

  async getAllSKUs(): Promise<SKU[]> {
    return this.withFallback(async (storage) => storage.getAllSKUs());
  }

  async getSKUByCode(code: string): Promise<any> {
    return this.withFallback(async (storage) => storage.getSKUByCode(code));
  }

  async getSKUsByIndustry(industry: string): Promise<SKU[]> {
    return this.withFallback(async (storage) => storage.getSKUsByIndustry(industry));
  }

  async createRFQ(rfq: any): Promise<any> {
    return this.withFallback(async function() { return this.createRFQ(rfq); });
  }

  async getRFQ(id: string): Promise<any> {
    return this.withFallback(async function() { return this.getRFQ(id); });
  }

  async getRFQsByBuyer(buyerId: string): Promise<RFQ[]> {
    return this.withFallback(async function() { return this.getRFQsByBuyer(buyerId); });
  }

  async updateRFQStatus(id: string, status: string): Promise<void> {
    return this.withFallback(async function() { return this.updateRFQStatus(id, status); });
  }

  async createQuote(quote: any): Promise<any> {
    return this.withFallback(async function() { return this.createQuote(quote); });
  }

  async getQuotesByRFQ(rfqId: string): Promise<Quote[]> {
    return this.withFallback(async function() { return this.getQuotesByRFQ(rfqId); });
  }

  async getQuotesBySupplier(supplierId: string): Promise<Quote[]> {
    return this.withFallback(async function() { return this.getQuotesBySupplier(supplierId); });
  }

  async createSupplierInvite(rfqId: string, supplierId: string, invitedBy: string): Promise<void> {
    return this.withFallback(async function() { return this.createSupplierInvite(rfqId, supplierId, invitedBy); });
  }

  async getSupplierInvites(supplierId: string): Promise<any> {
    return this.withFallback(async function() { return this.getSupplierInvites(supplierId); });
  }

  async createOrder(orderData: any): Promise<any> {
    return this.withFallback(async function() { return this.createOrder(orderData); });
  }

  async getOrdersByBuyer(buyerId: string): Promise<Order[]> {
    return this.withFallback(async function() { return this.getOrdersByBuyer(buyerId); });
  }

  async getOrdersBySupplier(supplierId: string): Promise<Order[]> {
    return this.withFallback(async function() { return this.getOrdersBySupplier(supplierId); });
  }

  async updateOrderStatus(id: string, status: string): Promise<void> {
    return this.withFallback(async function() { return this.updateOrderStatus(id, status); });
  }
}

// Initialize storage with fallback capability
const storage: IStorage = new FallbackStorage();

if (dbConnectionFailed) {
  console.warn("Database connection failed, using in-memory storage fallback");
} else {
  console.log("Database connection established, using Supabase storage");
}

// Debug: Test storage initialization
(async () => {
  try {
    const allSKUs = await storage.getAllSKUs();
    console.log(`Storage initialized with ${allSKUs.length} SKUs`);
    
    const mechanicalSKUs = await storage.getSKUsByIndustry('mechanical_manufacturing');
    console.log(`Found ${mechanicalSKUs.length} SKUs for mechanical_manufacturing industry`);
  } catch (error) {
    console.error('Storage initialization test failed:', error);
  }
})();

export { storage };
