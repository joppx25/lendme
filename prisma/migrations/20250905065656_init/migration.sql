-- CreateEnum
CREATE TYPE "public"."Status" AS ENUM ('ACTIVE', 'INACTIVE', 'PENDING', 'BLOCKED');

-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('SUPERADMIN', 'MANAGER', 'BORROWER', 'GUEST');

-- CreateEnum
CREATE TYPE "public"."LoanType" AS ENUM ('PERSONAL', 'BUSINESS', 'EMERGENCY', 'EDUCATION', 'MEDICAL', 'AGRICULTURE');

-- CreateEnum
CREATE TYPE "public"."LoanStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'APPROVED', 'ACTIVE', 'COMPLETED', 'OVERDUE', 'DEFAULTED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('PENDING', 'PAID', 'LATE', 'PARTIAL', 'MISSED');

-- CreateEnum
CREATE TYPE "public"."PaymentMethod" AS ENUM ('CASH', 'BANK_TRANSFER', 'GCASH', 'PAYMAYA', 'CHECK', 'ONLINE_BANKING');

-- CreateEnum
CREATE TYPE "public"."ContributionType" AS ENUM ('INITIAL_CAPITAL', 'MONTHLY_SAVINGS', 'VOLUNTARY', 'PROFIT_SHARING', 'SPECIAL_ASSESSMENT');

-- CreateEnum
CREATE TYPE "public"."ContributionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'PROCESSING');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "dob" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phone_no" TEXT NOT NULL,
    "status" "public"."Status" NOT NULL DEFAULT 'ACTIVE',
    "role" "public"."Role" NOT NULL DEFAULT 'GUEST',
    "password" TEXT NOT NULL,
    "salt" TEXT NOT NULL,
    "activated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."loans" (
    "id" TEXT NOT NULL,
    "loan_number" TEXT NOT NULL,
    "borrower_id" TEXT NOT NULL,
    "approver_id" TEXT,
    "loan_type" "public"."LoanType" NOT NULL,
    "principal_amount" DECIMAL(15,2) NOT NULL,
    "interest_rate" DECIMAL(5,2) NOT NULL,
    "term_months" INTEGER NOT NULL,
    "monthly_payment" DECIMAL(15,2) NOT NULL,
    "total_amount" DECIMAL(15,2) NOT NULL,
    "remaining_balance" DECIMAL(15,2) NOT NULL,
    "status" "public"."LoanStatus" NOT NULL DEFAULT 'PENDING',
    "purpose" TEXT NOT NULL,
    "collateral" TEXT,
    "requirement_files" JSONB,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approved_at" TIMESTAMP(3),
    "rejected_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."loan_payments" (
    "id" TEXT NOT NULL,
    "loan_id" TEXT NOT NULL,
    "payer_id" TEXT NOT NULL,
    "payment_number" INTEGER NOT NULL,
    "scheduled_amount" DECIMAL(15,2) NOT NULL,
    "paid_amount" DECIMAL(15,2) NOT NULL,
    "principal_paid" DECIMAL(15,2) NOT NULL,
    "interest_paid" DECIMAL(15,2) NOT NULL,
    "late_fee" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "scheduled_date" TIMESTAMP(3) NOT NULL,
    "paid_date" TIMESTAMP(3),
    "status" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "payment_method" "public"."PaymentMethod",
    "receipt_number" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loan_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."contributions" (
    "id" TEXT NOT NULL,
    "contributor_id" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "contribution_type" "public"."ContributionType" NOT NULL,
    "payment_method" "public"."PaymentMethod" NOT NULL,
    "receipt_number" TEXT,
    "description" TEXT,
    "status" "public"."ContributionStatus" NOT NULL DEFAULT 'PENDING',
    "contributed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),
    "processed_by" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contributions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."fund_balance" (
    "id" TEXT NOT NULL,
    "total_funds" DECIMAL(15,2) NOT NULL,
    "available_funds" DECIMAL(15,2) NOT NULL,
    "loaned_funds" DECIMAL(15,2) NOT NULL,
    "total_contributions" DECIMAL(15,2) NOT NULL,
    "total_repayments" DECIMAL(15,2) NOT NULL,
    "last_updated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fund_balance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "loans_loan_number_key" ON "public"."loans"("loan_number");

-- CreateIndex
CREATE UNIQUE INDEX "loan_payments_loan_id_payment_number_key" ON "public"."loan_payments"("loan_id", "payment_number");

-- AddForeignKey
ALTER TABLE "public"."loans" ADD CONSTRAINT "loans_borrower_id_fkey" FOREIGN KEY ("borrower_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."loans" ADD CONSTRAINT "loans_approver_id_fkey" FOREIGN KEY ("approver_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."loan_payments" ADD CONSTRAINT "loan_payments_loan_id_fkey" FOREIGN KEY ("loan_id") REFERENCES "public"."loans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."loan_payments" ADD CONSTRAINT "loan_payments_payer_id_fkey" FOREIGN KEY ("payer_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contributions" ADD CONSTRAINT "contributions_contributor_id_fkey" FOREIGN KEY ("contributor_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
