import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { storage } from "./storage";
import { insertUserSchema, insertCompanySchema, insertSupplierProfileSchema, insertRFQSchema, insertQuoteSchema, insertDocumentSchema, insertCuratedOfferSchema, insertNotificationSchema, insertPaymentMethodSchema, insertPaymentConfigurationSchema, insertPaymentTransactionSchema, supplierVerificationEnum } from "@shared/schema";
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

  // Get individual RFQ details
  app.get("/api/protected/rfqs/:id", authenticateUserSmart, async (req: AuthenticatedRequest, res) => {
    try {
      const rfqId = req.params.id;
      const rfq = await storage.getRFQ(rfqId);
      
      if (!rfq) {
        return res.status(404).json({ error: "RFQ not found" });
      }

      // Check permissions
      if (req.user!.role === "buyer" && rfq.buyerId !== req.user!.id) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      if (req.user!.role === "supplier") {
        // Check if supplier is invited to this RFQ
        const invites = await storage.getSupplierInvites(req.user!.id);
        const hasInvite = invites.some(invite => invite.rfq.id === rfqId);
        if (!hasInvite) {
          return res.status(403).json({ error: "Access denied" });
        }
      }

      res.json(rfq);
    } catch (error) {
      console.error("❌ RFQ Detail Retrieval Failed:", error);
      res.status(500).json({ error: "Failed to fetch RFQ details" });
    }
  });

  // Update RFQ status (admin only)
  app.patch("/api/protected/rfqs/:id/status", requireRole(["admin"]), async (req: AuthenticatedRequest, res) => {
    try {
      const rfqId = req.params.id;
      const { status } = req.body;
      
      if (!status) {
        return res.status(400).json({ error: "Status is required" });
      }

      const validStatuses = ['draft', 'submitted', 'under_review', 'quoted', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      await storage.updateRFQStatus(rfqId, status);
      res.json({ success: true, status });
    } catch (error) {
      console.error("❌ RFQ Status Update Failed:", error);
      res.status(500).json({ error: "Failed to update RFQ status" });
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
      const rfqId = req.query.rfqId as string;
      let offers;
      if (rfqId) {
        offers = await storage.getCuratedOffersByRFQ(rfqId);
      } else {
        offers = await storage.getCuratedOffers();
      }
      res.json(offers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch offers" });
    }
  });

  app.post("/api/protected/admin/curated-offers", requireRole(["admin"]), async (req: AuthenticatedRequest, res) => {
    try {
      // Transform paymentDeadline from string to Date if present
      const requestBody = { ...req.body };
      if (requestBody.paymentDeadline && typeof requestBody.paymentDeadline === 'string') {
        requestBody.paymentDeadline = new Date(requestBody.paymentDeadline);
      }
      
      const offerData = insertCuratedOfferSchema.parse({
        ...requestBody,
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

  // Profile completion status endpoint
  app.get("/api/protected/suppliers/profile-completion", requireRole(["supplier"]), async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user!.companyId) {
        return res.status(400).json({ error: "Company required" });
      }

      // Get company information
      const company = await storage.getCompany(req.user!.companyId);
      if (!company) {
        return res.status(404).json({ error: "Company not found" });
      }

      // Get supplier profile
      const supplierProfile = await storage.getSupplierProfile(req.user!.companyId);
      
      // Get uploaded documents
      const documents = await storage.getDocumentsByCompany(req.user!.companyId);
      
      // Required document types for verification
      const requiredDocTypes = [
        'company_registration',
        'gst_certificate', 
        'bank_statement'
      ];
      
      // Check completion status for each step
      const steps = {
        companyInfo: {
          completed: !!(company.name && company.city && company.state && company.address),
          label: "Company Information",
          description: "Basic company details and address"
        },
        supplierProfile: {
          completed: !!(supplierProfile && supplierProfile.capabilities && supplierProfile.moqDefault),
          label: "Supplier Profile", 
          description: "Capabilities, MOQ, and certifications"
        },
        documentUpload: {
          completed: requiredDocTypes.every(docType => 
            documents.some(doc => doc.docType === docType)
          ),
          label: "Document Upload",
          description: "Required verification documents",
          uploadedDocs: documents.map(doc => doc.docType),
          requiredDocs: requiredDocTypes
        },
        verification: {
          completed: supplierProfile?.verifiedStatus !== 'unverified',
          label: "Verification Pending",
          description: "Admin review and approval",
          status: supplierProfile?.verifiedStatus || 'unverified'
        }
      };

      // Calculate overall completion percentage
      const completedSteps = Object.values(steps).filter(step => step.completed).length;
      const totalSteps = Object.keys(steps).length;
      const completionPercentage = Math.round((completedSteps / totalSteps) * 100);
      
      // Determine if profile is fully complete (all steps except verification)
      const profileComplete = steps.companyInfo.completed && 
                             steps.supplierProfile.completed && 
                             steps.documentUpload.completed;
      
      // Determine if supplier should see onboarding prompt
      const shouldShowPrompt = !profileComplete || steps.verification.status === 'unverified';

      res.json({
        steps,
        completionPercentage,
        profileComplete,
        shouldShowPrompt,
        verificationStatus: steps.verification.status,
        nextAction: !steps.companyInfo.completed ? 'complete_company_info' :
                   !steps.supplierProfile.completed ? 'complete_profile' :
                   !steps.documentUpload.completed ? 'upload_documents' :
                   'await_verification'
      });
    } catch (error) {
      console.error('Profile completion check error:', error);
      res.status(500).json({ error: "Failed to check profile completion status" });
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

  // Admin order management
  app.get("/api/protected/admin/orders", requireRole(["admin"]), async (req: AuthenticatedRequest, res) => {
    try {
      // For now, return empty array as orders might not have many entries
      // In a real implementation, this would fetch all orders across all buyers/suppliers
      const buyerOrders = await storage.getOrdersByBuyer(''); // This needs a different method
      const supplierOrders = await storage.getOrdersBySupplier(''); // This needs a different method
      
      // Temporary return empty for now to prevent errors
      res.json([]);
    } catch (error) {
      console.error('Fetch admin orders error:', error);
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

  // Payment Management Routes
  
  // Admin Payment Method Management
  app.get("/api/protected/admin/payment-methods", requireRole(["admin"]), async (req: AuthenticatedRequest, res) => {
    try {
      const methods = await storage.getPaymentMethods();
      res.json(methods);
    } catch (error) {
      console.error('Fetch payment methods error:', error);
      res.status(500).json({ error: "Failed to fetch payment methods" });
    }
  });

  app.get("/api/protected/payment-methods/active", authenticateUserSmart, async (req: AuthenticatedRequest, res) => {
    try {
      const methods = await storage.getActivePaymentMethods();
      res.json(methods);
    } catch (error) {
      console.error('Fetch active payment methods error:', error);
      res.status(500).json({ error: "Failed to fetch active payment methods" });
    }
  });

  app.post("/api/protected/admin/payment-methods", requireRole(["admin"]), async (req: AuthenticatedRequest, res) => {
    try {
      const methodData = insertPaymentMethodSchema.parse(req.body);
      const method = await storage.createPaymentMethod(methodData);
      res.json(method);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Invalid payment method data", details: error.errors });
      }
      console.error('Create payment method error:', error);
      res.status(500).json({ error: "Failed to create payment method" });
    }
  });

  app.put("/api/protected/admin/payment-methods/:id", requireRole(["admin"]), async (req: AuthenticatedRequest, res) => {
    try {
      const methodData = insertPaymentMethodSchema.partial().parse(req.body);
      await storage.updatePaymentMethod(req.params.id, methodData);
      res.json({ success: true });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Invalid payment method data", details: error.errors });
      }
      console.error('Update payment method error:', error);
      res.status(500).json({ error: "Failed to update payment method" });
    }
  });

  app.delete("/api/protected/admin/payment-methods/:id", requireRole(["admin"]), async (req: AuthenticatedRequest, res) => {
    try {
      await storage.deletePaymentMethod(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error('Delete payment method error:', error);
      res.status(500).json({ error: "Failed to delete payment method" });
    }
  });

  // Admin Payment Configuration Management
  app.get("/api/protected/admin/payment-configurations", requireRole(["admin"]), async (req: AuthenticatedRequest, res) => {
    try {
      const configurations = await storage.getPaymentConfigurations();
      res.json(configurations);
    } catch (error) {
      console.error('Fetch payment configurations error:', error);
      res.status(500).json({ error: "Failed to fetch payment configurations" });
    }
  });

  app.get("/api/protected/payment-configurations/:type", authenticateUserSmart, async (req: AuthenticatedRequest, res) => {
    try {
      const configuration = await storage.getPaymentConfiguration(req.params.type);
      res.json(configuration);
    } catch (error) {
      console.error('Fetch payment configuration error:', error);
      res.status(500).json({ error: "Failed to fetch payment configuration" });
    }
  });

  app.post("/api/protected/admin/payment-configurations", requireRole(["admin"]), async (req: AuthenticatedRequest, res) => {
    try {
      const configData = insertPaymentConfigurationSchema.parse(req.body);
      const configuration = await storage.createPaymentConfiguration(configData);
      res.json(configuration);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Invalid payment configuration data", details: error.errors });
      }
      console.error('Create payment configuration error:', error);
      res.status(500).json({ error: "Failed to create payment configuration" });
    }
  });

  app.put("/api/protected/admin/payment-configurations/:id", requireRole(["admin"]), async (req: AuthenticatedRequest, res) => {
    try {
      const configData = insertPaymentConfigurationSchema.partial().parse(req.body);
      await storage.updatePaymentConfiguration(req.params.id, configData);
      res.json({ success: true });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Invalid payment configuration data", details: error.errors });
      }
      console.error('Update payment configuration error:', error);
      res.status(500).json({ error: "Failed to update payment configuration" });
    }
  });

  // Payment Transaction Management
  app.post("/api/protected/payment-transactions", authenticateUserSmart, async (req: AuthenticatedRequest, res) => {
    try {
      const transactionData = insertPaymentTransactionSchema.parse({
        ...req.body,
        payerId: req.user!.id // Ensure payer is authenticated user
      });
      const transaction = await storage.createPaymentTransaction(transactionData);
      res.json(transaction);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Invalid payment transaction data", details: error.errors });
      }
      console.error('Create payment transaction error:', error);
      res.status(500).json({ error: "Failed to create payment transaction" });
    }
  });

  app.get("/api/protected/payment-transactions/:id", authenticateUserSmart, async (req: AuthenticatedRequest, res) => {
    try {
      const transaction = await storage.getPaymentTransaction(req.params.id);
      if (!transaction) {
        return res.status(404).json({ error: "Payment transaction not found" });
      }
      
      // Check if user has access to this transaction
      if (req.user!.role !== "admin" && transaction.payerId !== req.user!.id && transaction.recipientId !== req.user!.id) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      res.json(transaction);
    } catch (error) {
      console.error('Fetch payment transaction error:', error);
      res.status(500).json({ error: "Failed to fetch payment transaction" });
    }
  });

  app.get("/api/protected/payment-transactions/ref/:transactionRef", authenticateUserSmart, async (req: AuthenticatedRequest, res) => {
    try {
      const transaction = await storage.getPaymentTransactionByRef(req.params.transactionRef);
      if (!transaction) {
        return res.status(404).json({ error: "Payment transaction not found" });
      }
      
      // Check if user has access to this transaction
      if (req.user!.role !== "admin" && transaction.payerId !== req.user!.id && transaction.recipientId !== req.user!.id) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      res.json(transaction);
    } catch (error) {
      console.error('Fetch payment transaction by ref error:', error);
      res.status(500).json({ error: "Failed to fetch payment transaction" });
    }
  });

  app.put("/api/protected/payment-transactions/:id/status", authenticateUserSmart, async (req: AuthenticatedRequest, res) => {
    try {
      const { status, gatewayResponse } = req.body;
      
      // Only admin can update transaction status
      if (req.user!.role !== "admin") {
        return res.status(403).json({ error: "Access denied" });
      }
      
      await storage.updatePaymentTransactionStatus(req.params.id, status, gatewayResponse);
      res.json({ success: true });
    } catch (error) {
      console.error('Update payment transaction status error:', error);
      res.status(500).json({ error: "Failed to update payment transaction status" });
    }
  });

  // Buyer Payment Tracking
  app.get("/api/protected/buyer/payment-transactions", requireRole(["buyer"]), async (req: AuthenticatedRequest, res) => {
    try {
      const transactions = await storage.getPaymentTransactionsByPayer(req.user!.id);
      res.json(transactions);
    } catch (error) {
      console.error('Fetch buyer payment transactions error:', error);
      res.status(500).json({ error: "Failed to fetch payment transactions" });
    }
  });

  app.get("/api/protected/payment-transactions/order/:orderId", authenticateUserSmart, async (req: AuthenticatedRequest, res) => {
    try {
      const transactions = await storage.getPaymentTransactionsByOrder(req.params.orderId);
      
      // Check if user has access to this order's transactions
      if (req.user!.role !== "admin") {
        // For buyers and suppliers, verify they have access to the order
        // This would typically require checking order ownership
        // For now, we'll allow if they're involved in any transaction
        const hasAccess = transactions.some(tx => 
          tx.payerId === req.user!.id || tx.recipientId === req.user!.id
        );
        if (!hasAccess) {
          return res.status(403).json({ error: "Access denied" });
        }
      }
      
      res.json(transactions);
    } catch (error) {
      console.error('Fetch order payment transactions error:', error);
      res.status(500).json({ error: "Failed to fetch order payment transactions" });
    }
  });

  app.get("/api/protected/payment-transactions/offer/:curatedOfferId", authenticateUserSmart, async (req: AuthenticatedRequest, res) => {
    try {
      const transactions = await storage.getPaymentTransactionsByOffer(req.params.curatedOfferId);
      
      // Check if user has access to this offer's transactions
      if (req.user!.role !== "admin") {
        const hasAccess = transactions.some(tx => 
          tx.payerId === req.user!.id || tx.recipientId === req.user!.id
        );
        if (!hasAccess) {
          return res.status(403).json({ error: "Access denied" });
        }
      }
      
      res.json(transactions);
    } catch (error) {
      console.error('Fetch offer payment transactions error:', error);
      res.status(500).json({ error: "Failed to fetch offer payment transactions" });
    }
  });

  // Curated Offers with Payment Integration
  app.get("/api/protected/curated-offers/:id", authenticateUserSmart, async (req: AuthenticatedRequest, res) => {
    try {
      const offer = await storage.getCuratedOffer(req.params.id);
      if (!offer) {
        return res.status(404).json({ error: "Curated offer not found" });
      }
      res.json(offer);
    } catch (error) {
      console.error('Fetch curated offer error:', error);
      res.status(500).json({ error: "Failed to fetch curated offer" });
    }
  });

  app.put("/api/protected/admin/curated-offers/:id/payment", requireRole(["admin"]), async (req: AuthenticatedRequest, res) => {
    try {
      const paymentData = z.object({
        paymentLink: z.string().optional(),
        advancePaymentAmount: z.number().optional(),
        finalPaymentAmount: z.number().optional(),
        paymentDeadline: z.string().transform(str => new Date(str)).optional(),
        paymentTerms: z.string().optional(),
      }).parse(req.body);
      
      await storage.updateCuratedOfferPayment(req.params.id, paymentData);
      res.json({ success: true });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Invalid payment data", details: error.errors });
      }
      console.error('Update curated offer payment error:', error);
      res.status(500).json({ error: "Failed to update curated offer payment" });
    }
  });

  // Payment Gateway Webhook (prepared for Razorpay integration)
  app.post("/api/webhooks/payment", async (req, res) => {
    try {
      // This endpoint is prepared for Razorpay webhook integration
      // Implementation would include:
      // 1. Verify webhook signature
      // 2. Extract payment data from webhook payload
      // 3. Update payment transaction status
      // 4. Trigger any post-payment actions
      
      console.log('Payment webhook received:', req.body);
      
      // For now, return success - actual implementation would be added when Razorpay is integrated
      res.json({ status: "received" });
    } catch (error) {
      console.error('Payment webhook error:', error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
