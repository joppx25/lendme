"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, DollarSign, Clock, FileText, CreditCard } from "lucide-react";
import { LoanStatus, LoanType } from "@/generated/prisma";
import { formatCurrency } from "@/lib/loanUtils";
import { RequirementFilesView } from "./RequirementFilesView";
import { UploadedFile } from "@/lib/fileUpload";

interface Loan {
  id: string;
  loanNumber: string;
  loanType: LoanType;
  principalAmount: number;
  interestRate: number;
  termMonths: number;
  monthlyPayment: number;
  totalAmount: number;
  remainingBalance: number;
  status: LoanStatus;
  purpose: string;
  collateral?: string | null;
  requirementFiles?: UploadedFile[];
  startDate?: Date | null;
  endDate?: Date | null;
  requestedAt: Date;
  approvedAt?: Date | null;
  rejectedAt?: Date | null;
  rejectionReason?: string | null;
  payments: Array<{
    id: string;
    paymentNumber: number;
    scheduledAmount: number;
    paidAmount: number;
    scheduledDate: Date;
    paidDate?: Date | null;
    status: string;
  }>;
}

interface MyLoansViewProps {
  loans: Loan[];
}

export function MyLoansView({ loans }: MyLoansViewProps) {
  const getStatusColor = (status: LoanStatus) => {
    switch (status) {
      case 'PENDING':
        return 'secondary';
      case 'UNDER_REVIEW':
        return 'secondary';
      case 'APPROVED':
        return 'default';
      case 'ACTIVE':
        return 'default';
      case 'COMPLETED':
        return 'outline';
      case 'OVERDUE':
        return 'destructive';
      case 'DEFAULTED':
        return 'destructive';
      case 'REJECTED':
        return 'destructive';
      case 'CANCELLED':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getLoanTypeIcon = (type: LoanType) => {
    switch (type) {
      case 'PERSONAL':
        return '👤';
      case 'BUSINESS':
        return '🏢';
      case 'EMERGENCY':
        return '🚨';
      case 'EDUCATION':
        return '🎓';
      case 'MEDICAL':
        return '🏥';
      case 'AGRICULTURE':
        return '🌾';
      default:
        return '📄';
    }
  };

  const getNextPayment = (loan: Loan) => {
    const nextPayment = loan.payments.find(p => p.status === 'PENDING');
    return nextPayment;
  };

  if (loans.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <CreditCard className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Loans Yet</h3>
          <p className="text-muted-foreground mb-4">
            You haven&apos;t applied for any loans yet. Start your loan application today.
          </p>
          <Button asChild>
            <a href="/apply-loan">Apply for Your First Loan</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Loan Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <div>
                <p className="text-xs text-muted-foreground">Total Loans</p>
                <p className="text-lg font-bold">{loans.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-yellow-600" />
              <div>
                <p className="text-xs text-muted-foreground">Active Loans</p>
                <p className="text-lg font-bold">
                  {loans.filter(l => l.status === 'ACTIVE').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-4 h-4 text-green-600" />
              <div>
                <p className="text-xs text-muted-foreground">Total Borrowed</p>
                <p className="text-lg font-bold">
                  {formatCurrency(
                    loans
                      .filter(l => ['APPROVED', 'ACTIVE', 'COMPLETED'].includes(l.status))
                      .reduce((sum, l) => sum + l.principalAmount, 0)
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-purple-600" />
              <div>
                <p className="text-xs text-muted-foreground">Outstanding</p>
                <p className="text-lg font-bold">
                  {formatCurrency(
                    loans
                      .filter(l => l.status === 'ACTIVE')
                      .reduce((sum, l) => sum + l.remainingBalance, 0)
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Loans List */}
      <div className="space-y-4">
        {loans.map((loan) => {
          const nextPayment = getNextPayment(loan);
          
          return (
            <Card key={loan.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getLoanTypeIcon(loan.loanType)}</span>
                    <div>
                      <CardTitle className="text-lg">{loan.loanNumber}</CardTitle>
                      <CardDescription>
                        {loan.loanType.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())} Loan
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant={getStatusColor(loan.status)}>
                    {loan.status.replace('_', ' ')}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium">Loan Details</p>
                    <div className="mt-2 space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Principal:</span>
                        <span>{formatCurrency(loan.principalAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Interest Rate:</span>
                        <span>{loan.interestRate}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Term:</span>
                        <span>{loan.termMonths} months</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Monthly Payment:</span>
                        <span className="font-medium">{formatCurrency(loan.monthlyPayment)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium">Financial Status</p>
                    <div className="mt-2 space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Amount:</span>
                        <span>{formatCurrency(loan.totalAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Remaining:</span>
                        <span className="font-medium">{formatCurrency(loan.remainingBalance)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Paid:</span>
                        <span className="text-green-600">
                          {formatCurrency(loan.totalAmount - loan.remainingBalance)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium">Timeline</p>
                    <div className="mt-2 space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Applied:</span>
                        <span>{loan.requestedAt.toLocaleDateString()}</span>
                      </div>
                      {loan.approvedAt && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Approved:</span>
                          <span>{loan.approvedAt.toLocaleDateString()}</span>
                        </div>
                      )}
                      {loan.startDate && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Start Date:</span>
                          <span>{loan.startDate.toLocaleDateString()}</span>
                        </div>
                      )}
                      {loan.endDate && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">End Date:</span>
                          <span>{loan.endDate.toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Purpose */}
                <div>
                  <p className="text-sm font-medium mb-1">Purpose</p>
                  <p className="text-sm text-muted-foreground">{loan.purpose}</p>
                </div>
                
                {/* Collateral */}
                {loan.collateral && (
                  <div>
                    <p className="text-sm font-medium mb-1">Collateral</p>
                    <p className="text-sm text-muted-foreground">{loan.collateral}</p>
                  </div>
                )}
                
                {/* Rejection Reason */}
                {loan.status === 'REJECTED' && loan.rejectionReason && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm font-medium text-red-800 mb-1">Rejection Reason</p>
                    <p className="text-sm text-red-600">{loan.rejectionReason}</p>
                  </div>
                )}
                
                {/* Next Payment */}
                {loan.status === 'ACTIVE' && nextPayment && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-blue-800">Next Payment Due</p>
                        <p className="text-sm text-blue-600">
                          {formatCurrency(nextPayment.scheduledAmount)} due on{' '}
                          {nextPayment.scheduledDate.toLocaleDateString()}
                        </p>
                      </div>
                      <Button size="sm">
                        Make Payment
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* Payment Progress */}
                {loan.status === 'ACTIVE' && (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-sm font-medium">Payment Progress</p>
                      <p className="text-xs text-muted-foreground">
                        {loan.payments.filter(p => p.status === 'PAID').length} of {loan.payments.length} payments
                      </p>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ 
                          width: `${(loan.payments.filter(p => p.status === 'PAID').length / loan.payments.length) * 100}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Requirement Files */}
                <RequirementFilesView 
                  files={loan.requirementFiles ? JSON.parse(loan.requirementFiles as unknown as string) as UploadedFile[] : null}
                  loanNumber={loan.loanNumber}
                  borrowerName="You"
                />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
