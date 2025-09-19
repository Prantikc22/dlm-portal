import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { storage } from "./storage";
import { insertUserSchema, insertCompanySchema, insertSupplierProfileSchema, insertRFQSchema, insertQuoteSchema, insertDocumentSchema, insertCuratedOfferSchema, insertNotificationSchema, supplierVerificationEnum } from "@shared/schema";
import { z } from "zod";
import { ZodError } from "zod";

// Validation schemas for admin endpoints
const supplierStatusUpdateSchema = z.object({
  supplierId: z.string().uuid("Invalid supplier ID format"),
  status: z.enum(["unverified", "bronze", "silver", "gold"], {
    errorMap: () => ({ message: "Status must be one of: unverified, bronze, silver, gold" })
  })
});

// Secure authentication interface
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    companyId?: string;
  };
}

// JWT Authentication Middleware - Replaces insecure header-based auth
const authenticateUser = async (req: any, res: any, next: any) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "Authentication required - Bearer token missing" });
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET || process.env.SESSION_SECRET;
    
    if (!jwtSecret) {
      console.error('❌ JWT_SECRET or SUPABASE_JWT_SECRET not configured');
      return res.status(500).json({ error: "Authentication configuration error" });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, jwtSecret);
    } catch (jwtError: any) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ error: "Token expired" });
      } else if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: "Invalid token" });
      }
      return res.status(401).json({ error: "Token verification failed" });
    }

    // Extract user info from JWT payload (Supabase format)
    const userId = decoded.sub || decoded.user_id;
    const userEmail = decoded.email;
    const userRole = decoded.user_metadata?.role || decoded.role;
    
    if (!userId || !userEmail) {
      return res.status(401).json({ error: "Invalid token payload" });
    }

    // Verify user exists in database and get current data
    const user = await storage.getUserByEmail(userEmail);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    // Use database role as authoritative source
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId
    };
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ error: "Authentication failed" });
  }
};

// Fallback authentication for development (with warning)
const authenticateUserLegacy = async (req: any, res: any, next: any) => {
  console.warn('⚠️  SECURITY WARNING: Using insecure header-based authentication. Deploy with proper JWT_SECRET!');
  
  const userEmail = req.headers['x-user-email'] as string;
  if (!userEmail) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const user = await storage.getUserByEmail(userEmail);
  if (!user) {
    return res.status(401).json({ error: "User not found" });
  }

  req.user = user;
  next();
};

// Smart authentication middleware that uses JWT when available, falls back to legacy
const authenticateUserSmart = async (req: any, res: any, next: any) => {
  const jwtSecret = process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET || process.env.SESSION_SECRET;
  
  if (jwtSecret) {
    return authenticateUser(req, res, next);
  } else {
    return authenticateUserLegacy(req, res, next);
  }
};

