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
 * Calculate loan payment details using simple interest
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
    PERSONAL: 12.0,    // 12% annual
    BUSINESS: 15.0,    // 15% annual
    EMERGENCY: 8.0,    // 8% annual (lower for emergencies)
    EDUCATION: 10.0,   // 10% annual
    MEDICAL: 8.0,      // 8% annual (lower for medical)
    AGRICULTURE: 14.0, // 14% annual
  };
  
  return rates[loanType] || 12.0; // Default to 12%
}

/**
 * Get maximum loan term based on loan type
 */
export function getMaxTermByType(loanType: string): number {
  const maxTerms: Record<string, number> = {
    PERSONAL: 36,      // 3 years max
    BUSINESS: 60,      // 5 years max
    EMERGENCY: 12,     // 1 year max
    EDUCATION: 48,     // 4 years max
    MEDICAL: 24,       // 2 years max
    AGRICULTURE: 36,   // 3 years max
  };
  
  return maxTerms[loanType] || 36; // Default to 3 years
}

/**
 * Get maximum loan amount based on loan type
 */
export function getMaxAmountByType(loanType: string): number {
  const maxAmounts: Record<string, number> = {
    PERSONAL: 500000,     // ₱500,000 max
    BUSINESS: 1000000,    // ₱1,000,000 max
    EMERGENCY: 100000,    // ₱100,000 max
    EDUCATION: 300000,    // ₱300,000 max
    MEDICAL: 200000,      // ₱200,000 max
    AGRICULTURE: 800000,  // ₱800,000 max
  };
  
  return maxAmounts[loanType] || 500000; // Default to ₱500,000
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
