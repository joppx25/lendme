import { 
  LoanType, 
  LoanStatus, 
  PaymentStatus, 
  PaymentMethod, 
  ContributionType, 
  ContributionStatus 
} from "@/generated/prisma";

// Loan-related types
export interface LoanApplication {
  loanType: LoanType;
  principalAmount: number;
  termMonths: number;
  purpose: string;
  collateral?: string;
}

export interface LoanDetails {
  id: string;
  loanNumber: string;
  borrower: {
    id: string;
    name: string;
    email: string;
  };
  approver?: {
    id: string;
    name: string;
  };
  loanType: LoanType;
  principalAmount: number;
  interestRate: number;
  termMonths: number;
  monthlyPayment: number;
  totalAmount: number;
  remainingBalance: number;
  status: LoanStatus;
  purpose: string;
  collateral?: string;
  startDate?: Date;
  endDate?: Date;
  requestedAt: Date;
  approvedAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
}

export interface PaymentDetails {
  id: string;
  loanId: string;
  paymentNumber: number;
  scheduledAmount: number;
  paidAmount: number;
  principalPaid: number;
  interestPaid: number;
  lateFee: number;
  scheduledDate: Date;
  paidDate?: Date;
  status: PaymentStatus;
  paymentMethod?: PaymentMethod;
  receiptNumber?: string;
  notes?: string;
}

export interface LoanSummary {
  totalLoans: number;
  activeLoans: number;
  completedLoans: number;
  overdueLoans: number;
  totalLoanedAmount: number;
  totalRepaidAmount: number;
  totalOutstandingAmount: number;
}

// Contribution-related types
export interface ContributionDetails {
  id: string;
  contributor: {
    id: string;
    name: string;
    email: string;
  };
  amount: number;
  contributionType: ContributionType;
  paymentMethod: PaymentMethod;
  receiptNumber?: string;
  description?: string;
  status: ContributionStatus;
  contributedAt: Date;
  processedAt?: Date;
  processedBy?: string;
}

export interface ContributionSummary {
  totalContributions: number;
  totalAmount: number;
  monthlyContributions: number;
  voluntaryContributions: number;
  pendingContributions: number;
  rejectedContributions: number;
}

// Fund management types
export interface FundBalance {
  totalFunds: number;
  availableFunds: number;
  loanedFunds: number;
  totalContributions: number;
  totalRepayments: number;
  lastUpdated: Date;
}

// Dashboard analytics types
export interface LoanAnalytics {
  loansByType: Record<LoanType, number>;
  loansByStatus: Record<LoanStatus, number>;
  monthlyLoanVolume: Array<{
    month: string;
    count: number;
    amount: number;
  }>;
  repaymentRate: number;
  defaultRate: number;
  averageLoanAmount: number;
  averageLoanTerm: number;
}

export interface ContributionAnalytics {
  contributionsByType: Record<ContributionType, number>;
  monthlyContributions: Array<{
    month: string;
    count: number;
    amount: number;
  }>;
  topContributors: Array<{
    userId: string;
    name: string;
    totalAmount: number;
    contributionCount: number;
  }>;
}

// Form types for UI
export interface LoanApplicationForm {
  loanType: LoanType;
  principalAmount: string;
  termMonths: string;
  purpose: string;
  collateral?: string;
}

export interface ContributionForm {
  amount: string;
  contributionType: ContributionType;
  paymentMethod: PaymentMethod;
  receiptNumber?: string;
  description?: string;
}

export interface PaymentForm {
  loanId: string;
  paidAmount: string;
  paymentMethod: PaymentMethod;
  receiptNumber?: string;
  notes?: string;
}

// Search and filter types
export interface LoanFilters {
  status?: LoanStatus[];
  loanType?: LoanType[];
  borrowerId?: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
  amountRange?: {
    min: number;
    max: number;
  };
}

export interface ContributionFilters {
  status?: ContributionStatus[];
  contributionType?: ContributionType[];
  contributorId?: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
  amountRange?: {
    min: number;
    max: number;
  };
}

// Pagination types
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

// Loan approval workflow types
export interface LoanApprovalRequest {
  loanId: string;
  approverId: string;
  approved: boolean;
  rejectionReason?: string;
  notes?: string;
}

export interface LoanApprovalHistory {
  id: string;
  loanId: string;
  approverId: string;
  approverName: string;
  action: 'APPROVED' | 'REJECTED' | 'UNDER_REVIEW';
  reason?: string;
  notes?: string;
  createdAt: Date;
}

// Notification types
export interface LoanNotification {
  id: string;
  userId: string;
  type: 'LOAN_APPROVED' | 'LOAN_REJECTED' | 'PAYMENT_DUE' | 'PAYMENT_OVERDUE' | 'LOAN_COMPLETED';
  title: string;
  message: string;
  loanId?: string;
  paymentId?: string;
  read: boolean;
  createdAt: Date;
}

// Export utility types
export type LoanStatusColor = 'default' | 'secondary' | 'destructive' | 'outline';
export type PaymentStatusColor = 'default' | 'secondary' | 'destructive' | 'outline';
export type ContributionStatusColor = 'default' | 'secondary' | 'destructive' | 'outline';
