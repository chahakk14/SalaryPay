# SalaryPay — Salary Automation Platform

![License](https://img.shields.io/badge/license-MIT-blue)

A public demo-ready payroll automation platform with role-based access control, automated salary runs, Razorpay payment flow, and job queue processing.

## Overview

SalaryPay is a full-stack application built for HR and finance teams to manage employees, salary structures, payroll runs, payslips, and payout workflows. It includes a backend API, a React frontend, Redis-backed job queueing with BullMQ, and a Razorpay payment integration.

## Features

- Role-based access control (Super Admin, HR Manager, Finance Team, Employee)
- Employee management and salary structure settings
- Payroll run creation, fund collection, approval, and execution
- Razorpay checkout for funding salary runs
- RazorpayX-style payout simulation with retry handling
- Payslip generation and employee payslip access
- Audit logging and organization onboarding
- Demo seed data for easy local setup

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + Vite + Tailwind CSS |
| State | Zustand + React Query |
| Backend | NestJS + TypeScript |
| Database | PostgreSQL + Prisma ORM |
| Queue | Redis + BullMQ |
| Payments | Razorpay (checkout) + RazorpayX (payouts) |
| Email | Nodemailer (SMTP) |
| Auth | JWT + RBAC |

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Redis 7+
- Docker (optional)

### Local Development

1. Start the backend

```bash
cd backend
cp .env.example .env
# Fill in your .env values
npm install
npx prisma db push
npx ts-node prisma/seed.ts
npm run start:dev
```

2. Start the frontend

```bash
cd ../frontend
cp .env.example .env
# Add VITE_RAZORPAY_KEY_ID=rzp_test_xxxx
npm install
npm run dev
```

3. Open the apps

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- Swagger docs: http://localhost:3000/api/docs

### Docker Setup

```bash
docker compose up -d
# Wait ~30 seconds for containers to start
docker exec $(docker ps -qf name=backend) npx ts-node prisma/seed.ts
```

- Frontend: http://localhost:80
- Backend API: http://localhost:3000
- Swagger docs: http://localhost:3000/api/docs

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Super Admin | superadmin@acmecorp.com | Password@123 |
| HR Manager | hr@acmecorp.com | Password@123 |
| Finance Team | finance@acmecorp.com | Password@123 |
| Employee | emp@acmecorp.com | Password@123 |

## Razorpay Integration

### Test Mode Setup

1. Create a Razorpay account at https://razorpay.com
2. Generate test API keys under Settings → API Keys
3. Add the keys to `backend/.env`
4. Set `VITE_RAZORPAY_KEY_ID` in `frontend/.env`

### Test Cards

| Type | Card Number | CVV | Expiry |
|------|------------|-----|--------|
| Success | 5267 3181 8797 5449 | 123 | 12/26 |
| Failure | 4012 8888 8888 1881 | 123 | 12/26 |
| UPI success | success@razorpay | — | — |

### Workflow

1. Finance Team creates a salary run and generates the payment order.
2. Finance Team funds and approves the run through Razorpay checkout.
3. Backend verifies the payment signature and marks the run as APPROVED.
4. Super Admin executes the payroll run.
5. BullMQ queues payout jobs and processes payments.
6. Failed payments retry up to 3 times with exponential backoff.
7. Payslips are generated and available for employees.

### Production Note

For production RazorpayX payouts, replace the simulation in `backend/src/modules/payroll/payroll.processor.ts` with a real `razorpayClient.payouts.create(...)` call.

## API Endpoints

### Auth

| Method | Endpoint | Access |
|--------|----------|--------|
| POST | /api/v1/auth/login | Public |
| POST | /api/v1/auth/change-password | All roles |

### Organizations

| Method | Endpoint | Access |
|--------|----------|--------|
| POST | /api/v1/organizations/onboard | Public |
| GET | /api/v1/organizations | Super Admin |

### Employees

| Method | Endpoint | Access |
|--------|----------|--------|
| GET | /api/v1/employees | Admin, HR, Finance |
| POST | /api/v1/employees | Admin, HR |
| GET | /api/v1/employees/:id | Admin, HR, Finance |
| PUT | /api/v1/employees/:id | Admin, HR |
| PUT | /api/v1/employees/:id/auto-pay-limit | Admin, Finance |
| DELETE | /api/v1/employees/:id | Admin, HR |

### Salary Structure

| Method | Endpoint | Access |
|--------|----------|--------|
| GET | /api/v1/salary-structure/:employeeId | Admin, HR, Finance |
| POST | /api/v1/salary-structure/:employeeId | Admin, HR |

### Payroll

| Method | Endpoint | Access |
|--------|----------|--------|
| GET | /api/v1/payroll/runs | Admin, Finance |
| POST | /api/v1/payroll/runs | Admin, Finance |
| GET | /api/v1/payroll/runs/:id | Admin, Finance |
| POST | /api/v1/payroll/runs/:id/create-order | Admin, Finance |
| POST | /api/v1/payroll/runs/:id/verify-payment | Admin, Finance |
| POST | /api/v1/payroll/runs/:id/approve | Admin, Finance |
| POST | /api/v1/payroll/runs/:id/execute | Super Admin only |
| GET | /api/v1/payroll/history | Admin, Finance |
| GET | /api/v1/payroll/test-cards | Admin, Finance |

### Payslips

| Method | Endpoint | Access |
|--------|----------|--------|
| GET | /api/v1/payslips | Admin, HR, Finance |
| GET | /api/v1/payslips/employee/:id | All (own only for Employee) |
| POST | /api/v1/payslips/generate/:runId | Admin, Finance |

### Audit

| Method | Endpoint | Access |
|--------|----------|--------|
| GET | /api/v1/audit | Super Admin only |

### Webhooks

| Method | Endpoint | Access |
|--------|----------|--------|
| POST | /api/v1/webhooks/razorpay | Public (Razorpay server) |

## Project Structure

```
salary-automation/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma        # 9-model DB schema
│   │   └── seed.ts              # Demo data seeder
│   └── src/
│       ├── auth/                # JWT auth, strategy, guards
│       ├── common/
│       │   ├── decorators/      # @Roles(), @CurrentUser()
│       │   ├── enums/           # Role enum
│       │   └── guards/          # RolesGuard
│       └── modules/
│           ├── organizations/   # Org onboarding
│           ├── users/           # User management
│           ├── employees/       # Employee CRUD
│           ├── salary/          # Salary structure
│           ├── payroll/         # Salary runs + Razorpay + BullMQ
│           ├── payslips/        # Payslip generation
│           ├── audit/           # Audit logs
│           ├── notifications/   # Email via Nodemailer
│           └── webhooks/        # RazorpayX webhooks
└── frontend/
    └── src/
        ├── api/                 # Axios API calls per module
        ├── components/
        │   ├── layout/          # Sidebar, Layout
        │   └── ui/              # Badge, Card, StatCard
        ├── pages/               # One file per route
        ├── store/               # Zustand auth store
        └── types/               # TypeScript interfaces
```

## Environment Variables

### Backend (.env)
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/salary_automation"
JWT_SECRET="your-32-char-random-string"
REDIS_HOST=localhost
REDIS_PORT=6379
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_secret
RAZORPAY_ACCOUNT_NUMBER=your_razorpayx_account
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@gmail.com
SMTP_PASS=your_app_password
FRONTEND_URL=http://localhost:5173
PORT=3000
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3000/api/v1
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
```

## License

This repository is shared under the MIT License.
