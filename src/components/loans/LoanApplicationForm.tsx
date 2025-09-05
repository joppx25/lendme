"use client";

import { useState, useActionState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Calculator, DollarSign, Calendar, FileText, Loader2, Upload, X, File } from "lucide-react";
import { applyForLoan } from "@/app/loans/actions";
import { LoanType } from "@/generated/prisma";
import { calculateSimpleInterestLoan, getInterestRateByType, getMaxAmountByType, getMaxTermByType, formatCurrency } from "@/lib/loanUtils";

const loanTypes = [
  { 
    value: LoanType.PERSONAL, 
    label: "Personal Loan", 
    description: "For personal needs and expenses",
    icon: "👤"
  },
  { 
    value: LoanType.BUSINESS, 
    label: "Business Loan", 
    description: "For business expansion and operations",
    icon: "🏢"
  },
  { 
    value: LoanType.EMERGENCY, 
    label: "Emergency Loan", 
    description: "For urgent financial needs",
    icon: "🚨"
  },
  { 
    value: LoanType.EDUCATION, 
    label: "Education Loan", 
    description: "For educational expenses",
    icon: "🎓"
  },
  { 
    value: LoanType.MEDICAL, 
    label: "Medical Loan", 
    description: "For healthcare expenses",
    icon: "🏥"
  },
  { 
    value: LoanType.AGRICULTURE, 
    label: "Agriculture Loan", 
    description: "For farming and agricultural needs",
    icon: "🌾"
  },
];

interface LoanApplicationState {
  success: boolean;
  message?: string;
  errors?: {
    principalAmount?: string[];
  };
}

interface LoanCalculation {
  monthlyPayment: number;
  totalAmount: number;
  totalInterest: number;
}

