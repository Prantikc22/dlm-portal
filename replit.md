# Overview

Logicwerk is a multi-sector B2B jobwork marketplace designed as a buyer-first platform where businesses can submit RFQs (Request for Quotations) through an industry-specific configurator. The system follows a strict middleman model where Logicwerk admin manages all supplier interactions, ensuring supplier identities remain hidden from buyers. The platform supports multiple industries including mechanical manufacturing, electronics, packaging, textiles, and construction, with a comprehensive RFQ-to-order workflow including quotes, curated offers, and payment processing.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The application uses a React-based frontend built with Vite and TypeScript, implementing a multi-portal architecture with role-based access control. The UI leverages shadcn/ui components built on Radix UI primitives with Tailwind CSS for styling. The architecture supports three distinct user interfaces: Buyer Portal, Supplier Portal, and Admin Portal, each with role-specific navigation and functionality.

## Backend Architecture
The backend utilizes a hybrid approach combining Express.js for API routing with PostgreSQL database management through Drizzle ORM. The system implements a comprehensive database schema with role-based row-level security (RLS) policies. The architecture supports the core business logic of RFQ management, supplier invitations, quote collection, and order processing while maintaining strict data isolation between different user roles.

## Authentication and Authorization
The system implements a role-based authentication system with three primary roles: buyer, supplier, and admin. Authentication is currently implemented with a simplified session-based approach suitable for development, with provisions for production-ready authentication integration. Role separation is enforced both at the API level and through database RLS policies.

## Data Storage Solutions
PostgreSQL serves as the primary database, accessed through Drizzle ORM for type-safe database operations. The schema includes comprehensive tables for users, companies, supplier profiles, SKUs (Stock Keeping Units), RFQs, quotes, curated offers, orders, and supporting entities. The database design enforces business rules through foreign key constraints and enum types for status management.

## Core Business Logic
The platform implements a sophisticated RFQ workflow starting with industry selection, process selection, and detailed configurator forms. Suppliers are invited by admins to respond to specific RFQs, with all communications flowing through the Logicwerk platform. The system supports quote aggregation, offer curation by admins, and order management with payment integration capabilities.

## SKU and Industry Management
The application includes a comprehensive SKU system that maps industries to specific manufacturing processes. This enables the configurator to present relevant options based on the selected industry and process, ensuring buyers can accurately specify their requirements while suppliers receive well-structured RFQ information.

# External Dependencies

- **Neon Database**: PostgreSQL hosting service integrated through @neondatabase/serverless for database connectivity
- **Drizzle ORM**: Type-safe database toolkit for PostgreSQL operations and schema management
- **Radix UI**: Headless component library providing accessible UI primitives for forms, dialogs, and interactive elements
- **React Query**: Data fetching and state management library for efficient API communication and caching
- **Tailwind CSS**: Utility-first CSS framework for responsive design and component styling
- **Zod**: TypeScript-first schema validation library for form validation and API data validation
- **React Hook Form**: Performant form library with built-in validation support
- **Font Awesome**: Icon library for consistent iconography across the application
- **shadcn/ui**: Component library built on Radix UI providing pre-styled, accessible components
- **Wouter**: Lightweight routing library for client-side navigation
- **date-fns**: Date manipulation library for formatting and date calculations