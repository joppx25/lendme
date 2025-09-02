# Loan Management System - Database Schema Documentation

## Overview

This document describes the database schema for the LendMe loan management system, designed to handle loan applications, contributions, payments, and fund management for a cooperative or microfinance institution.

## Core Entities

### 1. Users (`users`)

The central user entity supporting multiple roles in the lending system.

**Fields:**
- `id` - Unique identifier (UUID)
- `name` - Full name of the user
- `email` - Unique email address
- `dob` - Date of birth (stored as string)
- `address` - Complete address
- `phoneNo` - Phone number (Philippine format)
- `status` - Account status (ACTIVE, INACTIVE, PENDING, BLOCKED)
- `role` - User role (SUPERADMIN, MANAGER, BORROWER, GUEST)
- `password` - Hashed password
- `salt` - Password salt for security

**Relationships:**
- One-to-many with `loans` (as borrower)
- One-to-many with `loans` (as approver)
- One-to-many with `contributions`
- One-to-many with `loanPayments`

### 2. Loans (`loans`)

Core entity for managing loan applications and active loans.

**Fields:**
- `id` - Unique identifier (UUID)
- `loanNumber` - Human-readable unique loan number
- `borrowerId` - Reference to borrower user
- `approverId` - Reference to approving user (optional)
- `loanType` - Type of loan (PERSONAL, BUSINESS, EMERGENCY, etc.)
- `principalAmount` - Original loan amount
- `interestRate` - Annual interest rate (percentage)
- `termMonths` - Loan term in months
- `monthlyPayment` - Calculated monthly payment amount
- `totalAmount` - Total amount to be repaid (principal + interest)
- `remainingBalance` - Current outstanding balance
- `status` - Current loan status
- `purpose` - Purpose/reason for the loan
- `collateral` - Collateral description (optional)
- `startDate` - Loan disbursement date
- `endDate` - Loan maturity date
- `requestedAt` - Application submission date
- `approvedAt` - Approval date (optional)
- `rejectedAt` - Rejection date (optional)
- `rejectionReason` - Reason for rejection (optional)

**Loan Types:**
- `PERSONAL` - Personal loans for individual needs
- `BUSINESS` - Business loans for commercial purposes
- `EMERGENCY` - Emergency loans with favorable terms
- `EDUCATION` - Educational loans for tuition/fees
- `MEDICAL` - Medical loans for healthcare expenses
- `AGRICULTURE` - Agricultural loans for farming

**Loan Status Flow:**
```
PENDING → UNDER_REVIEW → APPROVED/REJECTED
APPROVED → ACTIVE → COMPLETED
ACTIVE → OVERDUE → DEFAULTED (if payments missed)
```

### 3. Loan Payments (`loanPayments`)

Tracks individual payment transactions for each loan.

**Fields:**
- `id` - Unique identifier (UUID)
- `loanId` - Reference to parent loan
- `payerId` - Reference to user making payment
- `paymentNumber` - Sequential payment number (1st, 2nd, etc.)
- `scheduledAmount` - Expected payment amount
- `paidAmount` - Actual amount paid
- `principalPaid` - Portion applied to principal
- `interestPaid` - Portion applied to interest
- `lateFee` - Late fee charged (if applicable)
- `scheduledDate` - Due date for payment
- `paidDate` - Actual payment date
- `status` - Payment status
- `paymentMethod` - Method used for payment
- `receiptNumber` - Receipt/reference number
- `notes` - Additional notes

**Payment Status:**
- `PENDING` - Payment due but not made
- `PAID` - Payment completed on time
- `LATE` - Payment made after due date
- `PARTIAL` - Partial payment made
- `MISSED` - Payment overdue and not made

### 4. Contributions (`contributions`)

Manages member contributions to the lending fund.

**Fields:**
- `id` - Unique identifier (UUID)
- `contributorId` - Reference to contributing user
- `amount` - Contribution amount
- `contributionType` - Type of contribution
- `paymentMethod` - Payment method used
- `receiptNumber` - Receipt reference
- `description` - Optional description
- `status` - Processing status
- `contributedAt` - Contribution date
- `processedAt` - Processing completion date
- `processedBy` - User who processed the contribution

