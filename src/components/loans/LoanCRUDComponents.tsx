"use client";

import { useState, useActionState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Plus,
  Edit2,
  Trash2,
  Loader2,
  X,
  Check,
  User,
  AlertCircle
} from "lucide-react";
import { LoanType, LoanStatus, Role } from "@/generated/prisma";
import { formatCurrency, getInterestRateByType, getMaxAmountByType, getMaxTermByType, calculateSimpleInterestLoan } from "@/lib/loanUtils";
import { createLoanForUser, updateLoan, deleteLoan, getUsersForLoanCreation } from "@/app/loans/crud-actions";

interface User {
  id: string;
  name: string;
  email: string;
  phoneNo: string;
  role: Role;
}

interface LoanData {
  id: string;
  loanNumber: string;
  borrower: {
    id: string;
    name: string;
    email: string;
    phoneNo: string;
    address: string;
    role?: Role;
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
  collateral?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
}

const loanTypes = [
  { value: LoanType.PERSONAL, label: "Personal Loan", icon: "👤" },
  { value: LoanType.BUSINESS, label: "Business Loan", icon: "🏢" },
  { value: LoanType.EMERGENCY, label: "Emergency Loan", icon: "🚨" },
  { value: LoanType.EDUCATION, label: "Education Loan", icon: "🎓" },
  { value: LoanType.MEDICAL, label: "Medical Loan", icon: "🏥" },
  { value: LoanType.AGRICULTURE, label: "Agriculture Loan", icon: "🌾" },
];

const loanStatuses = [
  { value: LoanStatus.PENDING, label: "Pending" },
  { value: LoanStatus.UNDER_REVIEW, label: "Under Review" },
  { value: LoanStatus.APPROVED, label: "Approved" },
  { value: LoanStatus.ACTIVE, label: "Active" },
  { value: LoanStatus.COMPLETED, label: "Completed" },
  { value: LoanStatus.OVERDUE, label: "Overdue" },
  { value: LoanStatus.DEFAULTED, label: "Defaulted" },
  { value: LoanStatus.REJECTED, label: "Rejected" },
  { value: LoanStatus.CANCELLED, label: "Cancelled" },
];

interface CreateLoanState {
  success: boolean;
  message?: string;
  errors?: {
    borrowerId?: string[];
    principalAmount?: string[];
    loanType?: string[];
    termMonths?: string[];
    interestRate?: string[];
    purpose?: string[];
    collateral?: string[];
  };
}

interface CreateLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateLoanModal({ isOpen, onClose, onSuccess }: CreateLoanModalProps) {
  const [state, formAction, pending] = useActionState<CreateLoanState, FormData>(createLoanForUser, { success: false, message: '' });
  const [selectedLoanType, setSelectedLoanType] = useState<LoanType>(LoanType.PERSONAL);
  const [principalAmount, setPrincipalAmount] = useState('');
  const [termMonths, setTermMonths] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      // Fetch users when modal opens
      getUsersForLoanCreation().then((result) => {
        if (result.success) {
          setUsers(result.users);
        }
        setLoading(false);
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (state.success) {
      onSuccess();
      onClose();
    }
  }, [state.success, onSuccess, onClose]);

