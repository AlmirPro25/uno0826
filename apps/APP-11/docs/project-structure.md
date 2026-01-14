
# Project Genesis: AI Web Weaver - Structure Overview

This document outlines the meticulously designed directory structure for the "AI Web Weaver" fullstack application. This monorepo approach ensures cohesion, facilitates collaboration, and enforces clear separation of concerns, crucial for a system aiming for "millions of dollars."

## Root Directory

```
.
├── backend/                  # Sovereign Kernel: Go Backend services
├── frontend/                 # New Era Interface: Next.js 15 Frontend application
├── docs/                     # Architectural documentation, API specs, deployment guides
├── prisma/                   # Database schema definitions (canonical source of truth)
├── .github/                  # GitHub Actions for CI/CD, issue templates
├── .vscode/                  # VS Code specific settings, recommended extensions
├── .gitignore                # Files/directories ignored by Git
├── Dockerfile                # Docker configuration for containerization
├── docker-compose.yml        # Orchestration for local development (database, redis, backend)
├── README.md                 # Project root README (high-level overview)
└── package.json              # Root-level scripts (e.g., for monorepo tooling if adopted, otherwise backend/frontend manage their own)
```

## `backend/` - Go Sovereign Kernel Structure

This directory houses the Go backend, built with Clean Architecture and SOLID principles.

```
backend/
├── cmd/                      # Main applications for the backend
│   └── api/                  # The RESTful API server entry point
│       └── main.go           # Application entry file
├── internal/                 # Private application logic (not exposed as a library)
│   ├── auth/                 # Authentication service (registration, login, JWT, refresh tokens)
│   │   ├── handler.go        # HTTP handlers for auth endpoints
│   │   ├── service.go        # Business logic for authentication
│   │   └── repository.go     # Database interactions for users/sessions
│   ├── beta/                 # Beta subscription service
│   │   ├── handler.go        # HTTP handlers for beta sign-up
│   │   ├── service.go        # Business logic for beta subscriptions
│   │   └── repository.go     # Database interactions for beta subscribers
│   ├── user/                 # User profile management service
│   │   ├── handler.go
│   │   ├── service.go
│   │   └── repository.go
│   ├── project/              # AI-generated project management service (core AI integration)
│   │   ├── handler.go
│   │   ├── service.go        # Orchestrates AI generation, stores project metadata
│   │   └── repository.go
│   ├── plan/                 # Subscription plans management (placeholder)
│   │   ├── handler.go
│   │   ├── service.go
│   │   └── repository.go
│   ├── billing/              # Payment and subscription management (placeholder for Stripe integration)
│   │   ├── handler.go
│   │   ├── service.go
│   │   └── repository.go
│   ├── config/               # Application configuration loading and management
│   │   └── config.go
│   ├── database/             # Database connection, migrations, and utility
│   │   └── postgres.go       # PostgreSQL specific connection
│   ├── model/                # Core domain models (structs)
│   │   ├── user.go
│   │   ├── session.go
│   │   ├── beta.go
│   │   ├── project.go
│   │   ├── plan.go
│   │   └── subscription.go
│   ├── middleware/           # HTTP middleware (auth, logging, CORS, security)
│   │   ├── auth.go
│   │   ├── logger.go
│   │   └── security.go
│   ├── util/                 # General utilities (e.g., encryption, password hashing, uuid generation)
│   │   ├── encryption.go
│   │   └── password.go
│   ├── cache/                # Caching layer integration (Redis)
│   │   └── redis.go
│   └── validator/            # Custom validation logic
│       └── validator.go
├── pkg/                      # Public packages (reusable across multiple projects, if this were a multi-service monorepo)
│   ├── errors/               # Custom error types and handling
│   │   └── errors.go
│   ├── logger/               # Structured logging interface (e.g., Zap wrapper)
│   │   └── logger.go
│   └── httpclient/           # Reusable HTTP client for external API calls
│       └── client.go
├── go.mod                    # Go module definition
├── go.sum                    # Go module checksums
└── Makefile                  # Build, test, run commands
```

## `frontend/` - Next.js 15 Frontend Structure

The Next.js application, built with the App Router, ensures extreme performance and a luxurious user experience.

