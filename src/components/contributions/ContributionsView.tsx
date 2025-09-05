"use client";

import { useState, useActionState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  PiggyBank, 
  Plus, 
  DollarSign, 
  Calendar, 
  Receipt, 
  CreditCard,
  Loader2,
  Check,
  X
} from "lucide-react";
import { ContributionType, ContributionStatus, PaymentMethod, Role } from "@/generated/prisma";
import { formatCurrency } from "@/lib/loanUtils";
import { makeContribution, approveContribution, rejectContribution } from "@/app/contributions/actions";

interface Contribution {
  id: string;
  amount: number;
  contributionType: ContributionType;
  paymentMethod: PaymentMethod;
  receiptNumber?: string | null;
  description?: string | null;
  status: ContributionStatus;
  contributedAt: Date;
  processedAt?: Date | null;
  processedBy?: string | null;
  contributor: {
    id: string;
    name: string;
    email: string;
  };
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

interface ContributionsViewProps {
  contributions: Contribution[];
  fundBalance?: FundBalance | null;
  userRole: Role;
  availableUsers?: Array<{
    id: string;
    name: string;
    email: string;
    role: Role;
  }>;
}

const contributionTypes = [
  { 
    value: ContributionType.INITIAL_CAPITAL, 
    label: "Initial Capital", 
    description: "One-time initial fund contribution",
    icon: "🏦"
  },
  { 
    value: ContributionType.MONTHLY_SAVINGS, 
    label: "Monthly Savings", 
    description: "Regular monthly contribution",
    icon: "📅"
  },
  { 
    value: ContributionType.VOLUNTARY, 
    label: "Voluntary", 
    description: "Voluntary additional contribution",
    icon: "💝"
  },
  { 
    value: ContributionType.PROFIT_SHARING, 
    label: "Profit Sharing", 
    description: "Share of loan interest profits",
    icon: "📈"
  },
  { 
    value: ContributionType.SPECIAL_ASSESSMENT, 
    label: "Special Assessment", 
    description: "Special one-time contribution",
    icon: "⭐"
  },
];

const paymentMethods = [
  { value: PaymentMethod.CASH, label: "Cash" },
  { value: PaymentMethod.BANK_TRANSFER, label: "Bank Transfer" },
  { value: PaymentMethod.GCASH, label: "GCash" },
  { value: PaymentMethod.PAYMAYA, label: "PayMaya" },
  { value: PaymentMethod.CHECK, label: "Check" },
  { value: PaymentMethod.ONLINE_BANKING, label: "Online Banking" },
];

interface ContributionState {
  success: boolean;
  message?: string;
  errors?: {
    contributorId?: string[];
  };
}

export function ContributionsView({ contributions, fundBalance, userRole, availableUsers = [] }: ContributionsViewProps) {
  const [showForm, setShowForm] = useState(false);
  const [state, formAction, pending] = useActionState<ContributionState, FormData>(makeContribution, { success: false, message: '' });

  const getStatusColor = (status: ContributionStatus) => {
    switch (status) {
      case 'PENDING':
        return 'secondary';
      case 'PROCESSING':
        return 'secondary';
      case 'APPROVED':
        return 'default';
      case 'REJECTED':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const handleApprove = async (contributionId: string) => {
    try {
      await approveContribution(contributionId);
    } catch (error) {
      console.error('Failed to approve contribution:', error);
    }
  };

  const handleReject = async (contributionId: string) => {
    try {
      await rejectContribution(contributionId);
    } catch (error) {
      console.error('Failed to reject contribution:', error);
    }
  };

  const canMakeContribution = ['BORROWER', 'MANAGER', 'SUPERADMIN'].includes(userRole);
  const canManageContributions = ['MANAGER', 'SUPERADMIN'].includes(userRole);

  if (state?.success) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            ✅
          </div>
          <CardTitle className="text-2xl text-green-600">Contribution Submitted!</CardTitle>
          <CardDescription>
            Your contribution has been submitted successfully and is pending approval.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">{state.message}</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => window.location.reload()}>
              View Contributions
            </Button>
            <Button variant="outline" onClick={() => setShowForm(true)}>
              Make Another Contribution
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Fund Balance Summary (for managers/admins) */}
      {fundBalance && canManageContributions && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <PiggyBank className="w-4 h-4 text-blue-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Total Fund</p>
                  <p className="text-lg font-bold">{formatCurrency(fundBalance.totalFunds)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-green-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Available</p>
                  <p className="text-lg font-bold">{formatCurrency(fundBalance.availableFunds)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CreditCard className="w-4 h-4 text-orange-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Loaned Out</p>
                  <p className="text-lg font-bold">{formatCurrency(fundBalance.loanedFunds)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Plus className="w-4 h-4 text-purple-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Total Contributions</p>
                  <p className="text-lg font-bold">{formatCurrency(fundBalance.totalContributions)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Contribution Form */}
      {canMakeContribution && !showForm && (
        <Card>
          <CardContent className="p-6 text-center">
            <PiggyBank className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Make a Contribution</h3>
            <p className="text-muted-foreground mb-4">
              Contribute to the lending fund to help support community loans.
            </p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Make Contribution
            </Button>
          </CardContent>
        </Card>
      )}

      {showForm && canMakeContribution && (
        <Card>
          <CardHeader>
            <CardTitle>Make a Contribution</CardTitle>
            <CardDescription>
              Contribute to the community lending fund.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={formAction} className="space-y-4">
              {/* User Selector for Admins */}
              {canManageContributions && availableUsers.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="contributorId">Contributing for (Optional)</Label>
                  <select
                    id="contributorId"
                    name="contributorId"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">For myself</option>
                    {availableUsers.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.email}) - {user.role.toLowerCase()}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground">
                    Leave empty to create contribution for yourself, or select a user to create on their behalf.
                  </p>
                  {state?.errors?.contributorId && (
                    <p className="text-sm text-red-500">{state.errors.contributorId[0]}</p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Contribution Amount (₱)</Label>
                  <Input
                    id="amount"
                    name="amount"
                    type="number"
                    placeholder="Enter amount"
                    min="100"
                    step="100"
                    required
                  />
                  {state?.errors?.amount && (
                    <p className="text-sm text-red-500">{state.errors.amount[0]}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Payment Method</Label>
                  <select
                    id="paymentMethod"
                    name="paymentMethod"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    required
                  >
                    <option value="">Select payment method</option>
                    {paymentMethods.map(method => (
                      <option key={method.value} value={method.value}>
                        {method.label}
                      </option>
                    ))}
                  </select>
                  {state?.errors?.paymentMethod && (
                    <p className="text-sm text-red-500">{state.errors.paymentMethod[0]}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contributionType">Contribution Type</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {contributionTypes.map((type) => (
                    <div
                      key={type.value}
                      className="relative"
                    >
                      <input
                        type="radio"
                        id={type.value}
                        name="contributionType"
                        value={type.value}
                        className="peer sr-only"
                        required
                      />
                      <label
                        htmlFor={type.value}
                        className="flex items-start space-x-3 p-3 border rounded-lg cursor-pointer transition-all hover:border-blue-500 peer-checked:border-blue-500 peer-checked:bg-blue-50"
                      >
                        <span className="text-xl">{type.icon}</span>
                        <div>
                          <h4 className="font-medium text-sm">{type.label}</h4>
                          <p className="text-xs text-muted-foreground">{type.description}</p>
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
                {state?.errors?.contributionType && (
                  <p className="text-sm text-red-500">{state.errors.contributionType[0]}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="receiptNumber">Receipt Number (Optional)</Label>
                <Input
                  id="receiptNumber"
                  name="receiptNumber"
                  placeholder="Enter receipt or reference number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Add any additional notes..."
                  rows={3}
                />
              </div>

              {state?.message && !state?.success && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{state.message}</p>
                </div>
              )}

              <div className="flex gap-3">
                <Button type="submit" disabled={pending}>
                  {pending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <PiggyBank className="w-4 h-4 mr-2" />
                      Submit Contribution
                    </>
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Contributions List */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            {canManageContributions ? 'All Contributions' : 'My Contributions'}
          </h2>
          <div className="text-sm text-muted-foreground">
            {contributions.length} contribution{contributions.length !== 1 ? 's' : ''}
          </div>
        </div>

        {contributions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <PiggyBank className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Contributions Yet</h3>
              <p className="text-muted-foreground">
                {canMakeContribution 
                  ? "Start contributing to the fund today!"
                  : "No contributions have been made yet."
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {contributions.map((contribution) => (
              <Card key={contribution.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <PiggyBank className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold">{formatCurrency(contribution.amount)}</h3>
                          <Badge variant={getStatusColor(contribution.status)}>
                            {contribution.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {contribution.contributionType.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                          {canManageContributions && (
                            <> • {contribution.contributor.name}</>
                          )}
                        </p>
                        <div className="flex items-center space-x-4 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            {contribution.contributedAt.toLocaleDateString()}
                          </span>
                          <span className="flex items-center">
                            <CreditCard className="w-3 h-3 mr-1" />
                            {contribution.paymentMethod.replace('_', ' ')}
                          </span>
                          {contribution.receiptNumber && (
                            <span className="flex items-center">
                              <Receipt className="w-3 h-3 mr-1" />
                              {contribution.receiptNumber}
                            </span>
                          )}
                        </div>
                        {contribution.description && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {contribution.description}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {canManageContributions && contribution.status === 'PENDING' && (
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleApprove(contribution.id)}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReject(contribution.id)}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