  const maxAmount = getMaxAmountByType(selectedLoanType);
  const maxTerm = getMaxTermByType(selectedLoanType);
  const interestRate = getInterestRateByType(selectedLoanType);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Create New Loan</CardTitle>
              <CardDescription>Create a loan for any user in the system</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            {/* Borrower Selection */}
            <div className="space-y-2">
              <Label htmlFor="borrowerId">Select Borrower</Label>
              {loading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Loading users...</span>
                </div>
              ) : users.length === 0 ? (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-800 font-medium">No eligible users found</p>
                  <p className="text-xs text-yellow-600 mt-1">
                    This could be because all users already have active loans, or they don&apos;t have the right status/role.
                  </p>
                </div>
              ) : (
                <select
                  id="borrowerId"
                  name="borrowerId"
                  className="w-full p-2 border rounded-md"
                  required
                >
                  <option value="">Select a user ({users.length} available)</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email}) - {user.role}
                    </option>
                  ))}
                </select>
              )}
              {state.errors?.borrowerId && (
                <p className="text-sm text-red-500">{state.errors.borrowerId[0]}</p>
              )}
            </div>

            {/* Loan Type */}
            <div className="space-y-2">
              <Label htmlFor="loanType">Loan Type</Label>
              <select
                id="loanType"
                name="loanType"
                value={selectedLoanType}
                onChange={(e) => setSelectedLoanType(e.target.value as LoanType)}
                className="w-full p-2 border rounded-md"
                required
              >
                {loanTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Loan Details Info */}
            <div className="bg-blue-50 p-3 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Loan Type Details</h4>
              <div className="text-sm text-blue-800 space-y-1">
                <p>• Maximum Amount: {formatCurrency(maxAmount)}</p>
                <p>• Maximum Term: {maxTerm} months</p>
                <p>• Interest Rate: {interestRate}% for entire term</p>
              </div>
            </div>

            {/* Principal Amount */}
            <div className="space-y-2">
              <Label htmlFor="principalAmount">Principal Amount (₱)</Label>
              <Input
                id="principalAmount"
                name="principalAmount"
                type="number"
                min="1000"
                max={maxAmount}
                step="100"
                value={principalAmount}
                onChange={(e) => setPrincipalAmount(e.target.value)}
                placeholder="Enter loan amount"
                required
              />
              {state.errors?.principalAmount && (
                <p className="text-sm text-red-500">{state.errors.principalAmount[0]}</p>
              )}
            </div>

            {/* Term */}
            <div className="space-y-2">
              <Label htmlFor="termMonths">Term (Months)</Label>
              <Input
                id="termMonths"
                name="termMonths"
                type="number"
                min="1"
                max={maxTerm}
                value={termMonths}
                onChange={(e) => setTermMonths(e.target.value)}
                placeholder="Enter loan term in months"
                required
              />
              {state.errors?.termMonths && (
                <p className="text-sm text-red-500">{state.errors.termMonths[0]}</p>
              )}
            </div>

            {/* Loan Calculation Breakdown */}
            {principalAmount && termMonths && parseFloat(principalAmount) > 0 && parseInt(termMonths) > 0 && (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="font-medium text-green-900 mb-3 flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  Loan Calculation Breakdown
                </h4>
                {(() => {
                  const requestedAmount = parseFloat(principalAmount);
                  const term = parseInt(termMonths);
                  const rate = interestRate;
                  const loanCalc = calculateSimpleInterestLoan(requestedAmount, rate, term);
                  const monthlyPayment = loanCalc.monthlyPayment;
                  const totalPayable = loanCalc.totalAmount;
                  const totalInterest = loanCalc.totalInterest;
                  
                  // OPTION 1: Release full requested amount (borrower gets what they asked for)
                  // const amountToRelease = requestedAmount;
                  
                  // OPTION 2: Release amount minus interest (borrower gets less but pays same monthly)
                  const amountToRelease = Math.max(0, requestedAmount - totalInterest);
                  
                  return (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-green-700">Requested Amount:</span>
                            <span className="font-medium text-green-900">{formatCurrency(requestedAmount)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-green-700">Interest Rate:</span>
                            <span className="font-medium text-green-900">{rate}% for entire term</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-green-700">Term:</span>
                            <span className="font-medium text-green-900">{term} months</span>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-green-700">Monthly Payment:</span>
                            <span className="font-medium text-green-900">{formatCurrency(monthlyPayment)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-green-700">Total Interest:</span>
                            <span className="font-medium text-green-900">{formatCurrency(totalInterest)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-green-700">Total Payable:</span>
                            <span className="font-medium text-green-900">{formatCurrency(totalPayable)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="border-t border-green-300 pt-3 mt-3">
                        <div className="bg-green-100 p-3 rounded-md space-y-2">
                          <h5 className="font-medium text-green-800">Amount Calculation:</h5>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-green-700">Requested Amount:</span>
                              <span className="font-medium text-green-900">{formatCurrency(requestedAmount)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-green-700">Less: Total Interest:</span>
                              <span className="font-medium text-red-700">-{formatCurrency(totalInterest)}</span>
                            </div>
                            <div className="border-t border-green-300 pt-1 mt-1">
                              <div className="flex justify-between items-center">
                                <span className="font-semibold text-green-800 text-lg">Net Amount to Release:</span>
                                <span className="font-bold text-green-900 text-xl">{formatCurrency(amountToRelease)}</span>
                              </div>
                            </div>
                          </div>
                          {amountToRelease <= requestedAmount * 0.1 ? (
                            <p className="text-xs text-red-700 mt-2 bg-red-50 p-2 rounded border border-red-300">
                              ⚠️ <strong>Warning:</strong> The amount to release ({formatCurrency(amountToRelease)}) is very low compared to the requested amount. Consider adjusting the loan terms.
                            </p>
                          ) : (
                            <p className="text-xs text-green-700 mt-2 bg-green-50 p-2 rounded">
                              💡 <strong>How it works:</strong> Borrower receives {formatCurrency(amountToRelease)} but still pays monthly installments of {formatCurrency(monthlyPayment)} for {term} months (total: {formatCurrency(totalPayable)})
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Purpose */}
            <div className="space-y-2">
              <Label htmlFor="purpose">Purpose</Label>
              <Textarea
                id="purpose"
                name="purpose"
                placeholder="Describe the purpose of this loan (minimum 10 characters)"
                rows={3}
                required
              />
              {state.errors?.purpose && (
                <p className="text-sm text-red-500">{state.errors.purpose[0]}</p>
              )}
            </div>

            {/* Collateral */}
            <div className="space-y-2">
              <Label htmlFor="collateral">Collateral (Optional)</Label>
              <Textarea
                id="collateral"
                name="collateral"
                placeholder="Describe any collateral for this loan"
                rows={2}
              />
            </div>

            {/* Auto Approve */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="autoApprove"
                name="autoApprove"
                value="true"
                className="rounded"
              />
              <Label htmlFor="autoApprove">Auto-approve loan (if sufficient funds available)</Label>
            </div>

            {/* Error Message */}
            {!state.success && state.message && (
              <div className="flex items-center space-x-2 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{state.message}</span>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex space-x-2 pt-4">
              <Button type="submit" disabled={pending} className="flex-1">
                {pending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Loan
                  </>
                )}
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

interface UpdateLoanState {
  success: boolean;
  message?: string;
  errors?: {
    loanId?: string[];
    principalAmount?: string[];
    loanType?: string[];
    termMonths?: string[];
    interestRate?: string[];
    purpose?: string[];
    collateral?: string[];
    status?: string[];
  };
}

interface EditLoanModalProps {
  loan: LoanData;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditLoanModal({ loan, isOpen, onClose, onSuccess }: EditLoanModalProps) {
  const [state, formAction, pending] = useActionState<UpdateLoanState, FormData>(updateLoan, { success: false, message: '' });
  const [editAmount, setEditAmount] = useState(loan.principalAmount.toString());
  const [editTerm, setEditTerm] = useState(loan.termMonths.toString());
  const [editLoanType, setEditLoanType] = useState(loan.loanType);

  useEffect(() => {
    if (state.success) {
      onSuccess();
      onClose();
    }
  }, [state.success, onSuccess, onClose]);

  if (!isOpen) return null;

  const canEditAmountAndTerms = ['PENDING', 'UNDER_REVIEW'].includes(loan.status);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Edit Loan</CardTitle>
              <CardDescription>
                Editing loan {loan.loanNumber} for {loan.borrower.name}
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="loanId" value={loan.id} />

            {/* Borrower Info (Read-only) */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span className="font-medium">{loan.borrower.name}</span>
                <span className="text-gray-500">({loan.borrower.email})</span>
              </div>
            </div>

            {/* Loan Type */}
            {canEditAmountAndTerms && (
              <div className="space-y-2">
                <Label htmlFor="loanType">Loan Type</Label>
                <select
                  id="loanType"
                  name="loanType"
                  value={editLoanType}
                  onChange={(e) => setEditLoanType(e.target.value as LoanType)}
                  className="w-full p-2 border rounded-md"
                >
                  {loanTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Principal Amount */}
            {canEditAmountAndTerms && (
              <div className="space-y-2">
                <Label htmlFor="principalAmount">Principal Amount (₱)</Label>
                <Input
                  id="principalAmount"
                  name="principalAmount"
                  type="number"
                  min="1000"
                  step="100"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                />
                {state.errors?.principalAmount && (
                  <p className="text-sm text-red-500">{state.errors.principalAmount[0]}</p>
                )}
              </div>
            )}

            {/* Term */}
            {canEditAmountAndTerms && (
              <div className="space-y-2">
                <Label htmlFor="termMonths">Term (Months)</Label>
                <Input
                  id="termMonths"
                  name="termMonths"
                  type="number"
                  min="1"
                  max="60"
                  value={editTerm}
                  onChange={(e) => setEditTerm(e.target.value)}
                />
                {state.errors?.termMonths && (
                  <p className="text-sm text-red-500">{state.errors.termMonths[0]}</p>
                )}
              </div>
            )}

            {/* Loan Calculation Breakdown for Edit */}
            {canEditAmountAndTerms && editAmount && editTerm && parseFloat(editAmount) > 0 && parseInt(editTerm) > 0 && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-3 flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  Updated Loan Calculation
                </h4>
                {(() => {
                  const requestedAmount = parseFloat(editAmount);
                  const term = parseInt(editTerm);
                  const rate = getInterestRateByType(editLoanType);
                  const loanCalc = calculateSimpleInterestLoan(requestedAmount, rate, term);
                  const monthlyPayment = loanCalc.monthlyPayment;
                  const totalPayable = loanCalc.totalAmount;
                  const totalInterest = loanCalc.totalInterest;
                  const amountToRelease = Math.max(0, requestedAmount - totalInterest);
                  
                  return (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-blue-700">Requested Amount:</span>
                            <span className="font-medium text-blue-900">{formatCurrency(requestedAmount)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-blue-700">Interest Rate:</span>
                            <span className="font-medium text-blue-900">{rate}% for entire term</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-blue-700">Term:</span>
                            <span className="font-medium text-blue-900">{term} months</span>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-blue-700">Monthly Payment:</span>
                            <span className="font-medium text-blue-900">{formatCurrency(monthlyPayment)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-blue-700">Total Interest:</span>
                            <span className="font-medium text-blue-900">{formatCurrency(totalInterest)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-blue-700">Total Payable:</span>
                            <span className="font-medium text-blue-900">{formatCurrency(totalPayable)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="border-t border-blue-300 pt-3 mt-3">
                        <div className="bg-blue-100 p-3 rounded-md space-y-2">
                          <h5 className="font-medium text-blue-800">Amount Calculation:</h5>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-blue-700">Requested Amount:</span>
                              <span className="font-medium text-blue-900">{formatCurrency(requestedAmount)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-blue-700">Less: Total Interest:</span>
                              <span className="font-medium text-red-700">-{formatCurrency(totalInterest)}</span>
                            </div>
                            <div className="border-t border-blue-300 pt-1 mt-1">
                              <div className="flex justify-between items-center">
                                <span className="font-semibold text-blue-800 text-lg">Net Amount to Release:</span>
                                <span className="font-bold text-blue-900 text-xl">{formatCurrency(amountToRelease)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Purpose */}
            <div className="space-y-2">
              <Label htmlFor="purpose">Purpose</Label>
              <Textarea
                id="purpose"
                name="purpose"
                defaultValue={loan.purpose}
                rows={3}
              />
              {state.errors?.purpose && (
                <p className="text-sm text-red-500">{state.errors.purpose[0]}</p>
              )}
            </div>

            {/* Collateral */}
            <div className="space-y-2">
              <Label htmlFor="collateral">Collateral</Label>
              <Textarea
                id="collateral"
                name="collateral"
                defaultValue={loan.collateral || ''}
                rows={2}
              />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                name="status"
                defaultValue={loan.status}
                className="w-full p-2 border rounded-md"
              >
                {loanStatuses.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Warning for amount/term changes */}
            {!canEditAmountAndTerms && (
              <div className="bg-yellow-50 p-3 rounded-lg">
                <div className="flex items-center space-x-2 text-yellow-800">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">
                    Amount and term changes are only allowed for pending loans
                  </span>
                </div>
              </div>
            )}

            {/* Error Message */}
            {!state.success && state.message && (
              <div className="flex items-center space-x-2 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{state.message}</span>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex space-x-2 pt-4">
              <Button type="submit" disabled={pending} className="flex-1">
                {pending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Update Loan
                  </>
                )}
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

interface DeleteLoanButtonProps {
  loan: LoanData;
  onSuccess: () => void;
}

export function DeleteLoanButton({ loan, onSuccess }: DeleteLoanButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const canDelete = ['PENDING', 'UNDER_REVIEW', 'REJECTED', 'CANCELLED'].includes(loan.status);

  if (!canDelete) {
    return null;
  }

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const result = await deleteLoan(loan.id);
      if (result.success) {
        onSuccess();
      } else {
        alert(result.message);
      }
    } catch (error) {
      alert(`Failed to delete loan, ${error}`);
    } finally {
      setDeleting(false);
      setShowConfirm(false);
    }
  };

  if (showConfirm) {
    return (
      <div className="flex items-center space-x-2">
        <span className="text-sm text-red-600">Delete {loan.loanNumber}?</span>
        <Button
          size="sm"
          variant="destructive"
          onClick={handleDelete}
          disabled={deleting}
        >
          {deleting ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Check className="w-3 h-3" />
          )}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowConfirm(false)}
        >
          <X className="w-3 h-3" />
        </Button>
      </div>
    );
  }

  return (
    <Button
      size="sm"
      variant="destructive"
      onClick={() => setShowConfirm(true)}
      className="h-8 w-8 p-0"
    >
      <Trash2 className="w-3 h-3" />
    </Button>
  );
}

interface LoanActionsProps {
  loan: LoanData;
  onEdit: () => void;
  onSuccess: () => void;
  currentUserRole?: Role;
}

export function LoanActions({ loan, onEdit, onSuccess, currentUserRole }: LoanActionsProps) {
  // Check if manager trying to manage superadmin loan
  const canManage = !(currentUserRole === 'MANAGER' && loan.borrower.role === 'SUPERADMIN');
  
  if (!canManage) {
    return null; // Don't show actions for restricted loans
  }

  return (
    <div className="flex items-center space-x-2">
      <Button
        size="sm"
        variant="outline"
        onClick={onEdit}
        className="h-8 w-8 p-0"
      >
        <Edit2 className="w-3 h-3" />
      </Button>
      <DeleteLoanButton loan={loan} onSuccess={onSuccess} />
    </div>
  );
}
