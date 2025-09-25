import crypto from 'crypto';
import { PrismaClient, ContributionType, ContributionStatus, PaymentMethod, LoanType, LoanStatus, PaymentStatus } from '@prisma/client';

const prisma = new PrismaClient();

function hashPassword(password: string, salt: string) {
  return crypto.scryptSync(password.normalize(), salt, 64).toString('hex');
}

function generateSalt(length: number = 16) {
  return crypto.randomBytes(length).toString('hex');
}

async function main() {
  console.log('🌱 Starting seed...');

  // Create test users
  const salt = generateSalt();
  const hashedPassword = hashPassword('password123', salt);

  // Create Super Admin
  await prisma.users.upsert({
    where: { email: 'admin@lendme.com' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'admin@lendme.com',
      dob: '1980-01-01',
      address: '123 Admin Street, Manila, Philippines',
      phoneNo: '+639123456789',
      status: 'ACTIVE',
      role: 'SUPERADMIN',
      activated: true,
      password: hashedPassword,
      salt: salt,
    },
  });

  // Create Manager
  const manager = await prisma.users.upsert({
    where: { email: 'manager@lendme.com' },
    update: {},
    create: {
      name: 'Loan Manager',
      email: 'manager@lendme.com',
      dob: '1985-05-15',
      address: '456 Manager Ave, Quezon City, Philippines',
      phoneNo: '+639234567890',
      status: 'ACTIVE',
      role: 'MANAGER',
      activated: true,
      password: hashedPassword,
      salt: salt,
    },
  });

  // Create Borrowers
  const borrower1 = await prisma.users.upsert({
    where: { email: 'borrower1@example.com' },
    update: {},
    create: {
      name: 'Juan Dela Cruz',
      email: 'borrower1@example.com',
      dob: '1990-03-20',
      address: '789 Borrower St, Makati, Philippines',
      phoneNo: '+639345678901',
      status: 'ACTIVE',
      role: 'BORROWER',
      activated: true,
      password: hashedPassword,
      salt: salt,
    },
  });

  const borrower2 = await prisma.users.upsert({
    where: { email: 'borrower2@example.com' },
    update: {},
    create: {
      name: 'Maria Santos',
      email: 'borrower2@example.com',
      dob: '1988-07-12',
      address: '321 Santos Lane, Cebu City, Philippines',
      phoneNo: '+639456789012',
      status: 'ACTIVE',
      role: 'BORROWER',
      activated: true,
      password: hashedPassword,
      salt: salt,
    },
  });

  const borrower3 = await prisma.users.upsert({
    where: { email: 'borrower3@example.com' },
    update: {},
    create: {
      name: 'Pedro Garcia',
      email: 'borrower3@example.com',
      dob: '1992-11-08',
      address: '654 Garcia Road, Davao City, Philippines',
      phoneNo: '+639567890123',
      status: 'ACTIVE',
      role: 'BORROWER',
      activated: true,
      password: hashedPassword,
      salt: salt,
    },
  });

  console.log('✅ Users created');

  // Initialize Fund Balance
  await prisma.fundBalance.upsert({
    where: { id: 'main-fund' },
    update: {},
    create: {
      id: 'main-fund',
      totalFunds: 1000000.00,
      availableFunds: 750000.00,
      loanedFunds: 250000.00,
      totalContributions: 800000.00,
      totalRepayments: 200000.00,
    },
  });

  console.log('✅ Fund balance initialized');

  // Create sample contributions
  const contributions = [
    {
      contributorId: borrower1.id,
      amount: 10000.00,
      contributionType: ContributionType.INITIAL_CAPITAL,
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      receiptNumber: 'RCP001',
      description: 'Initial capital contribution',
      status: ContributionStatus.APPROVED,
      contributedAt: new Date('2024-01-15'),
      processedAt: new Date('2024-01-16'),
    },
    {
      contributorId: borrower2.id,
      amount: 5000.00,
      contributionType: ContributionType.MONTHLY_SAVINGS,
      paymentMethod: PaymentMethod.GCASH,
      receiptNumber: 'RCP002',
      description: 'Monthly savings contribution',
      status: ContributionStatus.APPROVED,
      contributedAt: new Date('2024-02-01'),
      processedAt: new Date('2024-02-01'),
    },
    {
      contributorId: borrower3.id,
      amount: 15000.00,
      contributionType: ContributionType.VOLUNTARY,
      paymentMethod: PaymentMethod.CASH,
      receiptNumber: 'RCP003',
      description: 'Voluntary contribution for emergency fund',
      status: ContributionStatus.APPROVED,
      contributedAt: new Date('2024-02-15'),
      processedAt: new Date('2024-02-16'),
    },
    {
      contributorId: borrower1.id,
      amount: 3000.00,
      contributionType: ContributionType.MONTHLY_SAVINGS,
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      receiptNumber: 'RCP004',
      description: 'February monthly savings',
      status: ContributionStatus.PENDING,
      contributedAt: new Date(),
    },
  ];

  for (const contribution of contributions) {
    await prisma.contributions.create({
      data: contribution,
    });
  }

  console.log('✅ Sample contributions created');

  // Create sample loans
  const loans = [
    {
      loanNumber: 'LOAN240001',
      borrowerId: borrower1.id,
      approverId: manager.id,
      loanType: LoanType.PERSONAL,
      principalAmount: 50000.00,
      interestRate: 12.00,
      termMonths: 12,
      monthlyPayment: 4441.66,
      totalAmount: 53300.00,
      remainingBalance: 40000.00,
      status: LoanStatus.ACTIVE,
      purpose: 'Home improvement and repairs',
      startDate: new Date('2024-01-20'),
      endDate: new Date('2025-01-20'),
      requestedAt: new Date('2024-01-15'),
      approvedAt: new Date('2024-01-18'),
    },
    {
      loanNumber: 'LOAN240002',
      borrowerId: borrower2.id,
      approverId: manager.id,
      loanType: LoanType.BUSINESS,
      principalAmount: 100000.00,
      interestRate: 15.00,
      termMonths: 24,
      monthlyPayment: 4840.55,
      totalAmount: 116173.20,
      remainingBalance: 85000.00,
      status: LoanStatus.ACTIVE,
      purpose: 'Small business expansion - buying equipment',
      collateral: 'Business equipment and inventory',
      startDate: new Date('2024-02-01'),
      endDate: new Date('2026-02-01'),
      requestedAt: new Date('2024-01-25'),
      approvedAt: new Date('2024-01-30'),
    },
    {
      loanNumber: 'LOAN240003',
      borrowerId: borrower3.id,
      loanType: LoanType.EMERGENCY,
      principalAmount: 25000.00,
      interestRate: 8.00,
      termMonths: 6,
      monthlyPayment: 4344.06,
      totalAmount: 26064.36,
      remainingBalance: 25000.00,
      status: LoanStatus.PENDING,
      purpose: 'Medical emergency for family member',
      requestedAt: new Date(),
    },
    {
      loanNumber: 'LOAN240004',
      borrowerId: borrower1.id,
      approverId: manager.id,
      loanType: LoanType.EDUCATION,
      principalAmount: 75000.00,
      interestRate: 10.00,
      termMonths: 36,
      monthlyPayment: 2419.20,
      totalAmount: 87091.20,
      remainingBalance: 0.00,
      status: LoanStatus.COMPLETED,
      purpose: 'College tuition fees for children',
      startDate: new Date('2023-06-01'),
      endDate: new Date('2024-06-01'),
      requestedAt: new Date('2023-05-15'),
      approvedAt: new Date('2023-05-20'),
    },
  ];

  for (const loan of loans) {
    await prisma.loans.upsert({
      where: { loanNumber: loan.loanNumber },
      update: {},
      create: loan,
    });
  }

  console.log('✅ Sample loans created');

  // Create sample loan payments for active loans
  const activeLoan = await prisma.loans.findFirst({
    where: { loanNumber: 'LOAN240001' },
  });

  if (activeLoan) {
    const payments = [
      {
        loanId: activeLoan.id,
        payerId: borrower1.id,
        paymentNumber: 1,
        scheduledAmount: 4441.66,
        paidAmount: 4441.66,
        principalPaid: 3941.66,
        interestPaid: 500.00,
        lateFee: 0.00,
        scheduledDate: new Date('2024-02-20'),
        paidDate: new Date('2024-02-20'),
        status: PaymentStatus.PAID,
        paymentMethod: PaymentMethod.BANK_TRANSFER,
        receiptNumber: 'PAY001',
      },
      {
        loanId: activeLoan.id,
        payerId: borrower1.id,
        paymentNumber: 2,
        scheduledAmount: 4441.66,
        paidAmount: 4441.66,
        principalPaid: 4008.33,
        interestPaid: 433.33,
        lateFee: 0.00,
        scheduledDate: new Date('2024-03-20'),
        paidDate: new Date('2024-03-19'),
        status: PaymentStatus.PAID,
        paymentMethod: PaymentMethod.GCASH,
        receiptNumber: 'PAY002',
      },
      {
        loanId: activeLoan.id,
        payerId: borrower1.id,
        paymentNumber: 3,
        scheduledAmount: 4441.66,
        paidAmount: 0.00,
        principalPaid: 0.00,
        interestPaid: 0.00,
        lateFee: 0.00,
        scheduledDate: new Date('2024-04-20'),
        status: PaymentStatus.PENDING,
      },
    ];

    for (const payment of payments) {
      await prisma.loanPayments.upsert({
        where: {
          loanId_paymentNumber: {
            loanId: payment.loanId,
            paymentNumber: payment.paymentNumber,
          },
        },
        update: {},
        create: payment,
      });
    }
  }

  console.log('✅ Sample loan payments created');

  console.log('🎉 Seed completed successfully!');
  console.log('\n📊 Created:');
  console.log('- 5 users (1 super admin, 1 manager, 3 borrowers)');
  console.log('- 1 fund balance record');
  console.log('- 4 contributions');
  console.log('- 4 loans (1 pending, 2 active, 1 completed)');
  console.log('- 3 loan payments');
  console.log('\n🔐 Default password for all users: password123');
  console.log('\n📧 Test accounts:');
  console.log('Super Admin: admin@lendme.com');
  console.log('Manager: manager@lendme.com');
  console.log('Borrower 1: borrower1@example.com');
  console.log('Borrower 2: borrower2@example.com');
  console.log('Borrower 3: borrower3@example.com');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