export function LoanApplicationForm() {
  const [state, formAction, pending] = useActionState<LoanApplicationState, FormData>(applyForLoan, { success: false, message: '' });
  const [selectedLoanType, setSelectedLoanType] = useState<LoanType | null>(null);
  const [amount, setAmount] = useState<string>('');
  const [term, setTerm] = useState<string>('');
  const [calculation, setCalculation] = useState<LoanCalculation | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  // Calculate loan details when inputs change
  useEffect(() => {
    if (selectedLoanType && amount && term) {
      const principal = parseFloat(amount);
      const months = parseInt(term);
      
      if (principal > 0 && months > 0) {
        const interestRate = getInterestRateByType(selectedLoanType);
        const calc = calculateSimpleInterestLoan(principal, interestRate, months);
        setCalculation(calc);
      } else {
        setCalculation(null);
      }
    } else {
      setCalculation(null);
    }
  }, [selectedLoanType, amount, term]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value);
  };

  const handleTermChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTerm(e.target.value);
  };

  const handleLoanTypeChange = (loanType: LoanType) => {
    setSelectedLoanType(loanType);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter(file => {
      // Check file size (max 5MB per file)
      if (file.size > 5 * 1024 * 1024) {
        alert(`File ${file.name} is too large. Maximum size is 5MB.`);
        return false;
      }
      // Check file type
      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      if (!allowedTypes.includes(file.type)) {
        alert(`File ${file.name} has unsupported format. Please upload PDF, JPG, PNG, or Word documents.`);
        return false;
      }
      return true;
    });
    
    // Limit total files to 10
    const totalFiles = uploadedFiles.length + validFiles.length;
    if (totalFiles > 10) {
      alert('Maximum 10 files allowed. Please remove some files first.');
      return;
    }
    
    setUploadedFiles(prev => [...prev, ...validFiles]);
    event.target.value = ''; // Reset input
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (file: File) => {
    if (file.type.includes('pdf')) return '📄';
    if (file.type.includes('image')) return '🖼️';
    if (file.type.includes('word')) return '📝';
    return '📁';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (state?.success) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            ✅
          </div>
          <CardTitle className="text-2xl text-green-600">Application Submitted!</CardTitle>
          <CardDescription>
            Your loan application has been submitted successfully and is under review.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">{state.message}</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => window.location.href = '/my-loans'}>
              View My Loans
            </Button>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Apply for Another Loan
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Application Form */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Loan Application</CardTitle>
            <CardDescription>
              Fill out the form below to apply for a loan. All fields are required.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={(formData) => {
              // Add uploaded files to FormData
              uploadedFiles.forEach((file, index) => {
                formData.append('requirements', file);
              });
              formAction(formData);
            }} className="space-y-6">
              {/* Loan Type Selection */}
              <div className="space-y-3">
                <Label>Select Loan Type</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {loanTypes.map((type) => {
                    const maxAmount = getMaxAmountByType(type.value);
                    const maxTerm = getMaxTermByType(type.value);
                    const interestRate = getInterestRateByType(type.value);
                    
                    return (
                      <div
                        key={type.value}
                        className={`p-4 border rounded-lg cursor-pointer transition-all hover:border-blue-500 ${
                          selectedLoanType === type.value 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200'
                        }`}
                        onClick={() => handleLoanTypeChange(type.value)}
                      >
                        <input
                          type="radio"
                          name="loanType"
                          value={type.value}
                          checked={selectedLoanType === type.value}
                          onChange={() => handleLoanTypeChange(type.value)}
                          className="sr-only"
                        />
                        <div className="flex items-start space-x-3">
                          <span className="text-2xl">{type.icon}</span>
                          <div className="flex-1">
                            <h3 className="font-medium">{type.label}</h3>
                            <p className="text-sm text-muted-foreground">{type.description}</p>
                            <div className="mt-2 space-y-1">
                              <div className="flex justify-between text-xs">
                                <span>Max Amount:</span>
                                <span className="font-medium">{formatCurrency(maxAmount)}</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span>Max Term:</span>
                                <span className="font-medium">{maxTerm} month(s)</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span>Interest Rate:</span>
                                <span className="font-medium">{interestRate}% for entire term</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {state?.errors?.loanType && (
                  <p className="text-sm text-red-500">{state.errors.loanType[0]}</p>
                )}
              </div>

              <Separator />

              {/* Loan Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="principalAmount">Loan Amount (₱)</Label>
                  <Input
                    id="principalAmount"
                    name="principalAmount"
                    type="number"
                    placeholder="Enter amount"
                    value={amount}
                    onChange={handleAmountChange}
                    min="1000"
                    step="1000"
                    disabled={!selectedLoanType}
                    required
                  />
                  {selectedLoanType && (
                    <p className="text-xs text-muted-foreground">
                      Maximum: {formatCurrency(getMaxAmountByType(selectedLoanType))}
                    </p>
                  )}
                  {state?.errors?.principalAmount && (
                    <p className="text-sm text-red-500">{state.errors.principalAmount[0]}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="termMonths">Loan Term (months)</Label>
                  <Input
                    id="termMonths"
                    name="termMonths"
                    type="number"
                    placeholder="Enter term"
                    value={term}
                    onChange={handleTermChange}
                    min="1"
                    max="60"
                    disabled={!selectedLoanType}
                    required
                  />
                  {selectedLoanType && (
                    <p className="text-xs text-muted-foreground">
                      Maximum: {getMaxTermByType(selectedLoanType)} months
                    </p>
                  )}
                  {state?.errors?.termMonths && (
                    <p className="text-sm text-red-500">{state.errors.termMonths[0]}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="purpose">Purpose of Loan</Label>
                <Textarea
                  id="purpose"
                  name="purpose"
                  placeholder="Describe the purpose of your loan application..."
                  rows={4}
                  required
                />
                {state?.errors?.purpose && (
                  <p className="text-sm text-red-500">{state.errors.purpose[0]}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="collateral">Collateral (Optional)</Label>
                <Textarea
                  id="collateral"
                  name="collateral"
                  placeholder="Describe any collateral you're offering (optional)..."
                  rows={3}
                />
                {state?.errors?.collateral && (
                  <p className="text-sm text-red-500">{state.errors.collateral[0]}</p>
                )}
              </div>

              {/* Requirements Upload Section */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Upload Requirements</Label>
                  <p className="text-sm text-muted-foreground">
                    Upload required documents for loan review (PDF, JPG, PNG, DOC formats • Max 5MB per file • Max 10 files)
                  </p>
                  
                  {/* File Upload Area */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                    <input
                      type="file"
                      id="requirements"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <label 
                      htmlFor="requirements" 
                      className="cursor-pointer flex flex-col items-center space-y-2"
                    >
                      <Upload className="w-8 h-8 text-gray-400" />
                      <div>
                        <span className="text-sm font-medium text-gray-700">Click to upload files</span>
                        <p className="text-xs text-gray-500">or drag and drop</p>
                      </div>
                    </label>
                  </div>

                  {/* Uploaded Files List */}
                  {uploadedFiles.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Uploaded Files ({uploadedFiles.length}/10):</p>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {uploadedFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border">
                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                              <span className="text-lg">{getFileIcon(file)}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                                <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeFile(index)}
                              className="ml-2 text-red-500 hover:text-red-700 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Requirements Checklist */}
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-900 mb-2 flex items-center">
                      <FileText className="w-4 h-4 mr-2" />
                      Required Documents
                    </h4>
                    <ul className="space-y-1 text-sm text-blue-800">
                      <li className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                        Valid government-issued ID (front and back)
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                        Proof of income (payslip, certificate, etc.)
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                        Bank statements (last 3 months)
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                        Proof of residence (utility bill, etc.)
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                        Additional documents as required by loan type
                      </li>
                    </ul>
                    <p className="text-xs text-blue-700 mt-2">
                      💡 Tip: Complete documentation speeds up loan processing and approval
                    </p>
                  </div>
                </div>
              </div>

              {/* Error/Success Messages */}
              {state?.message && !state?.success && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{state.message}</p>
                </div>
              )}

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full" 
                disabled={pending || !selectedLoanType || !amount || !term}
              >
                {pending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting Application...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-2" />
                    Submit Loan Application
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Loan Calculator */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Loan Calculator
            </CardTitle>
            <CardDescription>
              See your loan details before applying
            </CardDescription>
          </CardHeader>
          <CardContent>
            {calculation ? (
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Loan Amount:</span>
                    <span className="font-medium">{formatCurrency(parseFloat(amount))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Interest Rate:</span>
                    <span className="font-medium">{selectedLoanType ? getInterestRateByType(selectedLoanType) : 0}% for entire term</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Term:</span>
                    <span className="font-medium">{term} months</span>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Monthly Payment:</span>
                    <span className="font-bold text-lg">{formatCurrency(calculation.monthlyPayment)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Amount:</span>
                    <span className="font-medium">{formatCurrency(calculation.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Interest:</span>
                    <span className="font-medium">{formatCurrency(calculation.totalInterest)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calculator className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Select loan type and enter amount to see calculation</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Loan Requirements */}
        <Card>
          <CardHeader>
            <CardTitle>Requirements</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                ✅ Valid government ID
              </li>
              <li className="flex items-center gap-2">
                ✅ Proof of income
              </li>
              <li className="flex items-center gap-2">
                ✅ Complete application form
              </li>
              <li className="flex items-center gap-2">
                ✅ Active membership
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