```
frontend/
├── app/                      # Next.js App Router (pages and layouts)
│   ├── (auth)/               # Route Group for authentication pages
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── register/
│   │   │   └── page.tsx
│   │   └── layout.tsx        # Auth specific layout
│   ├── (dashboard)/          # Route Group for authenticated user dashboard
│   │   ├── dashboard/
│   │   │   └── page.tsx      # Main dashboard overview
│   │   ├── profile/
│   │   │   └── page.tsx      # User profile management
│   │   ├── projects/
│   │   │   └── page.tsx      # List of AI-generated projects
│   │   ├── projects/[id]/
│   │   │   └── page.tsx      # Individual project view/editor
│   │   ├── settings/
│   │   │   └── page.tsx      # Application settings
│   │   └── layout.tsx        # Dashboard specific layout, often with sidebar
│   ├── privacy/
│   │   └── page.tsx          # Privacy Policy
│   ├── terms/
│   │   └── page.tsx          # Terms of Service
│   ├── page.tsx              # Landing Page (Root)
│   ├── layout.tsx            # Root layout
│   ├── global.css            # Tailwind CSS directives
│   └── manifest.ts           # Web App Manifest
├── components/               # Reusable UI components (Shadcn/UI based, custom)
│   ├── ui/                   # Shadcn/UI components (generated/modified)
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   └── ...
│   ├── layout/               # Layout specific components (Header, Footer, Sidebar)
│   │   ├── Header.tsx
│   │   └── Footer.tsx
│   ├── marketing/            # Components specific to the landing page
│   │   ├── HeroSection.tsx
│   │   ├── FeaturesSection.tsx
│   │   ├── CtaSection.tsx
│   │   └── BetaSignupForm.tsx # Client component for beta signup
│   ├── dashboard/            # Components specific to the user dashboard
│   │   ├── ProjectCard.tsx
│   │   └── UserNav.tsx
│   ├── shared/               # General utility components (e.g., LoadingSpinner, ErrorMessage)
│   │   ├── ThemeToggle.tsx
│   │   └── SkipLink.tsx
│   └── providers/            # Context providers (e.g., AuthProvider, ThemeProvider)
│       └── AuthProvider.tsx
├── lib/                      # Utility functions, API clients, constants
│   ├── api/                  # API client for backend communication
│   │   └── auth.ts
│   │   └── beta.ts
│   │   └── user.ts
│   │   └── projects.ts
│   ├── hooks/                # Custom React hooks (e.g., useAuth, useDarkMode)
│   │   ├── useAuth.ts
│   │   └── useDebounce.ts
│   ├── utils/                # General utility functions (e.g., date formatting, validation helpers)
│   │   └── cn.ts             # Tailwind classnames utility
│   ├── constants.ts
│   └── validation/           # Zod schemas for form validation
│       └── schemas.ts
├── public/                   # Static assets (images, fonts, favicons)
│   ├── images/
│   │   ├── logo.svg
│   │   ├── hero-bg.webp
│   │   └── ...
│   ├── fonts/                # Self-hosted fonts
│   │   └── Inter-roman.var.woff2
│   └── favicon.ico
├── styles/                   # Entry point for Tailwind CSS
│   └── globals.css           # Contains @tailwind directives
├── types/                    # Global TypeScript types and interfaces
│   ├── next-auth.d.ts        # If using NextAuth.js
│   ├── api.d.ts              # Derived from OpenAPI spec
│   └── components.d.ts
├── .env.local                # Local environment variables
├── next.config.mjs           # Next.js configuration
├── tailwind.config.ts        # Tailwind CSS configuration
├── postcss.config.js         # PostCSS configuration
├── tsconfig.json             # TypeScript configuration
├── package.json              # Frontend dependencies and scripts
└── README.md                 # Frontend specific README
```

## `docs/` - Documentation

```
docs/
├── architecture.json         # High-level architectural decisions
├── openapi.yaml              # Detailed API contracts (Swagger/OpenAPI 3.0)
├── project-structure.md      # Detailed directory and file structure
├── phase-instructions.md     # Instructions for the next implementation phase
├── installation.md           # Zero-friction installation guide for local setup
├── deployment.md             # Guide for deploying to production environments
├── api-guide.md              # User-facing API guide (if exposing public APIs)
└── roadmap.md                # Scalability roadmap and future enhancements
```