const requireRole = (roles: string[]) => (req: any, res: any, next: any) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ error: "Insufficient permissions" });
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, name, role, companyName } = req.body;
      
      if (!email || !password || !name || !role || !companyName) {
        return res.status(400).json({ error: "All fields are required" });
      }
      
      // Validate role - only allow buyer and supplier registration
      if (role !== "buyer" && role !== "supplier") {
        return res.status(400).json({ error: "Invalid role. Only buyer and supplier registration allowed." });
      }
      
      // Check if email already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ error: "Email already registered" });
      }
      
      // Hash the password before storing
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      
      // Create company first
      const company = await storage.createCompany({ name: companyName });
      
      // Create user with company reference - enforce validated role
      const userToCreate = {
        email,
        password: hashedPassword,
        name,
        role: role as "buyer" | "supplier", // Type-safe role assignment
        companyId: company.id
      };
      
      const user = await storage.createUser(userToCreate);
      
      // Generate JWT token for registration
      const jwtSecret = process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET || process.env.SESSION_SECRET;
      let token = null;
      
      if (jwtSecret) {
        token = jwt.sign(
          {
            sub: user.id,
            user_id: user.id,
            email: user.email,
            role: user.role,
            user_metadata: { role: user.role },
            exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
          },
          jwtSecret
        );
      }
      
      const response: { 
        user: { id: string; email: string; role: string; companyId: string | null; };
        token?: string;
      } = { 
        user: { id: user.id, email: user.email, role: user.role, companyId: user.companyId }
      };
      
      if (token) {
        response.token = token;
      }
      
      res.json(response);
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: "Registration failed. Please try again." });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }
      
      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: "Invalid email or password" });
      }
      
      // Generate JWT token
      const jwtSecret = process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET || process.env.SESSION_SECRET;
      let token = null;
      
      if (jwtSecret) {
        token = jwt.sign(
          {
            sub: user.id,
            user_id: user.id,
            email: user.email,
            role: user.role,
            user_metadata: { role: user.role },
            exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
          },
          jwtSecret
        );
      }
      
      const response: { 
        user: { id: string; email: string; role: string; companyId: string | null; };
        token?: string;
      } = { 
        user: { id: user.id, email: user.email, role: user.role, companyId: user.companyId }
      };
      
      if (token) {
        response.token = token;
      }
      
      res.json(response);
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // SKU routes (public)
  app.get("/api/skus", async (req, res) => {
    try {
      const skus = await storage.getAllSKUs();
      res.json(skus);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch SKUs" });
    }
  });

  app.get("/api/skus/:code", async (req, res) => {
    try {
      const sku = await storage.getSKUByCode(req.params.code);
      if (!sku) {
        return res.status(404).json({ error: "SKU not found" });
      }
      res.json(sku);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch SKU" });
    }
  });

  app.get("/api/skus/industry/:industry", async (req, res) => {
    try {
      const skus = await storage.getSKUsByIndustry(req.params.industry);
      res.json(skus);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch SKUs" });
    }
  });

  // Protected routes with secure authentication
  app.use("/api/protected", authenticateUserSmart);

  // Company routes
  app.post("/api/protected/companies", async (req: AuthenticatedRequest, res) => {
    try {
      const companyData = insertCompanySchema.parse(req.body);
      const company = await storage.createCompany(companyData);
      
      // Update user's company association
      await storage.updateUserCompany(req.user!.id, company.id);
      
      res.json(company);
    } catch (error) {
      res.status(400).json({ error: "Invalid company data" });
    }
  });

  // Supplier routes
  app.post("/api/protected/suppliers/profile", requireRole(["supplier"]), async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user!.companyId) {
        return res.status(400).json({ error: "Company required" });
      }

      const profileData = insertSupplierProfileSchema.parse({
        ...req.body,
        companyId: req.user!.companyId
      });
      
      const profile = await storage.createSupplierProfile(profileData);
      res.json(profile);
    } catch (error) {
      res.status(400).json({ error: "Invalid profile data" });
    }
  });

  app.get("/api/protected/suppliers/invites", requireRole(["supplier"]), async (req: AuthenticatedRequest, res) => {
    try {
      const invites = await storage.getSupplierInvites(req.user!.id);
      res.json(invites);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch invites" });
    }
  });

  // RFQ routes
  app.post("/api/protected/rfqs", requireRole(["buyer"]), async (req: AuthenticatedRequest, res) => {
    console.log("🔵 RFQ Creation Request:", { 
      userId: req.user?.id, 
      userEmail: req.user?.email,
      bodyKeys: Object.keys(req.body),
      title: req.body?.title 
    });
    try {
      // Security: Remove any client-provided buyerId to prevent spoofing attacks
      const { buyerId: _ignored, ...requestBody } = req.body;
      
      // Enforce server-side buyerId assignment from authenticated user
      const rfqData = insertRFQSchema.parse({
        ...requestBody,
        buyerId: req.user!.id  // Always use authenticated user's ID
      });
      
      const rfq = await storage.createRFQ(rfqData);
      console.log("✅ RFQ Created Successfully:", { id: rfq.id, rfqNumber: rfq.rfqNumber, title: rfq.title });
      res.json(rfq);
    } catch (error) {
      console.error("❌ RFQ Creation Failed:", error);
      
      if (error instanceof ZodError) {
        // Extract meaningful validation error messages
        const validationErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        
        return res.status(400).json({ 
          error: "Validation failed", 
          details: validationErrors 
        });
      }
      
      res.status(400).json({ error: "Invalid RFQ data" });
    }
  });

  app.get("/api/protected/rfqs", authenticateUserSmart, async (req: AuthenticatedRequest, res) => {
    console.log("🔍 RFQ Retrieval Request:", { 
      userId: req.user?.id, 
      userEmail: req.user?.email, 
      userRole: req.user?.role 
    });
    try {
      let rfqs: any[] = [];
      if (req.user!.role === "buyer") {
        rfqs = await storage.getRFQsByBuyer(req.user!.id);
        console.log(`📋 Found ${rfqs.length} RFQs for buyer ${req.user!.id}`);
      } else if (req.user!.role === "supplier") {
        const invites = await storage.getSupplierInvites(req.user!.id);
        rfqs = invites.map(invite => invite.rfq);
        console.log(`📋 Found ${rfqs.length} invited RFQs for supplier ${req.user!.id}`);
      } else if (req.user!.role === "admin") {
        rfqs = await storage.getAllRFQs();
        console.log(`📋 Found ${rfqs.length} RFQs for admin ${req.user!.id}`);
      } else {
        rfqs = [];
        console.log("📋 Unknown role - returning empty RFQs list");
      }
      res.json(rfqs);
    } catch (error) {
      console.error("❌ RFQ Retrieval Failed:", error);
      res.status(500).json({ error: "Failed to fetch RFQs" });
    }
  });

  app.get("/api/protected/rfqs/:id", authenticateUserSmart, async (req: AuthenticatedRequest, res) => {
    try {
      const rfq = await storage.getRFQ(req.params.id);
      if (!rfq) {
        return res.status(404).json({ error: "RFQ not found" });
      }

      // Check permissions
      if (req.user!.role === "buyer" && rfq.buyerId !== req.user!.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      res.json(rfq);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch RFQ" });
    }
  });

  // Quote routes
  app.post("/api/protected/quotes", requireRole(["supplier"]), async (req: AuthenticatedRequest, res) => {
    try {
      const quoteData = insertQuoteSchema.parse({
        ...req.body,
        supplierId: req.user!.id
      });
      
      const quote = await storage.createQuote(quoteData);
      res.json(quote);
    } catch (error) {
      res.status(400).json({ error: "Invalid quote data" });
    }
  });

  app.get("/api/protected/quotes", requireRole(["supplier"]), async (req: AuthenticatedRequest, res) => {
    try {
      const quotes = await storage.getQuotesBySupplier(req.user!.id);
      res.json(quotes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch quotes" });
    }
  });

  // Admin routes
  app.post("/api/protected/admin/invite", requireRole(["admin"]), async (req: AuthenticatedRequest, res) => {
    try {
      const { rfqId, supplierIds } = req.body;
      
      for (const supplierId of supplierIds) {
        await storage.createSupplierInvite(rfqId, supplierId, req.user!.id);
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to send invites" });
    }
  });

  app.get("/api/protected/admin/suppliers", requireRole(["admin"]), async (req, res) => {
    try {
      const suppliers = await storage.getSuppliersByCapabilities([]);
      res.json(suppliers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch suppliers" });
    }
  });

  // Admin RFQ management
  app.get("/api/protected/admin/rfqs", requireRole(["admin"]), async (req, res) => {
    try {
      const rfqs = await storage.getAllRFQs();
      res.json(rfqs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch RFQs" });
    }
  });

  // Admin supplier status update with proper validation
  app.post("/api/protected/admin/supplier-status", requireRole(["admin"]), async (req: AuthenticatedRequest, res) => {
    try {
      // Validate request body with Zod schema
      const validationResult = supplierStatusUpdateSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: validationResult.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }

      const { supplierId, status } = validationResult.data;

      // Find the supplier's company ID first
      const supplier = await storage.getUser(supplierId);
      if (!supplier || supplier.role !== 'supplier') {
        return res.status(404).json({ error: "Supplier not found" });
      }
      
      if (!supplier.companyId) {
        return res.status(404).json({ error: "Supplier has no company associated" });
      }

      // Verify supplier profile exists before updating
      const supplierProfile = await storage.getSupplierProfile(supplier.companyId);
      if (!supplierProfile) {
        return res.status(404).json({ error: "Supplier profile not found" });
      }

      // Perform the update
      const updateResult = await storage.updateSupplierVerificationStatus(supplier.companyId, status);
      
      // Return success with updated information
      res.json({ 
        success: true,
        supplierId: supplierId,
        companyId: supplier.companyId,
        previousStatus: supplierProfile.verifiedStatus,
        newStatus: status,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Supplier status update error:', error);
      res.status(500).json({ error: "Failed to update supplier status" });
    }
  });

  // Admin quotes access
  app.get("/api/protected/admin/quotes", requireRole(["admin"]), async (req, res) => {
    try {
      const quotes = await storage.getAllQuotes();
      res.json(quotes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch quotes" });
    }
  });

  // Admin curated offers
  app.get("/api/protected/admin/offers", requireRole(["admin"]), async (req, res) => {
    try {
      const offers = await storage.getCuratedOffers();
      res.json(offers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch offers" });
    }
  });

  app.post("/api/protected/admin/curated-offers", requireRole(["admin"]), async (req: AuthenticatedRequest, res) => {
    try {
      const offerData = insertCuratedOfferSchema.parse({
        ...req.body,
        adminId: req.user!.id
      });
      
      const offer = await storage.createCuratedOffer(offerData);
      res.json(offer);
    } catch (error) {
      console.error('Create curated offer error:', error);
      if (error instanceof ZodError) {
        const validationErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        
        return res.status(400).json({ 
          error: "Validation failed", 
          details: validationErrors 
        });
      }
      res.status(400).json({ error: "Invalid offer data" });
    }
  });

  app.post("/api/protected/admin/offers/:id/publish", requireRole(["admin"]), async (req: AuthenticatedRequest, res) => {
    try {
      const offerId = req.params.id;
      await storage.publishCuratedOffer(offerId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to publish offer" });
    }
  });

  // Admin metrics for dashboard
  app.get("/api/protected/admin/metrics", requireRole(["admin"]), async (req, res) => {
    try {
      const metrics = await storage.getAdminMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch metrics" });
    }
  });

  // Document upload routes
  app.post("/api/protected/documents/upload", authenticateUserSmart, async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user!.companyId) {
        return res.status(400).json({ error: "Company required for document upload" });
      }

      const { docType, fileName, fileData, metadata } = req.body;
      
      if (!docType || !fileName || !fileData) {
        return res.status(400).json({ error: "Document type, file name, and file data are required" });
      }

      // Validate docType allowlist
      const allowedDocTypes = [
        'company_registration',
        'gst_certificate', 
        'bank_statement',
        'iso_certificate',
        'product_samples',
        'machine_photos'
      ];
      
      if (!allowedDocTypes.includes(docType)) {
        return res.status(400).json({ 
          error: "Invalid document type",
          details: `Allowed types: ${allowedDocTypes.join(', ')}`
        });
      }

      // Validate file content type from metadata
      if (!metadata || !metadata.fileType) {
        return res.status(400).json({ error: "File type metadata required" });
      }

      const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png'];
      if (!allowedMimeTypes.includes(metadata.fileType)) {
        return res.status(400).json({ 
          error: "Invalid file type",
          details: "Only PDF, JPEG, and PNG files are allowed"
        });
      }

      // Compute real byte size from base64 data
      // Base64 adds ~33% overhead, but we need to account for data URL prefix
      const base64Data = fileData.split(',')[1] || fileData; // Remove data URL prefix if present
      const realByteSize = Math.ceil((base64Data.length * 3) / 4);

      // Validate file size limits based on type
      const isImage = metadata.fileType.startsWith('image/');
      const maxSize = isImage ? 10 * 1024 * 1024 : 5 * 1024 * 1024; // 10MB for images, 5MB for documents
      
      if (realByteSize > maxSize) {
        const maxSizeMB = maxSize / (1024 * 1024);
        return res.status(413).json({ 
          error: "File too large",
          details: `Maximum file size is ${maxSizeMB}MB for ${isImage ? 'images' : 'documents'}`
        });
      }

      // Validate against client-reported file size for consistency
      if (metadata.fileSize && Math.abs(metadata.fileSize - realByteSize) > 1024) {
        return res.status(400).json({ 
          error: "File size mismatch",
          details: "Client-reported size doesn't match actual file size"
        });
      }

      // Create synthetic file reference (explicit that this is not real storage)
      const fileRef = `synthetic://uploads/${req.user!.companyId}/${docType}/${Date.now()}-${fileName}`;

      const documentData = insertDocumentSchema.parse({
        companyId: req.user!.companyId,
        docType,
        fileRef,
        metadata: {
          ...metadata,
          fileName,
          fileSize: realByteSize, // Store actual byte size, not base64 length
          fileSizeBytes: realByteSize,
          uploadedAt: new Date().toISOString(),
          storageType: 'synthetic', // Explicit marker for synthetic storage
          validatedMimeType: metadata.fileType,
          // Future: add fields for real storage like s3Key, cloudinaryId, etc.
        },
        uploadedBy: req.user!.id,
      });

      const document = await storage.createDocument(documentData);
      
      // TODO: In production, implement real file storage here:
      // - Upload to Supabase Storage, AWS S3, or similar service
      // - Store the real file URL/key in fileRef
      // - Implement virus scanning if required
      // - Generate thumbnails for images if needed
      
      res.json({
        ...document,
        message: "Document uploaded successfully (synthetic storage)"
      });
    } catch (error) {
      console.error('Document upload error:', error);
      
      if (error instanceof ZodError) {
        const validationErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        
        return res.status(400).json({ 
          error: "Validation failed", 
          details: validationErrors 
        });
      }
      
      res.status(500).json({ error: "Failed to upload document" });
    }
  });

  app.get("/api/protected/documents", authenticateUserSmart, async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user!.companyId) {
        return res.status(400).json({ error: "Company required" });
      }

      const documents = await storage.getDocumentsByCompany(req.user!.companyId);
      res.json(documents);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch documents" });
    }
  });

  app.delete("/api/protected/documents/:id", authenticateUserSmart, async (req: AuthenticatedRequest, res) => {
    try {
      // In a real implementation, you would also delete the actual file from storage
      await storage.deleteDocument(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete document" });
    }
  });

  // Order routes
  app.get("/api/protected/orders", authenticateUserSmart, async (req: AuthenticatedRequest, res) => {
    try {
      let orders: any[] = [];
      if (req.user!.role === "buyer") {
        orders = await storage.getOrdersByBuyer(req.user!.id);
      } else if (req.user!.role === "supplier") {
        orders = await storage.getOrdersBySupplier(req.user!.id);
      } else {
        orders = []; // Admin would need different method
      }
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  // Notification routes
  app.get("/api/protected/notifications", authenticateUserSmart, async (req: AuthenticatedRequest, res) => {
    try {
      const notifications = await storage.getNotificationsByUser(req.user!.id);
      res.json(notifications);
    } catch (error) {
      console.error('Fetch notifications error:', error);
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  app.get("/api/protected/notifications/count", authenticateUserSmart, async (req: AuthenticatedRequest, res) => {
    try {
      const count = await storage.getUnreadNotificationCount(req.user!.id);
      res.json({ unreadCount: count });
    } catch (error) {
      console.error('Fetch notification count error:', error);
      res.status(500).json({ error: "Failed to fetch notification count" });
    }
  });

  app.put("/api/protected/notifications/:id/read", authenticateUserSmart, async (req: AuthenticatedRequest, res) => {
    try {
      await storage.markNotificationAsRead(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error('Mark notification as read error:', error);
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  app.put("/api/protected/notifications/read-all", authenticateUserSmart, async (req: AuthenticatedRequest, res) => {
    try {
      await storage.markAllNotificationsAsRead(req.user!.id);
      res.json({ success: true });
    } catch (error) {
      console.error('Mark all notifications as read error:', error);
      res.status(500).json({ error: "Failed to mark all notifications as read" });
    }
  });

  app.post("/api/protected/notifications", requireRole(["admin"]), async (req: AuthenticatedRequest, res) => {
    try {
      const notificationData = insertNotificationSchema.parse(req.body);
      const notification = await storage.createNotification(notificationData);
      res.json(notification);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Invalid notification data", details: error.errors });
      }
      console.error('Create notification error:', error);
      res.status(500).json({ error: "Failed to create notification" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
