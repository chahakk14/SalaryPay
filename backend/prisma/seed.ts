import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const org = await prisma.organization.create({
    data: {
      name: 'Acme Corp',
      email: 'admin@acmecorp.com',
      phone: '+91-9876543210',
      address: 'Jaipur, Rajasthan',
    },
  });

  const roles: { email: string; role: Role; firstName: string; lastName: string }[] = [
    { email: 'superadmin@acmecorp.com', role: 'SUPER_ADMIN', firstName: 'Super', lastName: 'Admin' },
    { email: 'hr@acmecorp.com', role: 'HR_MANAGER', firstName: 'HR', lastName: 'Manager' },
    { email: 'finance@acmecorp.com', role: 'FINANCE_TEAM', firstName: 'Finance', lastName: 'Team' },
    { email: 'emp@acmecorp.com', role: 'EMPLOYEE', firstName: 'John', lastName: 'Doe' },
  ];

  const dept = await prisma.department.create({
    data: { organizationId: org.id, name: 'Engineering' },
  });

  for (const r of roles) {
    const user = await prisma.user.create({
      data: {
        organizationId: org.id,
        email: r.email,
        passwordHash: await bcrypt.hash('Password@123', 10),
        role: r.role,
      },
    });
    if (r.role === 'EMPLOYEE') {
      await prisma.employee.create({
        data: {
          userId: user.id,
          organizationId: org.id,
          departmentId: dept.id,
          employeeCode: 'EMP001',
          firstName: r.firstName,
          lastName: r.lastName,
          dateOfJoining: new Date('2023-01-01'),
          designation: 'Software Engineer',
          bankAccountNo: '1234567890',
          bankIfsc: 'HDFC0001234',
          bankName: 'HDFC Bank',
          autoPayLimit: 100000,
          salaryStructure: {
            create: {
              basicSalary: 50000,
              hra: 20000,
              da: 5000,
              ta: 3000,
              pfDeduction: 6000,
              tdsDeduction: 5000,
            },
          },
        },
      });
    }
  }
  console.log('Seed complete. Passwords: Password@123');
}

main().catch(console.error).finally(() => prisma.$disconnect());
