import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, and, desc, like, inArray, sql, gte, isNotNull } from "drizzle-orm";
import { 
  users, companies, supplierProfiles, skus, rfqs, rfqItems, 
  supplierInvites, quotes, curatedOffers, orders, documents, notifications,
  paymentMethods, paymentConfigurations, paymentTransactions,
  type User, type Company, type SupplierProfile, type SKU, type RFQ, 
  type Quote, type CuratedOffer, type Order, type Document, type Notification,
  type PaymentMethod, type PaymentConfiguration, type PaymentTransaction,
  type InsertUser, type InsertCompany, type InsertSupplierProfile, 
  type InsertRFQ, type InsertQuote, type InsertDocument, type InsertCuratedOffer, type InsertNotification,
  type InsertPaymentMethod, type InsertPaymentConfiguration, type InsertPaymentTransaction,
  logisticsRequests, type LogisticsRequest,
  earlypayRequests, type EarlypayRequest
} from "@shared/schema";
import { randomUUID } from "crypto";
import bcrypt from "bcrypt";

// In-memory storage for development/testing when database is unavailable
class InMemoryStorage implements IStorage {
  private users: User[] = [];
  private companies: Company[] = [];
  private supplierProfiles: SupplierProfile[] = [];
  private supplierInvites: any[] = [];
  private documents: Document[] = [];
  private notifications: Notification[] = [];
  private paymentMethods: PaymentMethod[] = [];
  private paymentConfigurations: PaymentConfiguration[] = [];
  private paymentTransactions: PaymentTransaction[] = [];
  private logisticsRequests: LogisticsRequest[] = [];
  private earlypayRequests: EarlypayRequest[] = [];
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
    {
      id: randomUUID(),
      code: "PACK_BLOW_001",
      industry: "packaging_printing",
      processName: "Blow Molding - PET/HDPE Bottles & Jars",
      description: "PET/HDPE bottles and jars for beverages, personal care, and household products",
      defaultMoq: 10000,
      defaultLeadTimeDays: 14,
      parametersSchema: {
        material: ["PET", "HDPE"],
        capacity: ["50ml", "100ml", "250ml", "500ml", "1L"],
        neckFinish: ["18/410", "20/410", "24/410", "28/410"],
        color: ["Clear", "White", "Amber", "Custom"],
        decoration: ["Label", "Shrink Sleeve", "Screen Print"]
      },
      active: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: randomUUID(),
      code: "PACK_TRAY_THERMO_001",
      industry: "packaging_printing",
      processName: "Thermoformed Trays - Clamshells & Blister Bases",
      description: "Custom thermoformed clamshells, trays, and blister bases for FMCG and cosmetics",
      defaultMoq: 5000,
      defaultLeadTimeDays: 12,
      parametersSchema: {
        material: ["PET", "RPET", "PVC", "HIPS"],
        thickness: ["0.2mm", "0.3mm", "0.5mm", "0.8mm"],
        style: ["Clamshell", "Tray", "Blister Base"],
        cavityCount: ["Single", "2", "4", "6", "Custom"],
        sealing: ["Heat Seal", "Snap Fit"]
      },
      active: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: randomUUID(),
      code: "PACK_PULP_001",
      industry: "packaging_printing",
      processName: "Molded Pulp Trays - Plastic-free Protection",
      description: "Eco-friendly molded fiber trays for electronics, cosmetics, and protective packaging",
      defaultMoq: 3000,
      defaultLeadTimeDays: 15,
      parametersSchema: {
        fiber: ["Recycled Pulp", "Bagasse", "Bamboo"],
        color: ["Natural", "Black", "Dyed"],
        finish: ["Raw", "Hot-Pressed"],
        waterResistance: ["None", "Light", "High"]
      },
      active: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: randomUUID(),
      code: "PACK_CLOSURES_001",
      industry: "packaging_printing",
      processName: "Closures, Caps & Pumps",
      description: "Pumps, misters, droppers, flip-tops and specialty caps as separate line items",
      defaultMoq: 5000,
      defaultLeadTimeDays: 10,
      parametersSchema: {
        type: ["Pump", "Mister", "Dropper", "Flip-Top", "Screw Cap"],
        neckFinish: ["18/410", "20/410", "24/410", "28/410"],
        color: ["White", "Black", "Natural", "Custom"],
        locking: ["With Lock", "Without Lock"]
      },
      active: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: randomUUID(),
      code: "PACK_SLEEVES_001",
      industry: "packaging_printing",
      processName: "Shrink Sleeves - 360° Decoration",
      description: "Standalone shrink sleeve decoration for bottles, jars, and containers",
      defaultMoq: 10000,
      defaultLeadTimeDays: 14,
      parametersSchema: {
        material: ["PETG", "PVC"],
        print: ["Gravure", "Flexo", "Digital"],
        finish: ["Matte", "Gloss"],
        perforation: ["Vertical", "Horizontal", "None"]
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
  private curatedOffers: CuratedOffer[] = [];

  async getUser(id: string): Promise<User | undefined> {
    return this.users.find(u => u.id === id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.users.find(u => u.email === email);
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return this.users.filter(u => u.role === role);
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

  async getAllPaymentTransactions(): Promise<PaymentTransaction[]> {
    return this.paymentTransactions;
  }

  async getPaymentTransactionsBySupplier(supplierId: string): Promise<PaymentTransaction[]> {
    // Transactions directly addressed to supplier (e.g., payouts)
    const direct = this.paymentTransactions.filter(tx => tx.recipientId === supplierId);
    // Transactions related to orders owned by supplier (e.g., buyer advance linked to order)
    const orderOwned = this.paymentTransactions.filter(tx => {
      if (!tx.orderId) return false;
      const ord = this.orders.find(o => o.id === tx.orderId);
      return !!ord && ord.supplierId === supplierId;
    });
    // Merge unique by id
    const map = new Map<string, PaymentTransaction>();
    [...direct, ...orderOwned].forEach(t => map.set(t.id, t));
    return Array.from(map.values());
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

  async getSupplierProfile(companyId: string): Promise<SupplierProfile | undefined> {
    return this.supplierProfiles.find(p => p.companyId === companyId);
  }

  async createSupplierProfile(profile: InsertSupplierProfile): Promise<SupplierProfile> {
    const newProfile: SupplierProfile = {
      id: randomUUID(),
      companyId: profile.companyId,
      capabilities: profile.capabilities || null,
      machines: profile.machines || null,
      moqDefault: profile.moqDefault || null,
      capacityCalendar: profile.capacityCalendar || null,
      certifications: profile.certifications || null,
      verifiedStatus: profile.verifiedStatus || "unverified",
      bankDetails: profile.bankDetails || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.supplierProfiles.push(newProfile);
    return newProfile;
  }

  async getSuppliersByCapabilities(capabilities: string[]): Promise<Array<{ user: User; company: Company; profile: SupplierProfile }>> {
    const suppliers = this.supplierProfiles.map(profile => {
      const company = this.companies.find(c => c.id === profile.companyId);
      const user = this.users.find(u => u.companyId === profile.companyId && u.role === "supplier");
      
      if (company && user) {
        return { user, company, profile };
      }
      return null;
    }).filter(Boolean) as Array<{ user: User; company: Company; profile: SupplierProfile }>;

    if (capabilities.length === 0) {
      return suppliers;
    }

    // Filter by capabilities
    return suppliers.filter(supplier => {
      const profileCapabilities = supplier.profile.capabilities as string[] || [];
      return capabilities.some(cap => profileCapabilities.includes(cap));
    });
  }

  async createDocument(document: InsertDocument): Promise<Document> {
    const newDocument: Document = {
      id: randomUUID(),
      companyId: document.companyId || null,
      docType: document.docType,
      fileRef: document.fileRef,
      metadata: document.metadata || null,
      uploadedBy: document.uploadedBy || null,
      uploadedAt: new Date(),
    };
    this.documents.push(newDocument);
    return newDocument;
  }

  async getDocumentsByCompany(companyId: string): Promise<Document[]> {
    return this.documents.filter(d => d.companyId === companyId);
  }

  async getDocumentsByType(companyId: string, docType: string): Promise<Document[]> {
    return this.documents.filter(d => d.companyId === companyId && d.docType === docType);
  }

  async getInvoiceByOrder(orderId: string): Promise<Document | undefined> {
    return this.documents.find(d => d.docType === 'invoice' && (d.metadata as any)?.orderId === orderId);
  }

  async deleteDocument(id: string): Promise<void> {
    const index = this.documents.findIndex(d => d.id === id);
    if (index !== -1) {
      this.documents.splice(index, 1);
    }
  }

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
      title: rfq.title,
      status: rfq.status || "draft",
      details: rfq.details,
      files: rfq.files || null,
      ndaRequired: rfq.ndaRequired || false,
      confidential: rfq.confidential || false,
      budgetRange: rfq.budgetRange || null,
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
  async updateRFQStatus(id: string, status: string): Promise<void> {
    const rfq = this.rfqs.find(r => r.id === id);
    if (rfq) {
      rfq.status = status as any;
      rfq.updatedAt = new Date();
    }
  }

  async createQuote(quote: InsertQuote): Promise<Quote> {
    const newQuote: Quote = {
      id: randomUUID(),
      rfqId: quote.rfqId,
      supplierId: quote.supplierId,
      quoteJson: quote.quoteJson,
      status: quote.status || "draft",
      createdAt: new Date(),
    };
    this.quotes.push(newQuote);
    return newQuote;
  }

  async getQuotesByRFQ(rfqId: string): Promise<Quote[]> {
    return this.quotes.filter(q => q.rfqId === rfqId);
  }

  async getQuotesBySupplier(supplierId: string): Promise<Quote[]> {
    return this.quotes.filter(q => q.supplierId === supplierId);
  }

  async createSupplierInvite(rfqId: string, supplierId: string, invitedBy: string): Promise<void> {
    const invite = {
      id: randomUUID(),
      rfqId,
      supplierId,
      invitedBy,
      invitedAt: new Date(),
      status: "invited" as const,
      responseDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    };
    this.supplierInvites.push(invite);
  }

  async getSupplierInvites(supplierId: string): Promise<Array<{ invite: any; rfq: RFQ }>> {
    const invites = this.supplierInvites.filter(invite => invite.supplierId === supplierId);
    return invites.map(invite => {
      const rfq = this.rfqs.find(r => r.id === invite.rfqId);
      return { invite, rfq: rfq! };
    }).filter(item => item.rfq); // Only return invites with valid RFQs
  }
  async createOrder(orderData: any): Promise<Order> {
    const orderNumber = `ORD-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    const newOrder: Order = {
      id: randomUUID(),
      orderNumber,
      rfqId: orderData.rfqId,
      curatedOfferId: orderData.curatedOfferId || null,
      buyerId: orderData.buyerId,
      adminId: orderData.adminId || null,
      supplierId: orderData.supplierId || null,
      status: orderData.status || "created",
      depositPercent: orderData.depositPercent || 30,
      depositPaid: orderData.depositPaid || false,
      totalAmount: orderData.totalAmount || null,
      escrowTxRef: orderData.escrowTxRef || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.orders.push(newOrder);
    return newOrder;
  }

  async getOrdersByBuyer(buyerId: string): Promise<Order[]> {
    return this.orders.filter(o => o.buyerId === buyerId);
  }

  async getOrdersBySupplier(supplierId: string): Promise<Order[]> {
    return this.orders.filter(o => o.supplierId === supplierId);
  }

  async getAllOrders(): Promise<Order[]> {
    return this.orders;
  }


  async updateOrderStatus(id: string, status: string): Promise<void> {
    const order = this.orders.find(o => o.id === id);
    if (order) {
      order.status = status as any;
      order.updatedAt = new Date();
    }
  }

  async updateOrderTotalAmount(id: string, totalAmount: string): Promise<void> {
    const order = this.orders.find(o => o.id === id);
    if (order) {
      order.totalAmount = totalAmount;
      order.updatedAt = new Date();
    }
  }

  async updateOrderDepositPaid(id: string, depositPaid: boolean): Promise<void> {
    const order = this.orders.find(o => o.id === id);
    if (order) {
      order.depositPaid = depositPaid;
      order.updatedAt = new Date();
    }
  }

  // Admin-specific methods
  async getAllRFQs(): Promise<RFQ[]> {
    return this.rfqs;
  }

  async updateSupplierVerificationStatus(companyId: string, status: string): Promise<void> {
    const profile = this.supplierProfiles.find(p => p.companyId === companyId);
    if (profile) {
      profile.verifiedStatus = status as any;
      profile.updatedAt = new Date();
    }
  }

  async getAdminMetrics(): Promise<{
    activeRFQs: number;
    verifiedSuppliers: number;
    monthlyVolume: number;
    successRate: number;
  }> {
    const activeRFQs = this.rfqs.filter(rfq => 
      rfq.status && ['submitted', 'under_review', 'invited', 'offers_published'].includes(rfq.status)
    ).length;
    
    const verifiedSuppliers = this.supplierProfiles.filter(p => 
      p.verifiedStatus !== 'unverified'
    ).length;

    // Calculate real metrics from actual data
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);
    
    // Monthly volume: sum of all orders from current month
    const monthlyOrders = this.orders.filter(order => 
      order.createdAt && new Date(order.createdAt) >= currentMonth
    );
    const monthlyVolume = monthlyOrders.reduce((sum, order) => {
      // Extract price from order metadata or use 0
      const price = typeof order.totalAmount === 'number' ? order.totalAmount : 0;
      return sum + price;
    }, 0);
    
    // Success rate: percentage of completed orders vs total orders
    const totalCompletedOrders = this.orders.filter(order => 
      order.status && ['delivered', 'closed'].includes(order.status)
    ).length;
    const totalOrders = this.orders.length;
    const successRate = totalOrders > 0 ? (totalCompletedOrders / totalOrders) * 100 : 0;

    return {
      activeRFQs,
      verifiedSuppliers,
      monthlyVolume: Math.round(monthlyVolume),
      successRate: Math.round(successRate * 100) / 100, // Round to 2 decimal places
    };
  }

  // Payment methods management
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    return this.paymentMethods;
  }

  async getActivePaymentMethods(): Promise<PaymentMethod[]> {
    return this.paymentMethods.filter(method => method.isActive);
  }

  async createPaymentMethod(method: InsertPaymentMethod): Promise<PaymentMethod> {
    const newMethod: PaymentMethod = {
      id: randomUUID(),
      name: method.name,
      type: method.type,
      isActive: method.isActive ?? true,
      configuration: method.configuration || null,
      displayName: method.displayName,
      description: method.description || null,
      processingFeePercent: method.processingFeePercent || "0",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.paymentMethods.push(newMethod);
    return newMethod;
  }

  async updatePaymentMethod(id: string, data: Partial<InsertPaymentMethod>): Promise<void> {
    const method = this.paymentMethods.find(m => m.id === id);
    if (method) {
      Object.assign(method, data, { updatedAt: new Date() });
    }
  }

  async deletePaymentMethod(id: string): Promise<void> {
    this.paymentMethods = this.paymentMethods.filter(m => m.id !== id);
  }

  // Payment configurations management
  async getPaymentConfigurations(): Promise<PaymentConfiguration[]> {
    return this.paymentConfigurations;
  }

  async getPaymentConfiguration(configType: string): Promise<PaymentConfiguration | undefined> {
    return this.paymentConfigurations.find(config => config.configType === configType && config.isActive);
  }

  async createPaymentConfiguration(config: InsertPaymentConfiguration): Promise<PaymentConfiguration> {
    const newConfig: PaymentConfiguration = {
      id: randomUUID(),
      configType: config.configType,
      value: config.value,
      description: config.description || null,
      isActive: config.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.paymentConfigurations.push(newConfig);
    return newConfig;
  }

  async updatePaymentConfiguration(id: string, data: Partial<InsertPaymentConfiguration>): Promise<void> {
    const config = this.paymentConfigurations.find(c => c.id === id);
    if (config) {
      Object.assign(config, data, { updatedAt: new Date() });
    }
  }

  // Payment transactions management
  async createPaymentTransaction(transaction: InsertPaymentTransaction): Promise<PaymentTransaction> {
    const newTransaction: PaymentTransaction = {
      id: randomUUID(),
      transactionRef: `TXN_${Date.now()}_${randomUUID().substring(0, 8)}`,
      orderId: transaction.orderId || null,
      curatedOfferId: transaction.curatedOfferId || null,
      payerId: transaction.payerId,
      recipientId: transaction.recipientId || null,
      paymentMethodId: transaction.paymentMethodId || null,
      amount: transaction.amount,
      fees: transaction.fees || "0",
      netAmount: transaction.netAmount,
      currency: transaction.currency || "INR",
      status: transaction.status || "pending",
      transactionType: transaction.transactionType,
      gatewayTransactionId: transaction.gatewayTransactionId || null,
      gatewayResponse: transaction.gatewayResponse || null,
      notes: transaction.notes || null,
      processedAt: transaction.processedAt || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.paymentTransactions.push(newTransaction);
    return newTransaction;
  }

  async getPaymentTransaction(id: string): Promise<PaymentTransaction | undefined> {
    return this.paymentTransactions.find(tx => tx.id === id);
  }

  async getPaymentTransactionByRef(transactionRef: string): Promise<PaymentTransaction | undefined> {
    return this.paymentTransactions.find(tx => tx.transactionRef === transactionRef);
  }

  async updatePaymentTransactionStatus(id: string, status: string, gatewayResponse?: any): Promise<void> {
    const transaction = this.paymentTransactions.find(tx => tx.id === id);
    if (transaction) {
      transaction.status = status as any;
      transaction.gatewayResponse = gatewayResponse || transaction.gatewayResponse;
      if (status === "completed" || status === "failed") {
        transaction.processedAt = new Date();
      }
      transaction.updatedAt = new Date();
    }
  }

  async getPaymentTransactionsByPayer(payerId: string): Promise<PaymentTransaction[]> {
    return this.paymentTransactions.filter(tx => tx.payerId === payerId);
  }

  async getPaymentTransactionsByOrder(orderId: string): Promise<PaymentTransaction[]> {
    return this.paymentTransactions.filter(tx => tx.orderId === orderId);
  }

  async getPaymentTransactionsByOffer(curatedOfferId: string): Promise<PaymentTransaction[]> {
    return this.paymentTransactions.filter(tx => tx.curatedOfferId === curatedOfferId);
  }

  // Link a payment transaction to an order (used after auto-creating order on advance payment)
  async linkPaymentTransactionToOrder(transactionId: string, orderId: string): Promise<void> {
    const tx = this.paymentTransactions.find(t => t.id === transactionId);
    if (tx) {
      tx.orderId = orderId;
      tx.updatedAt = new Date();
    }
  }

  // Curated offers with payment fields
  async getCuratedOffer(id: string): Promise<CuratedOffer | undefined> {
    return this.curatedOffers.find(offer => offer.id === id);
  }

  async getCuratedOffersByRFQ(rfqId: string): Promise<CuratedOffer[]> {
    return this.curatedOffers.filter(offer => offer.rfqId === rfqId);
  }

  async updateCuratedOfferPayment(id: string, paymentData: {
    paymentLink?: string;
    advancePaymentAmount?: number;
    finalPaymentAmount?: number;
    paymentDeadline?: Date;
    paymentTerms?: string;
  }): Promise<void> {
    const offer = this.curatedOffers.find(o => o.id === id);
    if (offer) {
      Object.assign(offer, paymentData);
    }
  }

  async getAllQuotes(): Promise<Array<Quote & { rfq: RFQ; supplier: User }>> {
    return this.quotes.map(quote => {
      const rfq = this.rfqs.find(r => r.id === quote.rfqId)!;
      const supplier = this.users.find(u => u.id === quote.supplierId)!;
      return { ...quote, rfq, supplier };
    }).filter(item => item.rfq && item.supplier);
  }

  async createCuratedOffer(offer: InsertCuratedOffer): Promise<CuratedOffer> {
    const newOffer: CuratedOffer = {
      id: randomUUID(),
      rfqId: offer.rfqId,
      adminId: offer.adminId,
      title: offer.title,
      details: offer.details,
      totalPrice: offer.totalPrice || null,
      supplierIndicators: offer.supplierIndicators || null,
      publishedAt: null,
      expiresAt: offer.expiresAt ? new Date(offer.expiresAt) : null,
      paymentLink: offer.paymentLink || null,
      advancePaymentAmount: offer.advancePaymentAmount || null,
      finalPaymentAmount: offer.finalPaymentAmount || null,
      paymentDeadline: offer.paymentDeadline ? new Date(offer.paymentDeadline) : null,
      paymentTerms: offer.paymentTerms || null,
    };
    // Add to a curated offers array (we'll need to add this property)
    if (!this.curatedOffers) this.curatedOffers = [];
    this.curatedOffers.push(newOffer);
    return newOffer;
  }

  async getCuratedOffers(): Promise<Array<CuratedOffer & { rfq: RFQ }>> {
    if (!this.curatedOffers) this.curatedOffers = [];
    return this.curatedOffers.map(offer => {
      const rfq = this.rfqs.find(r => r.id === offer.rfqId)!;
      return { ...offer, rfq };
    }).filter(item => item.rfq);
  }

  async getCuratedOffersByBuyer(buyerId: string): Promise<Array<CuratedOffer & { rfq: RFQ }>> {
    if (!this.curatedOffers) this.curatedOffers = [];
    return this.curatedOffers
      .filter(offer => offer.publishedAt !== null) // Only published offers
      .map(offer => {
        const rfq = this.rfqs.find(r => r.id === offer.rfqId && r.buyerId === buyerId);
        return rfq ? { ...offer, rfq } : null;
      })
      .filter(item => item !== null) as Array<CuratedOffer & { rfq: RFQ }>;
  }

  async publishCuratedOffer(offerId: string): Promise<void> {
    if (!this.curatedOffers) this.curatedOffers = [];
    const offer = this.curatedOffers.find(o => o.id === offerId);
    if (offer) {
      offer.publishedAt = new Date();
    }
  }

  // Notification methods
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const newNotification: Notification = {
      id: randomUUID(),
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      isRead: notification.isRead || false,
      metadata: notification.metadata || null,
      entityId: notification.entityId || null,
      entityType: notification.entityType || null,
      createdAt: new Date(),
    };
    this.notifications.push(newNotification);
    return newNotification;
  }

  async getNotificationsByUser(userId: string): Promise<Notification[]> {
    return this.notifications
      .filter(n => n.userId === userId)
      .sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      });
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    return this.notifications.filter(n => n.userId === userId && !n.isRead).length;
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.isRead = true;
    }
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    this.notifications
      .filter(n => n.userId === userId && !n.isRead)
      .forEach(n => n.isRead = true);
  }

  async getPayoutsBySupplier(supplierId: string): Promise<any[]> {
    // Return empty array as InMemoryStorage doesn't track payouts yet
    return [];
  }

  // Supplier payout info
  async getSupplierPayoutInfo(supplierId: string): Promise<any | null> {
    (this as any).supplierPayoutInfo = (this as any).supplierPayoutInfo || {};
    return (this as any).supplierPayoutInfo[supplierId] || null;
  }

  async setSupplierPayoutInfo(supplierId: string, info: any): Promise<void> {
    (this as any).supplierPayoutInfo = (this as any).supplierPayoutInfo || {};
    (this as any).supplierPayoutInfo[supplierId] = { ...(this as any).supplierPayoutInfo[supplierId], ...info, updatedAt: new Date() };
  }

  // Production updates
  async createProductionUpdate(orderId: string, stage: string, detail: string, updatedBy: string): Promise<any> {
    const update = {
      id: randomUUID(),
      orderId,
      stage,
      detail,
      updatedBy,
      createdAt: new Date(),
    };
    (this as any).productionUpdates = (this as any).productionUpdates || [];
    (this as any).productionUpdates.push(update);
    return update;
  }

  async getProductionUpdates(orderId: string): Promise<any[]> {
    (this as any).productionUpdates = (this as any).productionUpdates || [];
    return (this as any).productionUpdates.filter((u: any) => u.orderId === orderId).sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  // Logistics requests
  async createLogisticsRequest(data: { buyerId: string; source: string; destination: string; weightKg: number; size: string; insuranceRequired?: boolean; notes?: string; pickupDate?: Date }): Promise<LogisticsRequest> {
    const request: LogisticsRequest = {
      id: randomUUID(),
      buyerId: data.buyerId,
      source: data.source,
      destination: data.destination,
      weightKg: data.weightKg as any,
      size: data.size,
      insuranceRequired: !!data.insuranceRequired,
      notes: data.notes || null as any,
      pickupDate: (data.pickupDate ? new Date(data.pickupDate) : null) as any,
      createdAt: new Date(),
    } as any;
    this.logisticsRequests.push(request);
    return request;
  }

  async getAllLogisticsRequests(): Promise<LogisticsRequest[]> {
    return this.logisticsRequests.sort((a, b) => new Date(b.createdAt as any).getTime() - new Date(a.createdAt as any).getTime());
  }

  // EarlyPay
  async createEarlypayRequest(data: { supplierId: string; invoiceNumber: string; amount: number; currency?: string; orderId?: string | null; deliveredConfirmed: boolean; buyerInvoiceApproved: boolean; expectedDays?: number; notes?: string }): Promise<EarlypayRequest> {
    const req: EarlypayRequest = {
      id: randomUUID(),
      supplierId: data.supplierId,
      orderId: (data.orderId || null) as any,
      invoiceNumber: data.invoiceNumber,
      amount: data.amount as any,
      currency: (data.currency || 'INR') as any,
      deliveredConfirmed: !!data.deliveredConfirmed,
      buyerInvoiceApproved: !!data.buyerInvoiceApproved,
      expectedDays: (data.expectedDays ?? 5) as any,
      notes: (data.notes || null) as any,
      status: 'requested' as any,
      createdAt: new Date(),
    } as any;
    this.earlypayRequests.push(req);
    return req;
  }

  async getEarlypayRequestsBySupplier(supplierId: string): Promise<EarlypayRequest[]> {
    return this.earlypayRequests.filter(r => r.supplierId === supplierId).sort((a, b) => new Date(b.createdAt as any).getTime() - new Date(a.createdAt as any).getTime());
  }

  async getAllEarlypayRequests(): Promise<EarlypayRequest[]> {
    return this.earlypayRequests.sort((a, b) => new Date(b.createdAt as any).getTime() - new Date(a.createdAt as any).getTime());
  }
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
  getUsersByRole(role: string): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUserCompany(userId: string, companyId: string): Promise<void>;

  // Company management
  getCompany(id: string): Promise<Company | undefined>;
  createCompany(company: InsertCompany): Promise<Company>;

  // Supplier management
  getSupplierProfile(companyId: string): Promise<SupplierProfile | undefined>;
  createSupplierProfile(profile: InsertSupplierProfile): Promise<SupplierProfile>;
  getSuppliersByCapabilities(capabilities: string[]): Promise<Array<{ user: User; company: Company; profile: SupplierProfile }>>;

  // Document management
  createDocument(document: InsertDocument): Promise<Document>;
  getDocumentsByCompany(companyId: string): Promise<Document[]>;
  getDocumentsByType(companyId: string, docType: string): Promise<Document[]>;
  getInvoiceByOrder(orderId: string): Promise<Document | undefined>;
  deleteDocument(id: string): Promise<void>;

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
  getAllOrders(): Promise<Order[]>;
  updateOrderStatus(id: string, status: string): Promise<void>;
  updateOrderTotalAmount(id: string, totalAmount: string): Promise<void>;
  updateOrderDepositPaid(id: string, depositPaid: boolean): Promise<void>;
  // Production updates
  createProductionUpdate(orderId: string, stage: string, detail: string, updatedBy: string): Promise<any>;
  getProductionUpdates(orderId: string): Promise<any[]>;

  // Supplier payouts
  getPayoutsBySupplier(supplierId: string): Promise<any[]>;
  getSupplierPayoutInfo(supplierId: string): Promise<any | null>;
  setSupplierPayoutInfo(supplierId: string, info: any): Promise<void>;

  // Admin-specific methods
  getAllRFQs(): Promise<RFQ[]>;
  updateSupplierVerificationStatus(companyId: string, status: string): Promise<void>;

  // Payment methods management
  getPaymentMethods(): Promise<PaymentMethod[]>;
  getActivePaymentMethods(): Promise<PaymentMethod[]>;
  createPaymentMethod(method: InsertPaymentMethod): Promise<PaymentMethod>;
  updatePaymentMethod(id: string, data: Partial<InsertPaymentMethod>): Promise<void>;
  deletePaymentMethod(id: string): Promise<void>;

  // Payment configurations management
  getPaymentConfigurations(): Promise<PaymentConfiguration[]>;
  getPaymentConfiguration(configType: string): Promise<PaymentConfiguration | undefined>;
  createPaymentConfiguration(config: InsertPaymentConfiguration): Promise<PaymentConfiguration>;
  updatePaymentConfiguration(id: string, data: Partial<InsertPaymentConfiguration>): Promise<void>;

  // Payment transactions management
  createPaymentTransaction(transaction: InsertPaymentTransaction): Promise<PaymentTransaction>;
  getPaymentTransaction(id: string): Promise<PaymentTransaction | undefined>;
  getPaymentTransactionByRef(transactionRef: string): Promise<PaymentTransaction | undefined>;
  updatePaymentTransactionStatus(id: string, status: string, gatewayResponse?: any): Promise<void>;
  getPaymentTransactionsByPayer(payerId: string): Promise<PaymentTransaction[]>;
  getPaymentTransactionsByOrder(orderId: string): Promise<PaymentTransaction[]>;
  getPaymentTransactionsByOffer(curatedOfferId: string): Promise<PaymentTransaction[]>;
  linkPaymentTransactionToOrder(transactionId: string, orderId: string): Promise<void>;
  // Admin reporting
  getAllPaymentTransactions(): Promise<PaymentTransaction[]>;
  // Supplier portal helper
  getPaymentTransactionsBySupplier(supplierId: string): Promise<PaymentTransaction[]>;

  // Curated offers with payment fields
  createCuratedOffer(offer: InsertCuratedOffer): Promise<CuratedOffer>;
  getCuratedOffer(id: string): Promise<CuratedOffer | undefined>;
  getCuratedOffersByRFQ(rfqId: string): Promise<CuratedOffer[]>;
  updateCuratedOfferPayment(id: string, paymentData: {
    paymentLink?: string;
    advancePaymentAmount?: number;
    finalPaymentAmount?: number;
    paymentDeadline?: Date;
    paymentTerms?: string;
  }): Promise<void>;
  getAdminMetrics(): Promise<{
    activeRFQs: number;
    verifiedSuppliers: number;
    monthlyVolume: number;
    successRate: number;
  }>;
  getAllQuotes(): Promise<Array<Quote & { rfq: RFQ; supplier: User }>>;
  createCuratedOffer(offer: InsertCuratedOffer): Promise<CuratedOffer>;
  getCuratedOffers(): Promise<Array<CuratedOffer & { rfq: RFQ }>>;
  getCuratedOffersByBuyer(buyerId: string): Promise<Array<CuratedOffer & { rfq: RFQ }>>;
  publishCuratedOffer(offerId: string): Promise<void>;

  // Notification management
  createNotification(notification: InsertNotification): Promise<Notification>;
  getNotificationsByUser(userId: string): Promise<Notification[]>;
  getUnreadNotificationCount(userId: string): Promise<number>;
  markNotificationAsRead(notificationId: string): Promise<void>;
  markAllNotificationsAsRead(userId: string): Promise<void>;

  // Logistics
  createLogisticsRequest(data: { buyerId: string; source: string; destination: string; weightKg: number; size: string; insuranceRequired?: boolean; notes?: string; pickupDate?: Date }): Promise<LogisticsRequest>;
  getAllLogisticsRequests(): Promise<LogisticsRequest[]>;

  // EarlyPay
  createEarlypayRequest(data: { supplierId: string; invoiceNumber: string; amount: number; currency?: string; orderId?: string | null; deliveredConfirmed: boolean; buyerInvoiceApproved: boolean; expectedDays?: number; notes?: string }): Promise<EarlypayRequest>;
  getEarlypayRequestsBySupplier(supplierId: string): Promise<EarlypayRequest[]>;
  getAllEarlypayRequests(): Promise<EarlypayRequest[]>;
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

  async getUsersByRole(role: string): Promise<User[]> {
    const result = await db.select().from(users).where(eq(users.role, role as any));
    return result;
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

  async createDocument(document: InsertDocument): Promise<Document> {
    const result = await db.insert(documents).values(document).returning();
    return result[0];
  }

  async getDocumentsByCompany(companyId: string): Promise<Document[]> {
    return await db.select().from(documents).where(eq(documents.companyId, companyId));
  }

  async getDocumentsByType(companyId: string, docType: string): Promise<Document[]> {
    return await db.select().from(documents).where(and(eq(documents.companyId, companyId), eq(documents.docType, docType)));
  }

  async deleteDocument(id: string): Promise<void> {
    await db.delete(documents).where(eq(documents.id, id));
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

  async getAllOrders(): Promise<Order[]> {
    return await db.select().from(orders).orderBy(desc(orders.createdAt));
  }

  async updateOrderStatus(id: string, status: string): Promise<void> {
    await db.update(orders).set({ status: status as any, updatedAt: new Date() }).where(eq(orders.id, id));
  }

  async updateOrderTotalAmount(id: string, totalAmount: string): Promise<void> {
    await db.update(orders).set({ totalAmount, updatedAt: new Date() }).where(eq(orders.id, id));
  }

  async updateOrderDepositPaid(id: string, depositPaid: boolean): Promise<void> {
    await db.update(orders).set({ depositPaid, updatedAt: new Date() }).where(eq(orders.id, id));
  }

  // Admin-specific methods
  async getAllRFQs(): Promise<RFQ[]> {
    return await db.select().from(rfqs).orderBy(desc(rfqs.createdAt));
  }

  async updateSupplierVerificationStatus(companyId: string, status: string): Promise<void> {
    await db.update(supplierProfiles).set({ 
      verifiedStatus: status as any, 
      updatedAt: new Date() 
    }).where(eq(supplierProfiles.companyId, companyId));
  }

  async getAdminMetrics(): Promise<{
    activeRFQs: number;
    verifiedSuppliers: number;
    monthlyVolume: number;
    successRate: number;
  }> {
    const activeRFQs = await db.select().from(rfqs).where(
      inArray(rfqs.status, ['submitted', 'under_review', 'invited', 'offers_published'])
    );
    
    const verifiedSuppliers = await db.select().from(supplierProfiles).where(
      inArray(supplierProfiles.verifiedStatus, ['bronze', 'silver', 'gold'])
    );

    // Calculate real metrics from actual data
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);
    
    // Monthly volume: sum of all orders from current month  
    const monthlyOrders = await db.select().from(orders).where(
      gte(orders.createdAt, currentMonth)
    );
    
    const monthlyVolume = monthlyOrders.reduce((sum: number, order: any) => {
      const amount = order.totalAmount ? parseFloat(order.totalAmount.toString()) : 0;
      return sum + amount;
    }, 0);
    
    // Success rate: percentage of completed orders vs total orders
    const completedOrders = await db.select().from(orders).where(
      inArray(orders.status, ['delivered', 'closed'])
    );
    
    const totalOrders = await db.select().from(orders);
    const successRate = totalOrders.length > 0 ? (completedOrders.length / totalOrders.length) * 100 : 0;

    return {
      activeRFQs: activeRFQs.length,
      verifiedSuppliers: verifiedSuppliers.length,
      monthlyVolume: Math.round(monthlyVolume),
      successRate: Math.round(successRate * 100) / 100, // Round to 2 decimal places
    };
  }

  async getAllQuotes(): Promise<Array<Quote & { rfq: RFQ; supplier: User }>> {
    const result = await db
      .select({
        quote: quotes,
        rfq: rfqs,
        supplier: users,
      })
      .from(quotes)
      .innerJoin(rfqs, eq(quotes.rfqId, rfqs.id))
      .innerJoin(users, eq(quotes.supplierId, users.id))
      .orderBy(desc(quotes.createdAt));
    
    return result.map((r: any) => ({ ...r.quote, rfq: r.rfq, supplier: r.supplier }));
  }

  async createCuratedOffer(offer: InsertCuratedOffer): Promise<CuratedOffer> {
    const result = await db.insert(curatedOffers).values(offer).returning();
    return result[0];
  }

  async getCuratedOffers(): Promise<Array<CuratedOffer & { rfq: RFQ }>> {
    const result = await db
      .select({
        offer: curatedOffers,
        rfq: rfqs,
      })
      .from(curatedOffers)
      .innerJoin(rfqs, eq(curatedOffers.rfqId, rfqs.id))
      .orderBy(desc(curatedOffers.publishedAt));
    
    return result.map((r: any) => ({ ...r.offer, rfq: r.rfq }));
  }

  async getCuratedOffersByBuyer(buyerId: string): Promise<Array<CuratedOffer & { rfq: RFQ }>> {
    const result = await db
      .select({
        offer: curatedOffers,
        rfq: rfqs,
      })
      .from(curatedOffers)
      .innerJoin(rfqs, eq(curatedOffers.rfqId, rfqs.id))
      .where(and(
        eq(rfqs.buyerId, buyerId),
        isNotNull(curatedOffers.publishedAt)
      ))
      .orderBy(desc(curatedOffers.publishedAt));
    
    return result.map((r: any) => ({ ...r.offer, rfq: r.rfq }));
  }

  async publishCuratedOffer(offerId: string): Promise<void> {
    await db.update(curatedOffers).set({ 
      publishedAt: new Date() 
    }).where(eq(curatedOffers.id, offerId));
  }

  // Notification methods
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const result = await db.insert(notifications).values(notification).returning();
    return result[0];
  }

  async getNotificationsByUser(userId: string): Promise<Notification[]> {
    return await db.select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    return Number(result[0]?.count || 0);
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    await db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, notificationId));
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await db.update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  }

  // Payment methods
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    return await db.select().from(paymentMethods);
  }

  async getActivePaymentMethods(): Promise<PaymentMethod[]> {
    return await db.select().from(paymentMethods).where(eq(paymentMethods.isActive, true));
  }

  async createPaymentMethod(method: InsertPaymentMethod): Promise<PaymentMethod> {
    const result = await db.insert(paymentMethods).values(method).returning();
    return result[0];
  }

  async updatePaymentMethod(id: string, data: Partial<InsertPaymentMethod>): Promise<void> {
    await db.update(paymentMethods).set({ ...data, updatedAt: new Date() }).where(eq(paymentMethods.id, id));
  }

  async deletePaymentMethod(id: string): Promise<void> {
    await db.delete(paymentMethods).where(eq(paymentMethods.id, id));
  }

  // Payment configurations
  async getPaymentConfigurations(): Promise<PaymentConfiguration[]> {
    return await db.select().from(paymentConfigurations);
  }

  async getPaymentConfiguration(configType: string): Promise<PaymentConfiguration | undefined> {
    const result = await db.select().from(paymentConfigurations).where(eq(paymentConfigurations.configType, configType as any)).limit(1);
    return result[0];
  }

  async createPaymentConfiguration(config: InsertPaymentConfiguration): Promise<PaymentConfiguration> {
    const result = await db.insert(paymentConfigurations).values(config).returning();
    return result[0];
  }

  async updatePaymentConfiguration(id: string, data: Partial<InsertPaymentConfiguration>): Promise<void> {
    await db.update(paymentConfigurations).set({ ...data, updatedAt: new Date() }).where(eq(paymentConfigurations.id, id));
  }

  // Payment transactions
  async createPaymentTransaction(transaction: InsertPaymentTransaction): Promise<PaymentTransaction> {
    const result = await db.insert(paymentTransactions).values(transaction).returning();
    return result[0];
  }

  async getPaymentTransaction(id: string): Promise<PaymentTransaction | undefined> {
    const result = await db.select().from(paymentTransactions).where(eq(paymentTransactions.id, id)).limit(1);
    return result[0];
  }

  async getPaymentTransactionByRef(transactionRef: string): Promise<PaymentTransaction | undefined> {
    const result = await db.select().from(paymentTransactions).where(eq(paymentTransactions.transactionRef, transactionRef)).limit(1);
    return result[0];
  }

  async updatePaymentTransactionStatus(id: string, status: string, gatewayResponse?: any): Promise<void> {
    await db.update(paymentTransactions).set({ 
      status: status as any, 
      gatewayResponse: gatewayResponse || null,
      updatedAt: new Date() 
    }).where(eq(paymentTransactions.id, id));
  }

  async linkPaymentTransactionToOrder(transactionId: string, orderId: string): Promise<void> {
    await db.update(paymentTransactions)
      .set({ orderId, updatedAt: new Date() })
      .where(eq(paymentTransactions.id, transactionId));
  }

  async getPaymentTransactionsByPayer(payerId: string): Promise<PaymentTransaction[]> {
    return await db.select().from(paymentTransactions).where(eq(paymentTransactions.payerId, payerId)).orderBy(desc(paymentTransactions.createdAt));
  }

  async getPaymentTransactionsByOrder(orderId: string): Promise<PaymentTransaction[]> {
    return await db.select().from(paymentTransactions).where(eq(paymentTransactions.orderId, orderId)).orderBy(desc(paymentTransactions.createdAt));
  }

  async getPaymentTransactionsByOffer(curatedOfferId: string): Promise<PaymentTransaction[]> {
    return await db.select().from(paymentTransactions).where(eq(paymentTransactions.curatedOfferId, curatedOfferId)).orderBy(desc(paymentTransactions.createdAt));
  }

  // Additional offer methods
  async getCuratedOffer(id: string): Promise<CuratedOffer | undefined> {
    const result = await db.select().from(curatedOffers).where(eq(curatedOffers.id, id)).limit(1);
    return result[0];
  }

  async getCuratedOffersByRFQ(rfqId: string): Promise<CuratedOffer[]> {
    return await db.select().from(curatedOffers).where(eq(curatedOffers.rfqId, rfqId)).orderBy(desc(curatedOffers.publishedAt));
  }

  async updateCuratedOfferPayment(id: string, paymentData: {
    paymentLink?: string;
    advancePaymentAmount?: number;
    finalPaymentAmount?: number;
    paymentDeadline?: Date;
    paymentTerms?: string;
  }): Promise<void> {
    await db.update(curatedOffers).set({
      paymentLink: paymentData.paymentLink || null,
      advancePaymentAmount: paymentData.advancePaymentAmount?.toString() || null,
      finalPaymentAmount: paymentData.finalPaymentAmount?.toString() || null,
      paymentDeadline: paymentData.paymentDeadline || null,
      paymentTerms: paymentData.paymentTerms || null,
    }).where(eq(curatedOffers.id, id));
  }

  async getPayoutsBySupplier(supplierId: string): Promise<any[]> {
    // Return empty array as payouts are not implemented yet
    return [];
  }

  // Logistics
  async createLogisticsRequest(data: { buyerId: string; source: string; destination: string; weightKg: number; size: string; insuranceRequired?: boolean; notes?: string; pickupDate?: Date }): Promise<LogisticsRequest> {
    const result = await db.insert(logisticsRequests).values({
      buyerId: data.buyerId,
      source: data.source,
      destination: data.destination,
      weightKg: data.weightKg as any,
      size: data.size,
      insuranceRequired: !!data.insuranceRequired,
      notes: data.notes || null,
      pickupDate: data.pickupDate ? new Date(data.pickupDate) : null,
    }).returning();
    return result[0] as LogisticsRequest;
  }

  async getAllLogisticsRequests(): Promise<LogisticsRequest[]> {
    const result = await db.select().from(logisticsRequests).orderBy(desc(logisticsRequests.createdAt as any));
    return result as LogisticsRequest[];
  }

  // EarlyPay
  async createEarlypayRequest(data: { supplierId: string; invoiceNumber: string; amount: number; currency?: string; orderId?: string | null; deliveredConfirmed: boolean; buyerInvoiceApproved: boolean; expectedDays?: number; notes?: string }): Promise<EarlypayRequest> {
    const result = await db.insert(earlypayRequests).values({
      supplierId: data.supplierId,
      orderId: (data.orderId || null) as any,
      invoiceNumber: data.invoiceNumber,
      amount: data.amount as any,
      currency: (data.currency || 'INR') as any,
      deliveredConfirmed: !!data.deliveredConfirmed,
      buyerInvoiceApproved: !!data.buyerInvoiceApproved,
      expectedDays: (data.expectedDays ?? 5) as any,
      notes: data.notes || null,
    }).returning();
    return result[0] as EarlypayRequest;
  }

  async getEarlypayRequestsBySupplier(supplierId: string): Promise<EarlypayRequest[]> {
    const result = await db.select().from(earlypayRequests).where(eq(earlypayRequests.supplierId, supplierId)).orderBy(desc(earlypayRequests.createdAt as any));
    return result as EarlypayRequest[];
  }

  async getAllEarlypayRequests(): Promise<EarlypayRequest[]> {
    const result = await db.select().from(earlypayRequests).orderBy(desc(earlypayRequests.createdAt as any));
    return result as EarlypayRequest[];
  }

  // --- Additional helpers (non-critical DB features with safe fallbacks) ---
  private static supplierPayoutInfoStore: Record<string, any> = {};
  private static productionUpdatesStore: Array<any> = [];

  async getSupplierPayoutInfo(supplierId: string): Promise<any | null> {
    return SupabaseStorage.supplierPayoutInfoStore[supplierId] || null;
  }

  async setSupplierPayoutInfo(supplierId: string, info: any): Promise<void> {
    SupabaseStorage.supplierPayoutInfoStore[supplierId] = {
      ...(SupabaseStorage.supplierPayoutInfoStore[supplierId] || {}),
      ...info,
      updatedAt: new Date(),
    };
  }

  async createProductionUpdate(orderId: string, stage: string, detail: string, updatedBy: string): Promise<any> {
    const update = { id: randomUUID(), orderId, stage, detail, updatedBy, createdAt: new Date() };
    SupabaseStorage.productionUpdatesStore.push(update);
    return update;
  }

  async getProductionUpdates(orderId: string): Promise<any[]> {
    return SupabaseStorage.productionUpdatesStore
      .filter(u => u.orderId === orderId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  async getInvoiceByOrder(orderId: string): Promise<Document | undefined> {
    // Try DB first; if schema mismatch, return undefined to let fallback storage handle
    try {
      const result = await db.select().from(documents).where(eq(documents.docType as any, 'invoice' as any));
      const found = result.find((d: any) => (d.metadata as any)?.orderId === orderId);
      return found as any;
    } catch {
      return undefined;
    }
  }

  async getAllPaymentTransactions(): Promise<PaymentTransaction[]> {
    return await db.select().from(paymentTransactions).orderBy(desc(paymentTransactions.createdAt));
  }

  async getPaymentTransactionsBySupplier(supplierId: string): Promise<PaymentTransaction[]> {
    // Combine direct recipient payouts and transactions linked to supplier orders
    const direct = await db
      .select()
      .from(paymentTransactions)
      .where(eq(paymentTransactions.recipientId, supplierId)) as unknown as PaymentTransaction[];
    const orderTx = await db
      .select()
      .from(paymentTransactions)
      .where(isNotNull(paymentTransactions.orderId)) as unknown as PaymentTransaction[];
    const ordersAll = await db.select().from(orders) as unknown as Order[];
    const linked: PaymentTransaction[] = orderTx.filter((tx: PaymentTransaction) =>
      ordersAll.some((o: Order) => o.id === tx.orderId && o.supplierId === supplierId)
    );
    const map = new Map<string, PaymentTransaction>();
    [...direct, ...linked].forEach((tx: PaymentTransaction) => map.set(tx.id, tx));
    return Array.from(map.values());
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
      // Use in-memory for THIS call only to avoid invalidating authenticated sessions
      // that depend on DB users. We won't permanently flip to fallback here.
      return operation(this.inMemoryStorage);
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.withFallback(async (storage) => storage.getUser(id));
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.withFallback(async (storage) => storage.getUserByEmail(email));
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return this.withFallback(async (storage) => storage.getUsersByRole(role));
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
    return this.withFallback(async (storage) => storage.getSupplierProfile(companyId));
  }

  async createSupplierProfile(profile: any): Promise<any> {
    return this.withFallback(async (storage) => storage.createSupplierProfile(profile));
  }

  async getSuppliersByCapabilities(capabilities: string[]): Promise<any> {
    return this.withFallback(async (storage) => storage.getSuppliersByCapabilities(capabilities));
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
    return this.withFallback(async (storage) => storage.createRFQ(rfq));
  }

  async getRFQ(id: string): Promise<any> {
    return this.withFallback(async (storage) => storage.getRFQ(id));
  }

  async getRFQsByBuyer(buyerId: string): Promise<RFQ[]> {
    return this.withFallback(async (storage) => storage.getRFQsByBuyer(buyerId));
  }

  async updateRFQStatus(id: string, status: string): Promise<void> {
    return this.withFallback(async (storage) => storage.updateRFQStatus(id, status));
  }

  async createQuote(quote: any): Promise<any> {
    return this.withFallback(async (storage) => storage.createQuote(quote));
  }

  async getQuotesByRFQ(rfqId: string): Promise<Quote[]> {
    return this.withFallback(async (storage) => storage.getQuotesByRFQ(rfqId));
  }

  async getQuotesBySupplier(supplierId: string): Promise<Quote[]> {
    return this.withFallback(async (storage) => storage.getQuotesBySupplier(supplierId));
  }

  async createSupplierInvite(rfqId: string, supplierId: string, invitedBy: string): Promise<void> {
    return this.withFallback(async (storage) => storage.createSupplierInvite(rfqId, supplierId, invitedBy));
  }

  async getSupplierInvites(supplierId: string): Promise<any> {
    return this.withFallback(async (storage) => storage.getSupplierInvites(supplierId));
  }

  async createOrder(orderData: any): Promise<any> {
    return this.withFallback(async (storage) => storage.createOrder(orderData));
  }

  async getOrdersByBuyer(buyerId: string): Promise<Order[]> {
    return this.withFallback(async (storage) => storage.getOrdersByBuyer(buyerId));
  }

  async getOrdersBySupplier(supplierId: string): Promise<Order[]> {
    return this.withFallback(async (storage) => storage.getOrdersBySupplier(supplierId));
  }

  async getAllOrders(): Promise<Order[]> {
    return this.withFallback(async (storage) => storage.getAllOrders());
  }

  async updateOrderStatus(id: string, status: string): Promise<void> {
    return this.withFallback(async (storage) => storage.updateOrderStatus(id, status));
  }

  async updateOrderTotalAmount(id: string, totalAmount: string): Promise<void> {
    return this.withFallback(async (storage) => storage.updateOrderTotalAmount(id, totalAmount));
  }

  async updateOrderDepositPaid(id: string, depositPaid: boolean): Promise<void> {
    return this.withFallback(async (storage) => storage.updateOrderDepositPaid(id, depositPaid));
  }

  async createDocument(document: InsertDocument): Promise<Document> {
    return this.withFallback(async (storage) => storage.createDocument(document));
  }

  async getDocumentsByCompany(companyId: string): Promise<Document[]> {
    return this.withFallback(async (storage) => storage.getDocumentsByCompany(companyId));
  }

  async getDocumentsByType(companyId: string, docType: string): Promise<Document[]> {
    return this.withFallback(async (storage) => storage.getDocumentsByType(companyId, docType));
  }

  async deleteDocument(id: string): Promise<void> {
    return this.withFallback(async (storage) => storage.deleteDocument(id));
  }

  // Admin methods
  async getAllRFQs(): Promise<any> {
    return this.withFallback(async (storage) => storage.getAllRFQs());
  }

  async updateSupplierVerificationStatus(companyId: string, status: string): Promise<void> {
    return this.withFallback(async (storage) => storage.updateSupplierVerificationStatus(companyId, status));
  }

  async getAdminMetrics(): Promise<any> {
    return this.withFallback(async (storage) => storage.getAdminMetrics());
  }

  async getAllQuotes(): Promise<any> {
    return this.withFallback(async (storage) => storage.getAllQuotes());
  }

  async createCuratedOffer(offer: InsertCuratedOffer): Promise<CuratedOffer> {
    return this.withFallback(async (storage) => storage.createCuratedOffer(offer));
  }

  async getCuratedOffers(): Promise<any> {
    return this.withFallback(async (storage) => storage.getCuratedOffers());
  }

  async getCuratedOffersByBuyer(buyerId: string): Promise<Array<CuratedOffer & { rfq: RFQ }>> {
    return this.withFallback(async (storage) => storage.getCuratedOffersByBuyer(buyerId));
  }

  async publishCuratedOffer(offerId: string): Promise<void> {
    return this.withFallback(async (storage) => storage.publishCuratedOffer(offerId));
  }

  // Notification methods
  async createNotification(notification: InsertNotification): Promise<Notification> {
    return this.withFallback(async (storage) => storage.createNotification(notification));
  }

  async getNotificationsByUser(userId: string): Promise<Notification[]> {
    return this.withFallback(async (storage) => storage.getNotificationsByUser(userId));
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    return this.withFallback(async (storage) => storage.getUnreadNotificationCount(userId));
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    return this.withFallback(async (storage) => storage.markNotificationAsRead(notificationId));
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    return this.withFallback(async (storage) => storage.markAllNotificationsAsRead(userId));
  }

  async createLogisticsRequest(data: { buyerId: string; source: string; destination: string; weightKg: number; size: string; insuranceRequired?: boolean; notes?: string; pickupDate?: Date }) {
    return this.withFallback(async (storage) => storage.createLogisticsRequest(data));
  }

  async getAllLogisticsRequests() {
    return this.withFallback(async (storage) => storage.getAllLogisticsRequests());
  }

  async createEarlypayRequest(data: { supplierId: string; invoiceNumber: string; amount: number; currency?: string; orderId?: string | null; deliveredConfirmed: boolean; buyerInvoiceApproved: boolean; expectedDays?: number; notes?: string }) {
    return this.withFallback(async (storage) => storage.createEarlypayRequest(data));
  }

  async getEarlypayRequestsBySupplier(supplierId: string) {
    return this.withFallback(async (storage) => storage.getEarlypayRequestsBySupplier(supplierId));
  }

  async getAllEarlypayRequests() {
    return this.withFallback(async (storage) => storage.getAllEarlypayRequests());
  }

  // Payment methods
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    return this.withFallback(async (storage) => storage.getPaymentMethods());
  }

  async getActivePaymentMethods(): Promise<PaymentMethod[]> {
    return this.withFallback(async (storage) => storage.getActivePaymentMethods());
  }

  async createPaymentMethod(method: InsertPaymentMethod): Promise<PaymentMethod> {
    return this.withFallback(async (storage) => storage.createPaymentMethod(method));
  }

  async updatePaymentMethod(id: string, data: Partial<InsertPaymentMethod>): Promise<void> {
    return this.withFallback(async (storage) => storage.updatePaymentMethod(id, data));
  }

  async deletePaymentMethod(id: string): Promise<void> {
    return this.withFallback(async (storage) => storage.deletePaymentMethod(id));
  }

  // Payment configurations
  async getPaymentConfigurations(): Promise<PaymentConfiguration[]> {
    return this.withFallback(async (storage) => storage.getPaymentConfigurations());
  }

  async getPaymentConfiguration(configType: string): Promise<PaymentConfiguration | undefined> {
    return this.withFallback(async (storage) => storage.getPaymentConfiguration(configType));
  }

  async createPaymentConfiguration(config: InsertPaymentConfiguration): Promise<PaymentConfiguration> {
    return this.withFallback(async (storage) => storage.createPaymentConfiguration(config));
  }

  async updatePaymentConfiguration(id: string, data: Partial<InsertPaymentConfiguration>): Promise<void> {
    return this.withFallback(async (storage) => storage.updatePaymentConfiguration(id, data));
  }

  // Payment transactions
  async createPaymentTransaction(transaction: InsertPaymentTransaction): Promise<PaymentTransaction> {
    return this.withFallback(async (storage) => storage.createPaymentTransaction(transaction));
  }

  async getPaymentTransaction(id: string): Promise<PaymentTransaction | undefined> {
    return this.withFallback(async (storage) => storage.getPaymentTransaction(id));
  }

  async getPaymentTransactionByRef(transactionRef: string): Promise<PaymentTransaction | undefined> {
    return this.withFallback(async (storage) => storage.getPaymentTransactionByRef(transactionRef));
  }

  async updatePaymentTransactionStatus(id: string, status: string, gatewayResponse?: any): Promise<void> {
    return this.withFallback(async (storage) => storage.updatePaymentTransactionStatus(id, status, gatewayResponse));
  }

  async linkPaymentTransactionToOrder(transactionId: string, orderId: string): Promise<void> {
    return this.withFallback(async (storage) => storage.linkPaymentTransactionToOrder(transactionId, orderId));
  }

  async getPaymentTransactionsByPayer(payerId: string): Promise<PaymentTransaction[]> {
    return this.withFallback(async (storage) => storage.getPaymentTransactionsByPayer(payerId));
  }

  async getPaymentTransactionsByOrder(orderId: string): Promise<PaymentTransaction[]> {
    return this.withFallback(async (storage) => storage.getPaymentTransactionsByOrder(orderId));
  }

  async getPaymentTransactionsByOffer(curatedOfferId: string): Promise<PaymentTransaction[]> {
    return this.withFallback(async (storage) => storage.getPaymentTransactionsByOffer(curatedOfferId));
  }

  // Additional offer methods
  async getCuratedOffer(id: string): Promise<CuratedOffer | undefined> {
    return this.withFallback(async (storage) => storage.getCuratedOffer(id));
  }

  async getCuratedOffersByRFQ(rfqId: string): Promise<CuratedOffer[]> {
    return this.withFallback(async (storage) => storage.getCuratedOffersByRFQ(rfqId));
  }

  async updateCuratedOfferPayment(id: string, paymentData: {
    paymentLink?: string;
    advancePaymentAmount?: number;
    finalPaymentAmount?: number;
    paymentDeadline?: Date;
    paymentTerms?: string;
  }): Promise<void> {
    return this.withFallback(async (storage) => storage.updateCuratedOfferPayment(id, paymentData));
  }

  async getPayoutsBySupplier(supplierId: string): Promise<any[]> {
    return this.withFallback(async (storage) => storage.getPayoutsBySupplier(supplierId));
  }

  // Payment transactions admin/supplier helpers
  async getAllPaymentTransactions(): Promise<PaymentTransaction[]> {
    return this.withFallback(async (storage) => storage.getAllPaymentTransactions());
  }

  async getPaymentTransactionsBySupplier(supplierId: string): Promise<PaymentTransaction[]> {
    return this.withFallback(async (storage) => storage.getPaymentTransactionsBySupplier(supplierId));
  }

  // Supplier payout info
  async getSupplierPayoutInfo(supplierId: string): Promise<any | null> {
    return this.withFallback(async (storage) => storage.getSupplierPayoutInfo(supplierId));
  }

  async setSupplierPayoutInfo(supplierId: string, info: any): Promise<void> {
    return this.withFallback(async (storage) => storage.setSupplierPayoutInfo(supplierId, info));
  }

  // Production updates
  async createProductionUpdate(orderId: string, stage: string, detail: string, updatedBy: string): Promise<any> {
    return this.withFallback(async (storage) => storage.createProductionUpdate(orderId, stage, detail, updatedBy));
  }

  async getProductionUpdates(orderId: string): Promise<any[]> {
    return this.withFallback(async (storage) => storage.getProductionUpdates(orderId));
  }

  async getInvoiceByOrder(orderId: string): Promise<Document | undefined> {
    return this.withFallback(async (storage) => storage.getInvoiceByOrder(orderId));
  }
}

// Comprehensive SKU data initialization
const COMPREHENSIVE_SKU_DATA = [
  // Mechanical Manufacturing (9 SKUs)
  {
    code: 'cnc_machining',
    industry: 'mechanical_manufacturing',
    processName: 'CNC Machining',
    description: 'CNC Turning, Milling, and 5-axis machining services for precision manufacturing',
    defaultMoq: 10,
    defaultLeadTimeDays: 14,
    parametersSchema: {
      required: ['material', 'quantity', 'tolerance'],
      optional: ['surface_finish', 'heat_treatment', 'secondary_operations'],
      materials: ['Aluminum', 'Steel', 'Stainless Steel', 'Brass', 'Copper', 'Titanium', 'Plastic'],
      tolerances: ['±0.1mm', '±0.2mm', '±0.5mm', '±1.0mm'],
      surface_finishes: ['As machined', 'Anodized', 'Powder coated', 'Plated']
    }
  },
  {
    code: 'sheet_metal',
    industry: 'mechanical_manufacturing',
    processName: 'Sheet Metal Fabrication',
    description: 'Laser cutting, punching, bending, and welding services for metal fabrication',
    defaultMoq: 5,
    defaultLeadTimeDays: 10,
    parametersSchema: {
      required: ['material', 'thickness', 'quantity'],
      optional: ['surface_finish', 'bending_operations', 'welding_type'],
      materials: ['Mild Steel', 'Stainless Steel', 'Aluminum', 'Galvanized Steel'],
      thickness_range: '0.5mm - 25mm',
      processes: ['Laser cutting', 'Punching', 'Bending', 'Welding']
    }
  },
  {
    code: 'injection_molding',
    industry: 'mechanical_manufacturing',
    processName: 'Injection Molding',
    description: 'Plastic injection molding with soft and hard tooling capabilities',
    defaultMoq: 100,
    defaultLeadTimeDays: 21,
    parametersSchema: {
      required: ['material', 'quantity', 'part_complexity'],
      optional: ['tooling_type', 'surface_finish', 'insert_molding'],
      materials: ['ABS', 'PP', 'PE', 'PC', 'PA', 'POM', 'TPU'],
      tooling_types: ['Soft tooling', 'Hard tooling', 'Aluminum tooling'],
      moq_range: '100 - 100000'
    }
  },
  {
    code: 'die_casting',
    industry: 'mechanical_manufacturing',
    processName: 'Die Casting',
    description: 'Aluminum, Zinc, and Magnesium die casting for precision parts',
    defaultMoq: 50,
    defaultLeadTimeDays: 18,
    parametersSchema: {
      required: ['material', 'quantity', 'part_weight'],
      optional: ['surface_finish', 'machining_required', 'heat_treatment'],
      materials: ['Aluminum', 'Zinc', 'Magnesium'],
      weight_range: '10g - 5kg',
      tolerances: ['±0.1mm', '±0.2mm', '±0.3mm']
    }
  },
  {
    code: 'forging',
    industry: 'mechanical_manufacturing',
    processName: 'Forging',
    description: 'Open die, closed die, and ring rolling forging services',
    defaultMoq: 25,
    defaultLeadTimeDays: 20,
    parametersSchema: {
      required: ['material', 'quantity', 'forging_type'],
      optional: ['heat_treatment', 'machining_allowance', 'grain_flow'],
      materials: ['Carbon Steel', 'Alloy Steel', 'Stainless Steel', 'Aluminum', 'Titanium'],
      forging_types: ['Open die', 'Closed die', 'Ring rolling'],
      weight_range: '0.1kg - 500kg'
    }
  },
  {
    code: 'extrusion',
    industry: 'mechanical_manufacturing',
    processName: 'Extrusion',
    description: 'Aluminum and plastic profile extrusion services',
    defaultMoq: 100,
    defaultLeadTimeDays: 15,
    parametersSchema: {
      required: ['material', 'profile_type', 'quantity'],
      optional: ['surface_finish', 'secondary_operations', 'cutting_length'],
      materials: ['Aluminum', 'PVC', 'ABS', 'PC', 'HDPE'],
      profile_types: ['Standard profiles', 'Custom profiles'],
      length_range: '0.5m - 12m'
    }
  },
  {
    code: '3d_printing',
    industry: 'mechanical_manufacturing',
    processName: '3D Printing',
    description: 'FDM, SLA, SLS, and DMLS 3D printing services',
    defaultMoq: 1,
    defaultLeadTimeDays: 5,
    parametersSchema: {
      required: ['material', 'printing_technology', 'quantity'],
      optional: ['surface_finish', 'support_removal', 'post_processing'],
      technologies: ['FDM', 'SLA', 'SLS', 'DMLS'],
      materials: ['PLA', 'ABS', 'PETG', 'Resin', 'Nylon', 'Metal powders'],
      max_dimensions: '300x300x300mm'
    }
  },
  {
    code: 'tooling_development',
    industry: 'mechanical_manufacturing',
    processName: 'Tooling Development',
    description: 'Molds, dies, jigs, and fixtures development and manufacturing',
    defaultMoq: 1,
    defaultLeadTimeDays: 30,
    parametersSchema: {
      required: ['tooling_type', 'application', 'material'],
      optional: ['expected_runs', 'tolerance_requirements', 'cooling_system'],
      tooling_types: ['Injection molds', 'Die casting dies', 'Jigs', 'Fixtures'],
      materials: ['Tool steel', 'Aluminum', 'Stainless steel'],
      complexity: ['Simple', 'Medium', 'Complex']
    }
  },
  {
    code: 'assembly_kitting',
    industry: 'mechanical_manufacturing',
    processName: 'Assembly & Kitting',
    description: 'Product assembly and kitting services for manufacturing',
    defaultMoq: 10,
    defaultLeadTimeDays: 7,
    parametersSchema: {
      required: ['assembly_type', 'quantity', 'components_count'],
      optional: ['packaging_requirements', 'testing_required', 'documentation'],
      assembly_types: ['Manual assembly', 'Automated assembly', 'Kitting only'],
      complexity: ['Simple', 'Medium', 'Complex'],
      components_range: '2 - 100 components'
    }
  },

  // Electronics & Electrical (6 SKUs)
  {
    code: 'pcb_prototyping',
    industry: 'electronics_electrical',
    processName: 'PCB Prototyping',
    description: 'Fast-turn PCB prototyping services for electronic development',
    defaultMoq: 5,
    defaultLeadTimeDays: 3,
    parametersSchema: {
      required: ['layers', 'dimensions', 'quantity'],
      optional: ['material', 'surface_finish', 'via_type'],
      layers: ['1', '2', '4', '6', '8', '10+'],
      materials: ['FR4', 'Rogers', 'Aluminum', 'Flexible'],
      surface_finishes: ['HASL', 'OSP', 'ENIG', 'Immersion Silver']
    }
  },
  {
    code: 'pcb_assembly',
    industry: 'electronics_electrical',
    processName: 'PCB Assembly',
    description: 'SMT and through-hole PCB assembly services',
    defaultMoq: 10,
    defaultLeadTimeDays: 7,
    parametersSchema: {
      required: ['pcb_type', 'components_count', 'quantity'],
      optional: ['testing_requirements', 'conformal_coating', 'programming'],
      assembly_types: ['SMT only', 'Through-hole only', 'Mixed technology'],
      components_range: '10 - 1000 components',
      testing: ['AOI', 'ICT', 'Functional test', 'Burn-in']
    }
  },
  {
    code: 'cable_harness',
    industry: 'electronics_electrical',
    processName: 'Cable Harness Assembly',
    description: 'Custom cable harness and wire assembly services',
    defaultMoq: 25,
    defaultLeadTimeDays: 10,
    parametersSchema: {
      required: ['cable_type', 'length', 'connectors'],
      optional: ['shielding', 'jacketing', 'labeling'],
      cable_types: ['Power cables', 'Data cables', 'Coaxial', 'Ribbon'],
      length_range: '0.1m - 50m',
      connectors: ['Standard', 'Custom', 'Automotive', 'Industrial']
    }
  },
  {
    code: 'box_build',
    industry: 'electronics_electrical',
    processName: 'Box Build Assembly',
    description: 'Electronic enclosure and system assembly services',
    defaultMoq: 5,
    defaultLeadTimeDays: 14,
    parametersSchema: {
      required: ['enclosure_type', 'complexity', 'quantity'],
      optional: ['testing_requirements', 'labeling', 'documentation'],
      enclosure_types: ['Plastic', 'Metal', 'Custom'],
      complexity: ['Simple', 'Medium', 'Complex'],
      testing: ['Functional', 'Environmental', 'Safety']
    }
  },
  {
    code: 'battery_pack',
    industry: 'electronics_electrical',
    processName: 'Battery Pack Assembly',
    description: 'Custom battery pack assembly and testing services',
    defaultMoq: 10,
    defaultLeadTimeDays: 12,
    parametersSchema: {
      required: ['battery_type', 'voltage', 'capacity'],
      optional: ['bms_required', 'enclosure_type', 'certification'],
      battery_types: ['Li-ion', 'LiFePO4', 'NiMH', 'Lead acid'],
      voltage_range: '3.7V - 400V',
      certifications: ['UN38.3', 'IEC62133', 'UL2054']
    }
  },
  {
    code: 'electronic_testing',
    industry: 'electronics_electrical',
    processName: 'Electronic Testing & QA',
    description: 'ICT, AOI, functional, and burn-in testing services',
    defaultMoq: 1,
    defaultLeadTimeDays: 5,
    parametersSchema: {
      required: ['testing_type', 'product_type', 'quantity'],
      optional: ['test_duration', 'environmental_conditions', 'certification'],
      testing_types: ['ICT', 'AOI', 'Functional', 'Burn-in', 'Environmental'],
      standards: ['IPC', 'IEC', 'MIL-STD', 'ISO'],
      certifications: ['CE', 'FCC', 'RoHS', 'REACH']
    }
  },

  // Packaging & Printing (7 SKUs)
  {
    code: 'corrugated_boxes',
    industry: 'packaging_printing',
    processName: 'Corrugated Boxes',
    description: 'Custom corrugated box manufacturing and printing',
    defaultMoq: 100,
    defaultLeadTimeDays: 10,
    parametersSchema: {
      required: ['box_style', 'dimensions', 'quantity'],
      optional: ['printing', 'coating', 'die_cutting'],
      box_styles: ['RSC', 'HSC', 'FOL', '5PF', 'Custom'],
      flute_types: ['3mm', '5mm', '7mm', 'Double wall'],
      printing: ['Flexo', 'Offset', 'Digital']
    }
  },
  {
    code: 'carton_packaging',
    industry: 'packaging_printing',
    processName: 'Carton Packaging',
    description: 'Printed carton and folding box manufacturing',
    defaultMoq: 500,
    defaultLeadTimeDays: 12,
    parametersSchema: {
      required: ['carton_type', 'material', 'printing_colors'],
      optional: ['surface_finish', 'die_cutting', 'window_patching'],
      carton_types: ['Straight tuck', 'Reverse tuck', 'Auto-lock', 'Custom'],
      materials: ['SBS', 'FBB', 'Kraft', 'Recycled'],
      finishes: ['Matte', 'Gloss', 'UV coating', 'Lamination']
    }
  },
  {
    code: 'labels_stickers',
    industry: 'packaging_printing',
    processName: 'Labels & Stickers',
    description: 'Custom label and sticker printing services',
    defaultMoq: 1000,
    defaultLeadTimeDays: 7,
    parametersSchema: {
      required: ['label_type', 'material', 'printing_method'],
      optional: ['adhesive_type', 'die_cutting', 'finishing'],
      label_types: ['Roll labels', 'Sheet labels', 'Stickers', 'Decals'],
      materials: ['Paper', 'Vinyl', 'Polyester', 'Clear film'],
      printing: ['Digital', 'Flexo', 'Screen', 'Offset']
    }
  },
  {
    code: 'flexible_packaging',
    industry: 'packaging_printing',
    processName: 'Flexible Packaging',
    description: 'Pouches, bags, and laminate manufacturing services',
    defaultMoq: 1000,
    defaultLeadTimeDays: 14,
    parametersSchema: {
      required: ['package_type', 'material_structure', 'size'],
      optional: ['barrier_properties', 'closure_type', 'printing'],
      package_types: ['Stand-up pouches', 'Flat pouches', 'Rollstock', 'Bags'],
      materials: ['PE', 'PP', 'PET', 'Aluminum', 'Paper'],
      barriers: ['Moisture', 'Oxygen', 'Light', 'Aroma']
    }
  },
  {
    code: 'rigid_packaging',
    industry: 'packaging_printing',
    processName: 'Rigid Packaging',
    description: 'Tins, rigid boxes, and container manufacturing',
    defaultMoq: 200,
    defaultLeadTimeDays: 15,
    parametersSchema: {
      required: ['container_type', 'material', 'capacity'],
      optional: ['printing', 'coating', 'closure_type'],
      container_types: ['Tins', 'Rigid boxes', 'Bottles', 'Jars'],
      materials: ['Tinplate', 'Aluminum', 'Plastic', 'Glass'],
      capacity_range: '50ml - 5000ml'
    }
  },
  {
    code: 'foam_protective',
    industry: 'packaging_printing',
    processName: 'Foam & Protective Packaging',
    description: 'Protective foam inserts and packaging solutions',
    defaultMoq: 50,
    defaultLeadTimeDays: 8,
    parametersSchema: {
      required: ['foam_type', 'density', 'application'],
      optional: ['die_cutting', 'lamination', 'conductive_properties'],
      foam_types: ['PU foam', 'EPE foam', 'EPS foam', 'EVA foam'],
      density_range: '15kg/m3 - 100kg/m3',
      properties: ['Anti-static', 'Conductive', 'Fire retardant']
    }
  },
  {
    code: 'biodegradable_packaging',
    industry: 'packaging_printing',
    processName: 'Biodegradable Packaging',
    description: 'Eco-friendly and sustainable packaging solutions',
    defaultMoq: 500,
    defaultLeadTimeDays: 12,
    parametersSchema: {
      required: ['package_type', 'material', 'certification'],
      optional: ['barrier_properties', 'printing', 'composting_time'],
      materials: ['PLA', 'Starch-based', 'Bagasse', 'Paper'],
      certifications: ['Compostable', 'Biodegradable', 'Food contact safe'],
      applications: ['Food packaging', 'Retail', 'E-commerce']
    }
  },
  {
    code: 'blow_molding',
    industry: 'packaging_printing',
    processName: 'Blow Molding - PET/HDPE Bottles & Jars',
    description: 'PET/HDPE bottles & jars (rigid packaging process buyers search for)',
    defaultMoq: 10000,
    defaultLeadTimeDays: 14,
    parametersSchema: {
      required: ['material', 'capacity', 'neck_finish'],
      optional: ['color', 'decoration'],
      material: ['PET', 'HDPE'],
      capacity: ['50ml', '100ml', '250ml', '500ml', '1L'],
      neck_finish: ['18/410', '20/410', '24/410', '28/410'],
      color: ['Clear', 'White', 'Amber', 'Custom'],
      decoration: ['Label', 'Shrink Sleeve', 'Screen Print']
    }
  },
  {
    code: 'thermoformed_trays',
    industry: 'packaging_printing',
    processName: 'Thermoformed Trays - Clamshells & Blister Bases',
    description: 'Clamshells, food/cosmetic trays, blister bases',
    defaultMoq: 5000,
    defaultLeadTimeDays: 12,
    parametersSchema: {
      required: ['material', 'thickness', 'style'],
      optional: ['cavity_count', 'sealing'],
      material: ['PET', 'RPET', 'PVC', 'HIPS'],
      thickness: ['0.2mm', '0.3mm', '0.5mm', '0.8mm'],
      style: ['Clamshell', 'Tray', 'Blister Base'],
      cavity_count: ['Single', '2', '4', '6', 'Custom'],
      sealing: ['Heat Seal', 'Snap Fit']
    }
  },
  {
    code: 'molded_pulp_trays',
    industry: 'packaging_printing',
    processName: 'Molded Pulp Trays - Plastic-free Protection',
    description: 'Eco protective trays for electronics/cosmetics (plastic-free)',
    defaultMoq: 3000,
    defaultLeadTimeDays: 15,
    parametersSchema: {
      required: ['fiber', 'finish'],
      optional: ['color', 'water_resistance'],
      fiber: ['Recycled Pulp', 'Bagasse', 'Bamboo'],
      color: ['Natural', 'Black', 'Dyed'],
      finish: ['Raw', 'Hot-Pressed'],
      water_resistance: ['None', 'Light', 'High']
    }
  },
  {
    code: 'closures_caps_pumps',
    industry: 'packaging_printing',
    processName: 'Closures, Caps & Pumps',
    description: 'Pumps, misters, droppers, flip-tops as separate line item',
    defaultMoq: 5000,
    defaultLeadTimeDays: 10,
    parametersSchema: {
      required: ['type', 'neck_finish'],
      optional: ['color', 'locking'],
      type: ['Pump', 'Mister', 'Dropper', 'Flip-Top', 'Screw Cap'],
      neck_finish: ['18/410', '20/410', '24/410', '28/410'],
      color: ['White', 'Black', 'Natural', 'Custom'],
      locking: ['With Lock', 'Without Lock']
    }
  },
  {
    code: 'shrink_sleeves',
    industry: 'packaging_printing',
    processName: 'Shrink Sleeves - 360° Decoration',
    description: 'Standalone 360° decoration for bottles, jars, containers',
    defaultMoq: 10000,
    defaultLeadTimeDays: 14,
    parametersSchema: {
      required: ['material', 'print'],
      optional: ['finish', 'perforation'],
      material: ['PETG', 'PVC'],
      print: ['Gravure', 'Flexo', 'Digital'],
      finish: ['Matte', 'Gloss'],
      perforation: ['Vertical', 'Horizontal', 'None']
    }
  },

  // Add-ons & Services (4 SKUs)
  {
    code: 'metal_finishing',
    industry: 'addons',
    processName: 'Metal Finishing - Anodizing, Powder Coating, Plating',
    description: 'Standalone finishing services frequently sourced separately',
    defaultMoq: 50,
    defaultLeadTimeDays: 7,
    parametersSchema: {
      required: ['finishing_type', 'substrate', 'color_or_spec'],
      optional: ['thickness', 'masking', 'salt_spray_hours'],
      finishing_types: ['Anodizing', 'Powder coating', 'Plating (Ni/Cr/Zn)'],
      substrates: ['Aluminum', 'Steel', 'Stainless steel', 'Zinc'],
      colors: ['Clear', 'Black', 'Natural', 'RAL/Pantone']
    }
  },
  {
    code: 'heat_treatment_services',
    industry: 'addons',
    processName: 'Heat Treatment Services - Case Hardening, Nitriding, Tempering',
    description: 'Standalone heat treatment RFQs for manufactured parts',
    defaultMoq: 20,
    defaultLeadTimeDays: 7,
    parametersSchema: {
      required: ['treatment_type', 'material_grade', 'hardness_spec'],
      optional: ['case_depth', 'distortion_control', 'certification'],
      treatment_types: ['Case hardening', 'Nitriding', 'Tempering', 'Normalizing', 'Annealing'],
      hardness_scale: ['HRC', 'HBW', 'HV']
    }
  },
  {
    code: 'qc_inspection_certification',
    industry: 'addons',
    processName: 'QC, Inspection & Certification - PPAP, CMM, CE/RoHS/REACH',
    description: 'Charge for compliance deliverables without exposing suppliers',
    defaultMoq: 1,
    defaultLeadTimeDays: 5,
    parametersSchema: {
      required: ['documentation_type'],
      optional: ['sample_size', 'report_format', 'standard'],
      documentation_types: ['PPAP', 'CMM report', 'CE', 'RoHS', 'REACH', 'Custom COA'],
      standards: ['ISO', 'IEC', 'ASTM', 'DIN']
    }
  },
  {
    code: 'component_sourcing_kitting',
    industry: 'addons',
    processName: 'Component Sourcing & Kitting (Electronics/Assemblies)',
    description: 'BOM procurement and kitting; keeps supplier hidden and boosts margin',
    defaultMoq: 1,
    defaultLeadTimeDays: 10,
    parametersSchema: {
      required: ['bom_items', 'target_lead_time'],
      optional: ['approved_vendors', 'alternates_allowed', 'packaging'],
      packaging: ['Reels', 'Cut tape', 'Trays', 'Bags', 'Kits']
    }
  },

  // Textile & Leather (5 SKUs)
  {
    code: 'cut_and_sew',
    industry: 'textile_leather',
    processName: 'Cut & Sew Jobwork',
    description: 'Garment and uniform manufacturing services',
    defaultMoq: 50,
    defaultLeadTimeDays: 15,
    parametersSchema: {
      required: ['garment_type', 'fabric_type', 'sizes'],
      optional: ['printing', 'embroidery', 'special_features'],
      garment_types: ['T-shirts', 'Shirts', 'Pants', 'Uniforms', 'Workwear'],
      fabrics: ['Cotton', 'Polyester', 'Blends', 'Functional fabrics'],
      sizes: ['XS-XXL', 'Custom sizing']
    }
  },
  {
    code: 'embroidery_printing',
    industry: 'textile_leather',
    processName: 'Embroidery & Printing',
    description: 'Screen printing and embroidery services for textiles',
    defaultMoq: 25,
    defaultLeadTimeDays: 7,
    parametersSchema: {
      required: ['decoration_type', 'design_complexity', 'quantity'],
      optional: ['colors', 'placement', 'special_effects'],
      decoration_types: ['Screen printing', 'Digital printing', 'Embroidery', 'Heat transfer'],
      complexity: ['Simple', 'Medium', 'Complex', 'Multi-color'],
      placements: ['Front', 'Back', 'Sleeve', 'Multiple locations']
    }
  },
  {
    code: 'knitting_weaving',
    industry: 'textile_leather',
    processName: 'Knitting & Weaving',
    description: 'Fabric production and textile manufacturing services',
    defaultMoq: 100,
    defaultLeadTimeDays: 20,
    parametersSchema: {
      required: ['fabric_type', 'yarn_specification', 'width'],
      optional: ['weight', 'finish', 'pattern'],
      fabric_types: ['Knitted', 'Woven', 'Non-woven'],
      yarns: ['Cotton', 'Polyester', 'Wool', 'Blends', 'Technical yarns'],
      widths: ['150cm', '180cm', '220cm', 'Custom']
    }
  },
  {
    code: 'leather_goods',
    industry: 'textile_leather',
    processName: 'Leather Goods Manufacturing',
    description: 'Manufacturing of bags, belts, wallets, and leather accessories',
    defaultMoq: 20,
    defaultLeadTimeDays: 18,
    parametersSchema: {
      required: ['product_type', 'leather_type', 'quality_grade'],
      optional: ['hardware', 'lining', 'customization'],
      product_types: ['Bags', 'Belts', 'Wallets', 'Accessories', 'Footwear'],
      leather_types: ['Genuine leather', 'PU leather', 'Synthetic'],
      grades: ['Top grain', 'Full grain', 'Split leather']
    }
  },
  {
    code: 'upholstery',
    industry: 'textile_leather',
    processName: 'Upholstery Jobwork',
    description: 'Automotive and furniture upholstery services',
    defaultMoq: 10,
    defaultLeadTimeDays: 12,
    parametersSchema: {
      required: ['application', 'material_type', 'pattern'],
      optional: ['foam_type', 'stitching_style', 'trim'],
      applications: ['Automotive', 'Furniture', 'Marine', 'Aviation'],
      materials: ['Leather', 'Vinyl', 'Fabric', 'Technical textiles'],
      features: ['Fire retardant', 'Water resistant', 'UV resistant']
    }
  },

  // Construction & Infrastructure (7 SKUs)
  {
    code: 'structural_steel',
    industry: 'construction_infrastructure',
    processName: 'Structural Steel Fabrication',
    description: 'Building and infrastructure steel fabrication services',
    defaultMoq: 1,
    defaultLeadTimeDays: 21,
    parametersSchema: {
      required: ['steel_grade', 'structure_type', 'drawings'],
      optional: ['surface_treatment', 'welding_certification', 'erection'],
      steel_grades: ['IS2062', 'IS800', 'ASTM A36', 'ASTM A572'],
      structure_types: ['Beams', 'Columns', 'Trusses', 'Frames'],
      treatments: ['Galvanizing', 'Painting', 'Fireproofing']
    }
  },
  {
    code: 'prefab_modules',
    industry: 'construction_infrastructure',
    processName: 'Prefab Modules',
    description: 'Site cabins, sheds, and modular structure manufacturing',
    defaultMoq: 1,
    defaultLeadTimeDays: 25,
    parametersSchema: {
      required: ['module_type', 'dimensions', 'specifications'],
      optional: ['insulation', 'electrical', 'plumbing'],
      module_types: ['Site offices', 'Toilets', 'Stores', 'Accommodation'],
      materials: ['Steel frame', 'Sandwich panels', 'Container based'],
      features: ['Insulated', 'AC ready', 'Furnished']
    }
  },
  {
    code: 'metal_joinery',
    industry: 'construction_infrastructure',
    processName: 'Metal Joinery & Welding',
    description: 'Custom metalwork and fabrication services',
    defaultMoq: 5,
    defaultLeadTimeDays: 14,
    parametersSchema: {
      required: ['metal_type', 'joinery_type', 'finish'],
      optional: ['installation', 'hardware', 'glass_work'],
      metal_types: ['Aluminum', 'Steel', 'Stainless steel', 'MS'],
      joinery_types: ['Windows', 'Doors', 'Partitions', 'Railings'],
      finishes: ['Powder coating', 'Anodizing', 'Galvanizing']
    }
  },
  {
    code: 'carpentry_woodwork',
    industry: 'construction_infrastructure',
    processName: 'Carpentry & Woodwork',
    description: 'Custom furniture and wooden structure manufacturing',
    defaultMoq: 5,
    defaultLeadTimeDays: 18,
    parametersSchema: {
      required: ['wood_type', 'product_type', 'finish'],
      optional: ['hardware', 'assembly', 'installation'],
      wood_types: ['Plywood', 'MDF', 'Solid wood', 'Particle board'],
      products: ['Furniture', 'Cabinets', 'Doors', 'Paneling'],
      finishes: ['Laminate', 'Veneer', 'Paint', 'Polish']
    }
  },
  {
    code: 'stone_tile',
    industry: 'construction_infrastructure',
    processName: 'Stone & Tile Cutting',
    description: 'Natural stone and tile processing services',
    defaultMoq: 10,
    defaultLeadTimeDays: 10,
    parametersSchema: {
      required: ['material_type', 'processing_type', 'dimensions'],
      optional: ['surface_finish', 'edge_treatment', 'installation'],
      materials: ['Granite', 'Marble', 'Sandstone', 'Ceramic tiles'],
      processing: ['Cutting', 'Polishing', 'Honing', 'Flaming'],
      thickness: ['10mm', '15mm', '20mm', '25mm', '30mm']
    }
  },
  {
    code: 'precast_concrete',
    industry: 'construction_infrastructure',
    processName: 'Precast Concrete Components',
    description: 'Concrete elements and structure manufacturing',
    defaultMoq: 1,
    defaultLeadTimeDays: 21,
    parametersSchema: {
      required: ['component_type', 'concrete_grade', 'dimensions'],
      optional: ['reinforcement', 'surface_finish', 'installation'],
      components: ['Beams', 'Columns', 'Slabs', 'Walls', 'Custom'],
      grades: ['M20', 'M25', 'M30', 'M35', 'M40'],
      finishes: ['Smooth', 'Textured', 'Exposed aggregate']
    }
  },
  {
    code: 'facade_glass_aluminium',
    industry: 'construction_infrastructure',
    processName: 'Glass & Aluminium Facade',
    description: 'Building facade systems and glazing services',
    defaultMoq: 1,
    defaultLeadTimeDays: 30,
    parametersSchema: {
      required: ['system_type', 'glass_specification', 'area'],
      optional: ['thermal_performance', 'safety_features', 'automation'],
      systems: ['Curtain wall', 'Window wall', 'Structural glazing'],
      glass_types: ['Float glass', 'Toughened', 'Laminated', 'Insulated'],
      features: ['Thermal break', 'Sound insulation', 'Security']
    }
  }
];

async function initializeDatabase() {
  if (!db) return;
  
  try {
    // Clear existing SKU data to ensure fresh data with correct industry IDs
    console.log('Clearing existing SKU data...');
    await db.delete(skus);

    console.log('Initializing database with comprehensive SKU data...');
    
    // Insert all SKUs with correct industry IDs
    const skuInserts = COMPREHENSIVE_SKU_DATA.map(sku => ({
      code: sku.code,
      industry: sku.industry,
      processName: sku.processName,
      description: sku.description,
      defaultMoq: sku.defaultMoq,
      defaultLeadTimeDays: sku.defaultLeadTimeDays,
      parametersSchema: sku.parametersSchema,
      active: true
    }));

    await db.insert(skus).values(skuInserts);
    console.log(`Successfully inserted ${COMPREHENSIVE_SKU_DATA.length} SKUs into database`);
    
  } catch (error) {
    console.error('Failed to initialize database with SKU data:', error);
  }
}

export async function initializeAdminUsers() {
  if (!db) return;
  
  try {
    // Ensure admin company exists (or create it)
    let adminCompanyRecord = await db.select().from(companies).where(eq(companies.name, 'Logicwerk Admin')).limit(1);
    let adminCompany = adminCompanyRecord[0];
    if (!adminCompany) {
      adminCompany = {
        id: randomUUID(),
        name: 'Logicwerk Admin',
        address: null,
        contactInfo: null,
        website: null,
        businessType: null,
        yearEstablished: null,
        createdAt: new Date(),
        updatedAt: new Date()
      } as any;
      await db.insert(companies).values(adminCompany);
    }

    // Ensure admin user exists and has role 'admin'
    const existingUserByEmail = await db.select().from(users).where(eq(users.email, 'admin@logicwerk.com')).limit(1);
    if (existingUserByEmail.length > 0) {
      const u = existingUserByEmail[0];
      if (u.role !== 'admin' || u.companyId !== adminCompany.id) {
        await db.update(users).set({ role: 'admin' as any, companyId: adminCompany.id, updatedAt: new Date() }).where(eq(users.id, u.id));
        console.log('Updated existing admin@logicwerk.com to admin role and linked company');
      } else {
        console.log('admin@logicwerk.com already admin');
      }
    } else {
      console.log('Creating default admin user...');
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash('admin123', saltRounds);
      const adminUser = {
        id: randomUUID(),
        email: 'admin@logicwerk.com',
        password: hashedPassword,
        name: 'System Administrator',
        role: 'admin' as const,
        companyId: adminCompany.id,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await db.insert(users).values(adminUser);
      console.log('Default admin user created: admin@logicwerk.com / admin123');
    }
  } catch (error) {
    console.error('Failed to initialize admin users:', error);
  }
}

// Initialize storage with fallback capability
const storage: IStorage = new FallbackStorage();

if (dbConnectionFailed) {
  console.warn("Database connection failed, using in-memory storage fallback");
} else {
  console.log("Database connection established, using Supabase storage");
  // Initialize database with comprehensive SKU data
  initializeDatabase();
  // Initialize admin users for system access
  initializeAdminUsers();
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