**Contribution Types:**
- `INITIAL_CAPITAL` - Initial fund contribution
- `MONTHLY_SAVINGS` - Regular monthly contributions
- `VOLUNTARY` - Voluntary additional contributions
- `PROFIT_SHARING` - Share of loan interest profits
- `SPECIAL_ASSESSMENT` - Special one-time contributions

### 5. Fund Balance (`fundBalance`)

Tracks the overall financial state of the lending fund.

**Fields:**
- `id` - Unique identifier
- `totalFunds` - Total funds in the pool
- `availableFunds` - Funds available for new loans
- `loanedFunds` - Funds currently loaned out
- `totalContributions` - Cumulative contributions received
- `totalRepayments` - Cumulative loan repayments
- `lastUpdated` - Last update timestamp

## Payment Methods

The system supports various payment methods common in the Philippines:

- `CASH` - Cash payments
- `BANK_TRANSFER` - Bank-to-bank transfers
- `GCASH` - GCash mobile wallet
- `PAYMAYA` - PayMaya digital wallet
- `CHECK` - Bank checks
- `ONLINE_BANKING` - Online banking transfers

## Business Rules

### Loan Approval Workflow

1. **Application Submission**
   - Borrower submits loan application
   - Status: `PENDING`
   - System generates unique loan number

2. **Review Process**
   - Manager/Admin reviews application
   - Status: `UNDER_REVIEW`
   - Can request additional information

3. **Approval/Rejection**
   - Manager/Admin makes decision
   - Status: `APPROVED` or `REJECTED`
   - If approved, funds are disbursed

4. **Active Loan Management**
   - Status: `ACTIVE`
   - Payment schedule automatically generated
   - Monthly payments tracked

### Interest Rate and Term Limits

Each loan type has predefined limits:

| Loan Type | Max Amount | Max Term | Interest Rate |
|-----------|------------|----------|---------------|
| PERSONAL | ₱500,000 | 36 months | 12% |
| BUSINESS | ₱1,000,000 | 60 months | 15% |
| EMERGENCY | ₱100,000 | 12 months | 8% |
| EDUCATION | ₱300,000 | 48 months | 10% |
| MEDICAL | ₱200,000 | 24 months | 8% |
| AGRICULTURE | ₱800,000 | 36 months | 14% |

### Late Payment Handling

- **Grace Period**: 5 days after due date
- **Late Fee**: 0.05% per day of overdue amount
- **Status Changes**:
  - After grace period: `LATE`
  - After 30 days: `OVERDUE`
  - After 90 days: `DEFAULTED`

## Security Considerations

1. **Data Protection**
   - All sensitive data encrypted
   - User passwords properly hashed with salt
   - Session management with Redis

2. **Access Control**
   - Role-based access control (RBAC)
   - Different permissions for each role
   - Audit trail for sensitive operations

3. **Financial Integrity**
   - Decimal precision for monetary values
   - Transaction logging
   - Balance reconciliation

## Performance Optimizations

1. **Indexing Strategy**
   - Unique indexes on `email`, `loanNumber`
   - Composite indexes for common queries
   - Foreign key indexes for relationships

2. **Query Optimization**
   - Pagination for large datasets
   - Selective field loading
   - Caching for frequently accessed data

## Future Enhancements

1. **Audit Trail**
   - Track all changes to loans and payments
   - User action logging
   - Financial transaction history

2. **Notifications**
   - Payment reminders
   - Loan status updates
   - System alerts

3. **Reporting**
   - Financial reports
   - Loan performance analytics
   - Member contribution tracking

4. **Integration**
   - Payment gateway integration
   - SMS notifications
   - Email automation

## Migration Strategy

The schema is designed for incremental updates:

1. **Version Control**
   - All schema changes via Prisma migrations
   - Rollback capability for each migration
   - Database backup before major changes

2. **Data Migration**
   - Seed scripts for test data
   - Production data migration scripts
   - Data validation after migrations

## API Endpoints Structure

The schema supports the following API endpoint categories:

- `/api/loans` - Loan management
- `/api/contributions` - Contribution management
- `/api/payments` - Payment processing
- `/api/funds` - Fund balance tracking
- `/api/reports` - Analytics and reporting
- `/api/users` - User management

This schema provides a solid foundation for a comprehensive loan management system that can scale with the organization's needs.
