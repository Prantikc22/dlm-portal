import { sql } from "drizzle-orm";
import { pgTable, text, varchar, uuid, timestamp, boolean, integer, numeric, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum("user_role", ["buyer", "supplier", "admin"]);
export const rfqStatusEnum = pgEnum("rfq_status", [
  "draft", "submitted", "under_review", "invited", "offers_published", 
  "accepted", "in_production", "inspection", "shipped", "delivered", "closed", "cancelled"
]);
export const supplierVerificationEnum = pgEnum("supplier_verification", ["unverified", "bronze", "silver", "gold"]);
export const inviteStatusEnum = pgEnum("invite_status", ["invited", "responded", "declined"]);
export const quoteStatusEnum = pgEnum("quote_status", ["draft", "submitted", "accepted", "rejected"]);
export const orderStatusEnum = pgEnum("order_status", [
  "created", "deposit_paid", "production", "inspection", "shipped", "delivered", "closed", "cancelled"
]);
export const payoutStatusEnum = pgEnum("payout_status", ["pending", "paid", "failed"]);
export const inspectionStatusEnum = pgEnum("inspection_status", ["pass", "fail"]);
export const ticketStatusEnum = pgEnum("ticket_status", ["open", "in_progress", "resolved"]);
export const notificationTypeEnum = pgEnum("notification_type", [
  "rfq_submitted", "rfq_approved", "rfq_status_change", "quote_received", 
  "quote_accepted", "quote_rejected", "supplier_invitation", "supplier_verified",
  "order_created", "order_status_change", "production_update", "inspection_completed",
  "payout_processed", "payment_received", "payment_due", "payment_failed", "general"
]);

// Payment-related enums
export const paymentMethodTypeEnum = pgEnum("payment_method_type", [
  "razorpay", "bank_transfer", "upi", "wallet", "other"
]);

export const paymentTransactionStatusEnum = pgEnum("payment_transaction_status", [
  "pending", "processing", "completed", "failed", "cancelled", "refunded"
]);

export const paymentTransactionTypeEnum = pgEnum("payment_transaction_type", [
  "advance_payment", "final_payment", "full_payment", "refund", "commission"
]);

export const paymentConfigTypeEnum = pgEnum("payment_config_type", [
  "advance_percentage", "commission_rate", "platform_fee", "gateway_fee"
]);

// Core tables
export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: userRoleEnum("role").notNull().default("buyer"),
  name: text("name"),
  companyId: uuid("company_id").references(() => companies.id),
  phone: text("phone"),
  isVerified: boolean("is_verified").default(false),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Supplier EarlyPay requests
export const earlypayStatusEnum = pgEnum('earlypay_status', ['requested','approved','rejected','paid']);
export const earlypayRequests = pgTable('earlypay_requests', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  supplierId: uuid('supplier_id').references(() => users.id).notNull(),
  orderId: uuid('order_id').references(() => orders.id),
  invoiceNumber: text('invoice_number').notNull(),
  amount: numeric('amount', { precision: 14, scale: 2 }).notNull(),
  currency: text('currency').default('INR'),
  deliveredConfirmed: boolean('delivered_confirmed').default(false),
  buyerInvoiceApproved: boolean('buyer_invoice_approved').default(false),
  expectedDays: numeric('expected_days', { precision: 3, scale: 0 }).default('5' as any),
  notes: text('notes'),
  status: earlypayStatusEnum('status').default('requested').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Buyer logistics requests
export const logisticsRequests = pgTable("logistics_requests", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  buyerId: uuid("buyer_id").references(() => users.id).notNull(),
  source: text("source").notNull(),
  destination: text("destination").notNull(),
  weightKg: numeric("weight_kg", { precision: 12, scale: 2 }).notNull(),
  size: text("size").notNull(),
  insuranceRequired: boolean("insurance_required").default(false),
  notes: text("notes"),
  pickupDate: timestamp("pickup_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const companies = pgTable("companies", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  gstin: text("gstin"),
  pan: text("pan"),
  address: jsonb("address"),
  city: text("city"),
  state: text("state"),
  country: text("country").default("India"),
  documents: jsonb("documents"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const supplierProfiles = pgTable("supplier_profiles", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: uuid("company_id").references(() => companies.id).notNull(),
  capabilities: jsonb("capabilities"),
  machines: jsonb("machines"),
  moqDefault: integer("moq_default"),
  capacityCalendar: jsonb("capacity_calendar"),
  certifications: jsonb("certifications"),
  verifiedStatus: supplierVerificationEnum("verified_status").default("unverified"),
  bankDetails: jsonb("bank_details"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const skus = pgTable("skus", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(),
  industry: text("industry").notNull(),
  processName: text("process_name").notNull(),
  description: text("description"),
  defaultMoq: integer("default_moq"),
  defaultLeadTimeDays: integer("default_lead_time_days"),
  parametersSchema: jsonb("parameters_schema"),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const rfqs = pgTable("rfqs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  rfqNumber: text("rfq_number").notNull().unique(),
  buyerId: uuid("buyer_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  status: rfqStatusEnum("status").default("draft"),
  details: jsonb("details").notNull(),
  files: jsonb("files"),
  ndaRequired: boolean("nda_required").default(false),
  confidential: boolean("confidential").default(false),
  budgetRange: jsonb("budget_range"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const rfqItems = pgTable("rfq_items", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  rfqId: uuid("rfq_id").references(() => rfqs.id).notNull(),
  itemRef: text("item_ref").notNull(),
  skuCode: text("sku_code").references(() => skus.code).notNull(),
  itemDetails: jsonb("item_details").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const supplierInvites = pgTable("supplier_invites", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  rfqId: uuid("rfq_id").references(() => rfqs.id).notNull(),
  supplierId: uuid("supplier_id").references(() => users.id).notNull(),
  invitedBy: uuid("invited_by").references(() => users.id).notNull(),
  invitedAt: timestamp("invited_at").defaultNow(),
  status: inviteStatusEnum("status").default("invited"),
  responseDeadline: timestamp("response_deadline"),
});

export const quotes = pgTable("quotes", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  rfqId: uuid("rfq_id").references(() => rfqs.id).notNull(),
  supplierId: uuid("supplier_id").references(() => users.id).notNull(),
  quoteJson: jsonb("quote_json").notNull(),
  status: quoteStatusEnum("status").default("draft"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const curatedOffers = pgTable("curated_offers", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  rfqId: uuid("rfq_id").references(() => rfqs.id).notNull(),
  adminId: uuid("admin_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  details: jsonb("details").notNull(),
  totalPrice: numeric("total_price", { precision: 12, scale: 2 }),
  supplierIndicators: jsonb("supplier_indicators"),
  publishedAt: timestamp("published_at"),
  expiresAt: timestamp("expires_at"),
  // Payment integration fields
  paymentLink: text("payment_link"),
  advancePaymentAmount: numeric("advance_payment_amount", { precision: 12, scale: 2 }),
  finalPaymentAmount: numeric("final_payment_amount", { precision: 12, scale: 2 }),
  paymentDeadline: timestamp("payment_deadline"),
  paymentTerms: text("payment_terms"),
});

export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  orderNumber: text("order_number").notNull().unique(),
  rfqId: uuid("rfq_id").references(() => rfqs.id).notNull(),
  curatedOfferId: uuid("curated_offer_id").references(() => curatedOffers.id),
  buyerId: uuid("buyer_id").references(() => users.id).notNull(),
  adminId: uuid("admin_id").references(() => users.id),
  supplierId: uuid("supplier_id").references(() => users.id),
  status: orderStatusEnum("status").default("created"),
  depositPercent: integer("deposit_percent").default(30),
  depositPaid: boolean("deposit_paid").default(false),
  totalAmount: numeric("total_amount", { precision: 12, scale: 2 }),
  escrowTxRef: text("escrow_tx_ref"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const productionUpdates = pgTable("production_updates", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: uuid("order_id").references(() => orders.id).notNull(),
  stage: text("stage").notNull(),
  detail: text("detail"),
  updatedBy: uuid("updated_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const inspections = pgTable("inspections", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: uuid("order_id").references(() => orders.id).notNull(),
  inspectorId: uuid("inspector_id").references(() => users.id),
  reportRef: text("report_ref"),
  status: inspectionStatusEnum("status"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const payouts = pgTable("payouts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: uuid("order_id").references(() => orders.id).notNull(),
  supplierId: uuid("supplier_id").references(() => users.id).notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  fees: numeric("fees", { precision: 12, scale: 2 }),
  status: payoutStatusEnum("status").default("pending"),
  paidAt: timestamp("paid_at"),
});

export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: uuid("company_id").references(() => companies.id),
  docType: text("doc_type").notNull(),
  fileRef: text("file_ref").notNull(),
  metadata: jsonb("metadata"),
  uploadedBy: uuid("uploaded_by").references(() => users.id),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  entityType: text("entity_type").notNull(),
  entityId: uuid("entity_id").notNull(),
  action: text("action").notNull(),
  userId: uuid("user_id").references(() => users.id),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tickets = pgTable("tickets", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  ref: text("ref").notNull().unique(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  subject: text("subject").notNull(),
  status: ticketStatusEnum("status").default("open"),
  messages: jsonb("messages"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id).notNull(),
  type: notificationTypeEnum("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  metadata: jsonb("metadata"),
  entityId: uuid("entity_id"),
  entityType: text("entity_type"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Payment system tables
export const paymentMethods = pgTable("payment_methods", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: paymentMethodTypeEnum("type").notNull(),
  isActive: boolean("is_active").default(true),
  configuration: jsonb("configuration"), // Gateway API keys, settings, etc.
  displayName: text("display_name").notNull(),
  description: text("description"),
  processingFeePercent: numeric("processing_fee_percent", { precision: 5, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const paymentConfigurations = pgTable("payment_configurations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  configType: paymentConfigTypeEnum("config_type").notNull(),
  value: numeric("value", { precision: 12, scale: 2 }).notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const paymentTransactions = pgTable("payment_transactions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  transactionRef: text("transaction_ref").notNull().unique(),
  orderId: uuid("order_id").references(() => orders.id),
  curatedOfferId: uuid("curated_offer_id").references(() => curatedOffers.id),
  payerId: uuid("payer_id").references(() => users.id).notNull(), // Buyer who makes payment
  recipientId: uuid("recipient_id").references(() => users.id), // Supplier who receives payout
  paymentMethodId: uuid("payment_method_id").references(() => paymentMethods.id),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  fees: numeric("fees", { precision: 12, scale: 2 }).default("0"),
  netAmount: numeric("net_amount", { precision: 12, scale: 2 }).notNull(),
  currency: text("currency").default("INR"),
  status: paymentTransactionStatusEnum("status").default("pending"),
  transactionType: paymentTransactionTypeEnum("transaction_type").notNull(),
  gatewayTransactionId: text("gateway_transaction_id"),
  gatewayResponse: jsonb("gateway_response"),
  notes: text("notes"),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCompanySchema = createInsertSchema(companies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSupplierProfileSchema = createInsertSchema(supplierProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRFQSchema = createInsertSchema(rfqs).omit({
  id: true,
  rfqNumber: true,
  createdAt: true,
  updatedAt: true,
}).refine((data) => {
  // Validate that details.items exists and is an array with at least one item
  if (!data.details || typeof data.details !== 'object') {
    return false;
  }
  
  const details = data.details as any;
  if (!Array.isArray(details.items) || details.items.length === 0) {
    return false;
  }
  
  // Validate that each item has a skuCode
  return details.items.every((item: any) => item && typeof item.skuCode === 'string' && item.skuCode.trim().length > 0);
}, {
  message: "RFQ must have at least one item in details.items, and each item must have a valid skuCode",
});

export const insertQuoteSchema = createInsertSchema(quotes).omit({
  id: true,
  createdAt: true,
});

// Select types
export type User = typeof users.$inferSelect;
export type Company = typeof companies.$inferSelect;
export type SupplierProfile = typeof supplierProfiles.$inferSelect;
export type SKU = typeof skus.$inferSelect;
export type RFQ = typeof rfqs.$inferSelect;
export type RFQItem = typeof rfqItems.$inferSelect;
export type SupplierInvite = typeof supplierInvites.$inferSelect;
export type Quote = typeof quotes.$inferSelect;
export type CuratedOffer = typeof curatedOffers.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type ProductionUpdate = typeof productionUpdates.$inferSelect;
export type Inspection = typeof inspections.$inferSelect;
export type Payout = typeof payouts.$inferSelect;
export type Document = typeof documents.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type Ticket = typeof tickets.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type PaymentMethod = typeof paymentMethods.$inferSelect;
export type PaymentConfiguration = typeof paymentConfigurations.$inferSelect;
export type PaymentTransaction = typeof paymentTransactions.$inferSelect;
export type LogisticsRequest = typeof logisticsRequests.$inferSelect;
export type EarlypayRequest = typeof earlypayRequests.$inferSelect;

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  uploadedAt: true,
});

export const insertCuratedOfferSchema = createInsertSchema(curatedOffers).omit({
  id: true,
  publishedAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertPaymentMethodSchema = createInsertSchema(paymentMethods).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPaymentConfigurationSchema = createInsertSchema(paymentConfigurations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPaymentTransactionSchema = createInsertSchema(paymentTransactions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLogisticsRequestSchema = createInsertSchema(logisticsRequests).omit({
  id: true,
  pickupDate: false as any,
  createdAt: true,
});

export const insertEarlypayRequestSchema = createInsertSchema(earlypayRequests).omit({
  id: true,
  status: true,
  createdAt: true,
});

// Type definitions for offer details and related structures
export const offerDetailsSchema = z.object({
  unitPrice: z.number(),
  toolingCost: z.number().optional(),
  leadTime: z.number().optional(),
  moq: z.number().optional(),
});

export const rfqItemDetailsSchema = z.object({
  quantity: z.number(),
  skuCode: z.string(),
  specifications: z.record(z.any()).optional(),
});

export const rfqDetailsSchema = z.object({
  items: z.array(rfqItemDetailsSchema),
  budgetRange: z.object({
    min: z.number(),
    max: z.number(),
  }).optional(),
});

export type OfferDetails = z.infer<typeof offerDetailsSchema>;
export type RFQItemDetails = z.infer<typeof rfqItemDetailsSchema>;
export type RFQDetails = z.infer<typeof rfqDetailsSchema>;

// Insert types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type InsertSupplierProfile = z.infer<typeof insertSupplierProfileSchema>;
export type InsertRFQ = z.infer<typeof insertRFQSchema>;
export type InsertQuote = z.infer<typeof insertQuoteSchema>;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type InsertCuratedOffer = z.infer<typeof insertCuratedOfferSchema>;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type InsertPaymentMethod = z.infer<typeof insertPaymentMethodSchema>;
export type InsertPaymentConfiguration = z.infer<typeof insertPaymentConfigurationSchema>;
export type InsertPaymentTransaction = z.infer<typeof insertPaymentTransactionSchema>;
