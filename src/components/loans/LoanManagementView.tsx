"use client";

import { useState, useActionState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  FileText,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp,
  Users,
  Calendar,
  Eye,
  Check,
  X,
  Loader2,
  Filter,
  Search
} from "lucide-react";
import { LoanStatus, LoanType, PaymentStatus } from "@/generated/prisma";
import { formatCurrency } from "@/lib/loanUtils";
import { manageLoan, setLoanUnderReview } from "@/app/loans/management-actions";

interface LoanData {
  id: string;
  loanNumber: string;
  borrower: {
    id: string;
    name: string;
    email: string;
    phoneNo: string;
    address: string;
  };
  approver?: {
    id: string;
    name: string;
    email: string;
  } | null;
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

interface LoanStatistic {
  status: LoanStatus;
  count: number;
  totalAmount: number;
  remainingBalance: number;
}

interface FundBalance {
  id: string;
  totalFunds: number;
  availableFunds: number;
  loanedFunds: number;
  totalContributions: number;
  totalRepayments: number;
  lastUpdated: Date;
}

interface LoanManagementViewProps {
  loans: LoanData[];
  statistics: LoanStatistic[];
  fundBalance?: FundBalance | null;
  currentUserId: string;
}

export function LoanManagementView({ loans, statistics, fundBalance, currentUserId }: LoanManagementViewProps) {
  const [selectedLoan, setSelectedLoan] = useState<LoanData | null>(null);
  const [filterStatus, setFilterStatus] = useState<LoanStatus | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve');
  const [state, formAction, pending] = useActionState(manageLoan, { success: false, message: '' });

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

  // Filter loans based on status and search term
  const filteredLoans = loans.filter(loan => {
    const matchesStatus = filterStatus === 'ALL' || loan.status === filterStatus;
    const matchesSearch = searchTerm === '' || 
      loan.loanNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.borrower.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.borrower.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  const handleApproval = (loan: LoanData, action: 'approve' | 'reject') => {
    setSelectedLoan(loan);
    setApprovalAction(action);
    setShowApprovalModal(true);
  };

  const handleSetUnderReview = async (loanId: string) => {
    try {
      await setLoanUnderReview(loanId);
    } catch (error) {
      console.error('Failed to set loan under review:', error);
    }
  };

  // Calculate statistics
  const totalLoans = loans.length;
  const pendingLoans = loans.filter(l => l.status === 'PENDING').length;
  const activeLoans = loans.filter(l => l.status === 'ACTIVE').length;
  const totalLoanedAmount = loans
    .filter(l => ['APPROVED', 'ACTIVE', 'COMPLETED'].includes(l.status))
    .reduce((sum, l) => sum + l.principalAmount, 0);

  if (state?.success) {
    setShowApprovalModal(false);
    setSelectedLoan(null);
    // The page will be revalidated automatically
  }

  return (
    <div className="space-y-6">
      {/* Fund Balance and Statistics */}
      {fundBalance && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-green-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Available Funds</p>
                  <p className="text-lg font-bold">{formatCurrency(fundBalance.availableFunds)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Total Loaned</p>
                  <p className="text-lg font-bold">{formatCurrency(fundBalance.loanedFunds)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-purple-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Active Loans</p>
                  <p className="text-lg font-bold">{activeLoans}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-orange-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Pending</p>
                  <p className="text-lg font-bold">{pendingLoans}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="search">Search Loans</Label>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by loan number, borrower name, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            <div className="min-w-[150px]">
              <Label htmlFor="status">Status Filter</Label>
              <select
                id="status"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as LoanStatus | 'ALL')}
                className="flex mt-2 h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="ALL">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="APPROVED">Approved</option>
                <option value="ACTIVE">Active</option>
                <option value="COMPLETED">Completed</option>
                <option value="OVERDUE">Overdue</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loans List */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            All Loans ({filteredLoans.length})
          </h2>
        </div>

        {filteredLoans.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Loans Found</h3>
              <p className="text-muted-foreground">
                {searchTerm || filterStatus !== 'ALL' 
                  ? "No loans match your current filters."
                  : "No loan applications have been submitted yet."
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredLoans.map((loan) => (
              <Card key={loan.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <span className="text-2xl">{getLoanTypeIcon(loan.loanType)}</span>
                      <div>
                        <h3 className="font-semibold text-lg">{loan.loanNumber}</h3>
                        <p className="text-sm text-muted-foreground">
                          {loan.borrower.name} • {loan.borrower.email}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Applied: {loan.requestedAt.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={getStatusColor(loan.status)}>
                        {loan.status.replace('_', ' ')}
                      </Badge>
                      {['PENDING', 'UNDER_REVIEW'].includes(loan.status) && (
                        <div className="flex space-x-1">
                          {loan.status === 'PENDING' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSetUnderReview(loan.id)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Review
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleApproval(loan, 'approve')}
                            className="text-green-600 hover:bg-green-50"
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleApproval(loan, 'reject')}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <X className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm font-medium mb-2">Loan Details</p>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Type:</span>
                          <span>{loan.loanType.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Amount:</span>
                          <span className="font-medium">{formatCurrency(loan.principalAmount)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Term:</span>
                          <span>{loan.termMonths} months</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Interest:</span>
                          <span>{loan.interestRate}%</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium mb-2">Financial</p>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Monthly Payment:</span>
                          <span className="font-medium">{formatCurrency(loan.monthlyPayment)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Amount:</span>
                          <span>{formatCurrency(loan.totalAmount)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Remaining:</span>
                          <span>{formatCurrency(loan.remainingBalance)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium mb-2">Borrower Info</p>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Phone:</span>
                          <span>{loan.borrower.phoneNo}</span>
                        </div>
                        <div className="text-muted-foreground">
                          <span>Address:</span>
                          <p className="text-xs mt-1 break-words">{loan.borrower.address}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div>
                    <p className="text-sm font-medium mb-2">Purpose</p>
                    <p className="text-sm text-muted-foreground">{loan.purpose}</p>
                  </div>
                  
                  {loan.collateral && (
                    <div className="mt-2">
                      <p className="text-sm font-medium mb-1">Collateral</p>
                      <p className="text-sm text-muted-foreground">{loan.collateral}</p>
                    </div>
                  )}
                  
                  {loan.rejectionReason && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm font-medium text-red-800 mb-1">Rejection Reason</p>
                      <p className="text-sm text-red-600">{loan.rejectionReason}</p>
                    </div>
                  )}
                  
                  {loan.approver && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                      <p className="text-sm font-medium text-green-800">
                        Approved by: {loan.approver.name} on {loan.approvedAt?.toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Approval/Rejection Modal */}
      {showApprovalModal && selectedLoan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>
                {approvalAction === 'approve' ? 'Approve Loan' : 'Reject Loan'}
              </CardTitle>
              <CardDescription>
                {approvalAction === 'approve' 
                  ? `Approve loan ${selectedLoan.loanNumber} for ${selectedLoan.borrower.name}`
                  : `Reject loan ${selectedLoan.loanNumber} for ${selectedLoan.borrower.name}`
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={formAction} className="space-y-4">
                <input type="hidden" name="loanId" value={selectedLoan.id} />
                <input type="hidden" name="action" value={approvalAction} />
                
                {approvalAction === 'approve' && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                    <h4 className="font-medium text-blue-800 mb-2">Loan Summary</h4>
                    <div className="space-y-1 text-sm text-blue-600">
                      <p>Amount: {formatCurrency(selectedLoan.principalAmount)}</p>
                      <p>Monthly Payment: {formatCurrency(selectedLoan.monthlyPayment)}</p>
                      <p>Term: {selectedLoan.termMonths} months</p>
                    </div>
                  </div>
                )}
                
                {approvalAction === 'reject' && (
                  <div className="space-y-2">
                    <Label htmlFor="rejectionReason">Rejection Reason *</Label>
                    <Textarea
                      id="rejectionReason"
                      name="rejectionReason"
                      placeholder="Please provide a detailed reason for rejection..."
                      rows={4}
                      required
                    />
                    {state?.errors?.rejectionReason && (
                      <p className="text-sm text-red-500">{state.errors.rejectionReason[0]}</p>
                    )}
                  </div>
                )}
                
                {state?.message && !state?.success && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600">{state.message}</p>
                  </div>
                )}
                
                <div className="flex space-x-3">
                  <Button 
                    type="submit" 
                    disabled={pending}
                    className={approvalAction === 'approve' ? '' : 'bg-red-600 hover:bg-red-700'}
                  >
                    {pending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        {approvalAction === 'approve' ? (
                          <Check className="w-4 h-4 mr-2" />
                        ) : (
                          <X className="w-4 h-4 mr-2" />
                        )}
                        {approvalAction === 'approve' ? 'Approve Loan' : 'Reject Loan'}
                      </>
                    )}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => {
                      setShowApprovalModal(false);
                      setSelectedLoan(null);
                    }}
                    disabled={pending}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
