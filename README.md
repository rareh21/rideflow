# 🚕 RideFlow

> A full-stack ride-hailing platform built with modern TypeScript technologies and a scalable monorepo architecture.

RideFlow is a ride-hailing platform designed to connect **riders and drivers** through a secure, scalable, and maintainable system.

The project is being developed as a **Turborepo monorepo**, with a Next.js frontend, NestJS backend, PostgreSQL database, and Prisma ORM.

---

## 🏗️ Architecture

```text
rideflow/
│
├── apps/
│   ├── web/              # Next.js frontend
│   └── api/              # NestJS backend
│
├── packages/
│   ├── types/            # Shared TypeScript types
│   └── config/           # Shared configuration
│
├── docs/                 # Project documentation
│
├── .github/
│   └── workflows/        # GitHub Actions
│
├── docker-compose.yml    # Local infrastructure
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
└── README.md
```

---

## 🛠️ Tech Stack

### Frontend

* **Next.js**
* **TypeScript**
* **Tailwind CSS**
* **App Router**

### Backend

* **NestJS**
* **TypeScript**
* **JWT Authentication**
* **Role-Based Authorization**
* **bcrypt**

### Database

* **PostgreSQL**
* **Prisma ORM**
* **Docker**

### Tooling

* **Node.js**
* **pnpm**
* **Turborepo**
* **Git & GitHub**

---

## 🚀 Current Features

### Project Foundation

* pnpm workspace monorepo
* Turborepo configuration
* Next.js frontend
* NestJS backend
* Shared packages
* Environment configuration
* Docker development setup
* GitHub workflow structure

### Database

* PostgreSQL Docker container
* Prisma configuration
* Database migrations
* Prisma Client
* Prisma service/module
* Database health check

### Core Models

* User
* Driver
* Vehicle
* User → Driver relationship
* Driver → Vehicle relationship
* User roles
* Driver status

### Authentication & Authorization

* User registration
* User login
* DTO validation
* Password hashing with bcrypt
* Duplicate email handling
* JWT access tokens
* JWT strategy
* JWT authentication guard
* Current-user decorator
* Typed authenticated user
* Roles decorator
* Roles guard
* Rider authorization
* Driver authorization
* Admin authorization
* Refresh-token session management

### User Management

* User module
* User profile
* Get profile
* Update profile
* User validation

### Driver Management

* Driver module
* Driver profile
* Driver onboarding
* Driver status management
* Online/offline state
* Available/busy state

### Vehicle Management

* Vehicle module
* Add vehicle
* Update vehicle
* Vehicle validation
* Vehicle information

---

## 📍 Development Roadmap

### Phase 1 — Foundation

* [x] Project setup
* [x] Monorepo architecture
* [x] Database foundation
* [x] Basic authentication
* [x] JWT authorization
* [x] User management
* [x] Driver management
* [x] Vehicle management
* [ ] Complete refresh-token session management

### Phase 2 — Ride Management

* [ ] Ride request
* [ ] Driver ride acceptance
* [ ] Ride lifecycle
* [ ] Ride cancellation
* [ ] Driver matching
* [ ] Ride history
* [ ] Ride status tracking

### Phase 3 — Location & Real-Time

* [ ] Driver location tracking
* [ ] Rider location
* [ ] Real-time ride updates
* [ ] WebSocket integration
* [ ] Driver availability discovery

### Phase 4 — Payments

* [ ] Fare calculation
* [ ] Payment integration
* [ ] Transaction management
* [ ] Driver earnings
* [ ] Payment history

### Phase 5 — Production Readiness

* [ ] Notifications
* [ ] Rate limiting
* [ ] Logging
* [ ] Monitoring
* [ ] Automated testing
* [ ] CI/CD
* [ ] Production deployment

---

## ⚙️ Getting Started

### Prerequisites

Make sure you have installed:

* Node.js
* pnpm
* Docker
* Git

### Clone the repository

```bash
git clone git@github.com:rareh21/rideflow.git
cd rideflow
```

### Install dependencies

```bash
pnpm install
```

### Configure environment variables

Create the required environment files from the provided examples:

```bash
cp apps/api/.env.example apps/api/.env
```

Configure your database and authentication variables in `.env`.

> Never commit real environment variables, credentials, secrets, or API keys to Git.

### Start PostgreSQL

```bash
docker compose up -d
```

### Run database migrations

```bash
pnpm --filter api exec prisma migrate dev
```

### Generate Prisma Client

```bash
pnpm --filter api exec prisma generate
```

### Start the development environment

```bash
pnpm dev
```

The applications will be available at:

```text
Frontend: http://localhost:3000
Backend:  http://localhost:4000
```

Backend health check:

```text
GET /health
```

---

## 📂 Workspace Commands

Run all applications in development mode:

```bash
pnpm dev
```

Build the entire monorepo:

```bash
pnpm build
```

Run linting:

```bash
pnpm lint
```

Run tests:

```bash
pnpm test
```

Format the code:

```bash
pnpm format
```

---

## 🗄️ Prisma

Useful Prisma commands:

```bash
pnpm --filter api exec prisma studio
```

```bash
pnpm --filter api exec prisma migrate dev
```

```bash
pnpm --filter api exec prisma generate
```

```bash
pnpm --filter api exec prisma validate
```

---

## 🔐 Authentication

RideFlow uses JWT-based authentication with role-based authorization.

Supported roles currently include:

```text
RIDER
DRIVER
ADMIN
```

The authentication architecture includes:

```text
Register
   ↓
Login
   ↓
JWT Access Token
   ↓
JWT Auth Guard
   ↓
Current User
   ↓
Roles Guard
   ↓
Protected Resource
```

Refresh tokens are being implemented to provide persistent session management, token rotation, revocation, and logout support.

---

## 🧪 Testing

The backend uses Jest for unit and integration testing.

Run tests with:

```bash
pnpm test
```

Run tests for the API:

```bash
pnpm --filter api test
```

---

## 🤝 Contributing

RideFlow is currently under active development.

Before submitting changes:

1. Create a feature branch.
2. Keep changes focused.
3. Follow the existing project structure.
4. Add tests for new functionality where appropriate.
5. Make sure linting and tests pass.
6. Use descriptive commit messages.

Example:

```bash
git checkout -b feat/ride-management
```

---

## 📄 License

This project is currently private and under active development.

---

## 🚕 RideFlow

**Building the foundation for a modern, scalable ride-hailing platform.**
