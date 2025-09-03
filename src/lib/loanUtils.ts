import { Decimal } from "@prisma/client/runtime/library";

export interface LoanCalculation {
  monthlyPayment: number;
  totalAmount: number;
  totalInterest: number;
  paymentSchedule: PaymentScheduleItem[];
}

export interface PaymentScheduleItem {
  paymentNumber: number;
  scheduledDate: Date;
  scheduledAmount: number;
  principalAmount: number;
  interestAmount: number;
  remainingBalance: number;
}

/**
 * Calculate loan payment details using simple interest for entire term
 * @param principal - Loan principal amount
 * @param termInterestRate - Interest rate for the entire term as percentage (e.g., 12 for 12%)
 * @param termMonths - Loan term in months
 * @param startDate - Loan start date
 */
export function calculateSimpleInterestLoan(
  principal: number,
  termInterestRate: number,
  termMonths: number,
  startDate: Date = new Date()
): LoanCalculation {
  // Calculate total interest for the entire term
  const totalInterest = principal * (termInterestRate / 100);
  const totalAmount = principal + totalInterest;
  const monthlyPayment = totalAmount / termMonths;
  
  // Generate payment schedule with equal monthly payments
  const paymentSchedule: PaymentScheduleItem[] = [];
  let remainingBalance = totalAmount;
  
  for (let i = 1; i <= termMonths; i++) {
    const scheduledDate = new Date(startDate);
    scheduledDate.setMonth(scheduledDate.getMonth() + i);
    
    // For simple interest, each payment has equal principal and interest portions
    const principalAmount = principal / termMonths;
    const interestAmount = totalInterest / termMonths;
    
    remainingBalance = Math.max(0, remainingBalance - monthlyPayment);
    
    paymentSchedule.push({
      paymentNumber: i,
      scheduledDate,
      scheduledAmount: monthlyPayment,
      principalAmount,
      interestAmount,
      remainingBalance
    });
  }
  
  return {
    monthlyPayment,
    totalAmount,
    totalInterest,
    paymentSchedule
  };
}

/**
 * Calculate loan payment details using compound interest (original function for backward compatibility)
 * @param principal - Loan principal amount
 * @param annualInterestRate - Annual interest rate as percentage (e.g., 12 for 12%)
 * @param termMonths - Loan term in months
 * @param startDate - Loan start date
 */
export function calculateLoanPayment(
  principal: number,
  annualInterestRate: number,
  termMonths: number,
  startDate: Date = new Date()
): LoanCalculation {
  // Convert annual rate to decimal
  const monthlyRate = annualInterestRate / 100 / 12;
  
  // Calculate monthly payment using PMT formula
  let monthlyPayment: number;
  
  if (monthlyRate === 0) {
    // No interest case
    monthlyPayment = principal / termMonths;
  } else {
    // PMT = P * [r(1+r)^n] / [(1+r)^n - 1]
    const factor = Math.pow(1 + monthlyRate, termMonths);
    monthlyPayment = principal * (monthlyRate * factor) / (factor - 1);
  }
  
  const totalAmount = monthlyPayment * termMonths;
  const totalInterest = totalAmount - principal;
  
  // Generate payment schedule
  const paymentSchedule: PaymentScheduleItem[] = [];
  let remainingBalance = principal;
  
  for (let i = 1; i <= termMonths; i++) {
    const interestAmount = remainingBalance * monthlyRate;
    const principalAmount = monthlyPayment - interestAmount;
    remainingBalance = Math.max(0, remainingBalance - principalAmount);
    
    const scheduledDate = new Date(startDate);
    scheduledDate.setMonth(scheduledDate.getMonth() + i);
    
    paymentSchedule.push({
      paymentNumber: i,
      scheduledDate,
      scheduledAmount: monthlyPayment,
      principalAmount,
      interestAmount,
      remainingBalance,
    });
  }
  
  return {
    monthlyPayment: Math.round(monthlyPayment * 100) / 100,
    totalAmount: Math.round(totalAmount * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
    paymentSchedule,
  };
}

/**
 * Generate a unique loan number
 * @param prefix - Prefix for the loan number (default: "LOAN")
 */
export function generateLoanNumber(prefix: string = "LOAN"): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  
  return `${prefix}${year}${month}${day}${random}`;
}

/**
 * Calculate late fees based on overdue amount and days
 * @param overdueAmount - Amount that is overdue
 * @param daysOverdue - Number of days overdue
 * @param lateFeeRate - Late fee rate as percentage per day (default: 0.05% per day)
 */
export function calculateLateFee(
  overdueAmount: number,
  daysOverdue: number,
  lateFeeRate: number = 0.05
): number {
  if (daysOverdue <= 0) return 0;
  
  const dailyRate = lateFeeRate / 100;
  const lateFee = overdueAmount * dailyRate * daysOverdue;
  
  return Math.round(lateFee * 100) / 100;
}

/**
 * Check if a payment is overdue
 * @param scheduledDate - The scheduled payment date
 * @param gracePeriodDays - Grace period in days (default: 5 days)
 */
export function isPaymentOverdue(
  scheduledDate: Date,
  gracePeriodDays: number = 5
): boolean {
  const now = new Date();
  const graceDate = new Date(scheduledDate);
  graceDate.setDate(graceDate.getDate() + gracePeriodDays);
  
  return now > graceDate;
}

/**
 * Calculate days overdue
 * @param scheduledDate - The scheduled payment date
 * @param gracePeriodDays - Grace period in days (default: 5 days)
 */
export function getDaysOverdue(
  scheduledDate: Date,
  gracePeriodDays: number = 5
): number {
  const now = new Date();
  const graceDate = new Date(scheduledDate);
  graceDate.setDate(graceDate.getDate() + gracePeriodDays);
  
  if (now <= graceDate) return 0;
  
  const diffTime = now.getTime() - graceDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

/**
 * Get interest rates based on loan type
 */
export function getInterestRateByType(loanType: string): number {
  const rates: Record<string, number> = {
    PERSONAL: 10.0,    // 10% the entire loan amount
    BUSINESS: 15.0,    // 15% the entire loan amount
    EMERGENCY: 10.0,    // 10% the entire loan amount
    EDUCATION: 10.0,   // 10% the entire loan amount
    MEDICAL: 10.0,      // 10% the entire loan amount
  };
  
  return rates[loanType] || 10.0; // Default to 10%
}

/**
 * Get maximum loan term based on loan type
 */
export function getMaxTermByType(loanType: string): number {
  const maxTerms: Record<string, number> = {
    PERSONAL: 6,      // 6 months
    BUSINESS: 3,      // 3 months
    EMERGENCY: 1,     // 1 month
    EDUCATION: 4,     // 4 months
    MEDICAL: 6,       // 6 months
  };
  
  return maxTerms[loanType] || 6; // Default to 6 months
}

/**
 * Get maximum loan amount based on loan type
 */
export function getMaxAmountByType(loanType: string): number {
  const maxAmounts: Record<string, number> = {
    PERSONAL: 10000,     // ₱10,000 max
    BUSINESS: 25000,    // ₱25,000 max
    EMERGENCY: 50000,    // ₱50,000 max
    EDUCATION: 10000,    // ₱10,000 max
    MEDICAL: 20000,      // ₱20,000 max
  };
  
  return maxAmounts[loanType] || 10000; // Default to ₱10,000
}

/**
 * Format currency for Philippine Peso
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(amount);
}

/**
 * Convert Prisma Decimal to number
 */
export function decimalToNumber(decimal: Decimal): number {
  return parseFloat(decimal.toString());
}
