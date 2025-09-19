import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import { insertUserSchema, insertCompanySchema, insertSupplierProfileSchema, insertRFQSchema, insertQuoteSchema, insertDocumentSchema } from "@shared/schema";
import { z } from "zod";
import { ZodError } from "zod";

// Simple session middleware for demo - in production use proper auth
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    companyId?: string;
  };
}

// Middleware to simulate authentication
const authenticateUser = async (req: any, res: any, next: any) => {
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
      res.json({ user: { id: user.id, email: user.email, role: user.role, companyId: user.companyId } });
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
      
      res.json({ user: { id: user.id, email: user.email, role: user.role, companyId: user.companyId } });
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

  // Protected routes
  app.use("/api/protected", authenticateUser);

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

  app.get("/api/protected/rfqs", authenticateUser, async (req: AuthenticatedRequest, res) => {
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
      } else {
        // Admin can see all RFQs - would need a different method
        rfqs = [];
        console.log("📋 Admin role - returning empty RFQs list");
      }
      res.json(rfqs);
    } catch (error) {
      console.error("❌ RFQ Retrieval Failed:", error);
      res.status(500).json({ error: "Failed to fetch RFQs" });
    }
  });

  app.get("/api/protected/rfqs/:id", authenticateUser, async (req: AuthenticatedRequest, res) => {
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

  // Document upload routes
  app.post("/api/protected/documents/upload", authenticateUser, async (req: AuthenticatedRequest, res) => {
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

  app.get("/api/protected/documents", authenticateUser, async (req: AuthenticatedRequest, res) => {
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

  app.delete("/api/protected/documents/:id", authenticateUser, async (req: AuthenticatedRequest, res) => {
    try {
      // In a real implementation, you would also delete the actual file from storage
      await storage.deleteDocument(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete document" });
    }
  });

  // Order routes
  app.get("/api/protected/orders", authenticateUser, async (req: AuthenticatedRequest, res) => {
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

  const httpServer = createServer(app);
  return httpServer;
}
