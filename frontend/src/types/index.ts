export type Role = 'SUPER_ADMIN' | 'HR_MANAGER' | 'FINANCE_TEAM' | 'EMPLOYEE';

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  organizationId: string;
  organizationName: string;
  employeeId?: string;
}

export interface Employee {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  designation?: string;
  phone?: string;
  dateOfJoining?: string;
  bankAccountNo: string;
  bankIfsc: string;
  bankName: string;
  upiId?: string;
  panNumber?: string;
  autoPayLimit: number;
  isActive: boolean;
  department?: { id: string; name: string };
  salaryStructure?: SalaryStructure;
  user?: { email: string; role: Role };
}

export interface SalaryStructure {
  basicSalary: number;
  hra: number;
  da: number;
  ta: number;
  medicalAllow: number;
  otherAllow: number;
  pfDeduction: number;
  esiDeduction: number;
  tdsDeduction: number;
  otherDeduct: number;
}

export interface SalaryRun {
  id: string;
  month: number;
  year: number;
  status: 'DRAFT' | 'APPROVED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  totalAmount: number;
  createdAt: string;
  approvedAt?: string;
  executedAt?: string;
  _count?: { payments: number };
  payments?: SalaryPayment[];
}

export interface SalaryPayment {
  id: string;
  netSalary: number;
  grossSalary: number;
  totalDeductions: number;
  status: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'RETRYING';
  razorpayPayoutId?: string;
  retryCount: number;
  failureReason?: string;
  processedAt?: string;
  employee?: {
    firstName: string;
    lastName: string;
    employeeCode: string;
    bankName?: string;
    bankIfsc?: string;
    bankAccountNo?: string;
  };
  salaryRun?: { month: number; year: number };
}

export interface Payslip {
  id: string;
  month: number;
  year: number;
  generatedAt: string;
  employee?: { firstName: string; lastName: string; employeeCode: string };
  salaryRun?: { status: string };
}

export interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId?: string;
  oldData?: any;
  newData?: any;
  ipAddress?: string;
  createdAt: string;
  user: { email: string; role: Role };
}

export interface Organization {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  gstin?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Department {
  id: string;
  name: string;
  organizationId: string;
}

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
  _demo?: boolean;
}
