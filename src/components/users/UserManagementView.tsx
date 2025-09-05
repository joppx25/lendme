"use client";

import React, { useState, useActionState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { 
  Users,
  UserPlus,
  Shield,
  Eye,
  Edit,
  Lock,
  Trash2,
  Search,
  Filter,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  DollarSign,
  FileText,
  Phone,
  Mail,
  MapPin,
  Loader2,
  Settings,
  ChevronDown,
  Calendar as CalendarIcon
} from "lucide-react";
import { Role, Status } from "@prisma/client";
import { formatCurrency } from "@/lib/loanUtils";
import { 
  updateUserRole, 
  updateUserStatus, 
  createUser, 
  deleteUser, 
  resetUserPassword 
} from "@/app/users/actions";

interface UserData {
  id: string;
  name: string;
  email: string;
  phoneNo: string;
  address: string;
  role: Role;
  status: Status;
  createdAt: Date;
  updatedAt: Date;
  loans: Array<{
    id: string;
    loanNumber: string;
    principalAmount: number;
    status: string;
    createdAt: Date;
  }>;
  contributions: Array<{
    id: string;
    amount: number;
    status: string;
    createdAt: Date;
  }>;
  loanPayments: Array<{
    id: string;
    scheduledAmount: number;
    paidAmount: number;
    status: string;
    paidDate?: Date | null;
  }>;
  _count: {
    loans: number;
    contributions: number;
    loanPayments: number;
  };
}

interface UserManagementViewProps {
  users: UserData[];
  statistics: Record<string, number>;
  recentSignups: number;
  activeUsers: number;
  currentUserId: string;
  currentUserRole: Role;
}

interface UserUpdateState {
  success: boolean;
  message?: string;
  errors?: {
    userId?: string[];
    role?: string[];
    status?: string[];
  };
}

interface UserStatusState {
  success: boolean;
  message?: string;
  errors?: {
    userId?: string[];
    status?: string[];
  };
}

interface CreateUserState {
  success: boolean;
  message?: string;
  errors?: {
    name?: string[];
    email?: string[];
    phoneNo?: string[];
    address?: string[];
    dob?: string[];
    password?: string[];
    role?: string[];
  };
}

interface ResetUserPasswordState {
  success: boolean;
  message?: string;
  errors?: {
    newPassword?: string[];
  };
}

export function UserManagementView({ 
  users, 
  statistics, 
  recentSignups, 
  activeUsers, 
  currentUserId, 
  currentUserRole 
}: UserManagementViewProps) {
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [filterRole, setFilterRole] = useState<Role | 'ALL'>('ALL');
  const [filterStatus, setFilterStatus] = useState<Status | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState<'none' | 'create' | 'edit' | 'view' | 'delete' | 'reset'>('none');
  
  const [updateState, updateAction, updatePending] = useActionState<UserUpdateState, FormData>(updateUserRole, { success: false, message: '' });
  const [statusState, statusAction, statusPending] = useActionState<UserStatusState, FormData>(updateUserStatus, { success: false, message: '' });
  const [createState, createAction, createPending] = useActionState<CreateUserState, FormData>(createUser, { success: false, message: '' });
  const [resetState, resetAction, resetPending] = useActionState(resetUserPassword, { success: false, message: '' });

  const [openCalendar, setOpenCalendar] = useState(false);
  const [dob, setDob] = useState<Date | undefined>(new Date())

  const getRoleColor = (role: Role) => {
    switch (role) {
      case 'SUPERADMIN':
        return 'destructive';
      case 'MANAGER':
        return 'default';
      case 'BORROWER':
        return 'secondary';
      case 'GUEST':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getStatusColor = (status: Status) => {
    switch (status) {
      case 'ACTIVE':
        return 'default';
      case 'INACTIVE':
        return 'secondary';
      case 'PENDING':
        return 'secondary';
      case 'BLOCKED':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getRoleIcon = (role: Role) => {
    switch (role) {
      case 'SUPERADMIN':
        return '👑';
      case 'MANAGER':
        return '👔';
      case 'BORROWER':
        return '👤';
      case 'GUEST':
        return '👥';
      default:
        return '👤';
    }
  };

  const getUserInitials = (name: string) => {
    return name.split(' ').map(word => word.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  // Filter users based on role, status, and search term
  const filteredUsers = users.filter(user => {
    const matchesRole = filterRole === 'ALL' || user.role === filterRole;
    const matchesStatus = filterStatus === 'ALL' || user.status === filterStatus;
    const matchesSearch = searchTerm === '' || 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phoneNo.includes(searchTerm);
    
    return matchesRole && matchesStatus && matchesSearch;
  });

  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteUser(userId);
      setShowModal('none');
      setSelectedUser(null);
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  // Calculate user statistics
  const totalUsers = users.length;
  // const totalBorrowers = users.filter(u => u.role === 'BORROWER').length;
  // const totalManagers = users.filter(u => u.role === 'MANAGER').length;
  const suspendedUsers = users.filter(u => u.status === 'BLOCKED').length;

  // Calculate financial statistics for users
  // const totalLoanAmount = users.reduce((sum, user) => 
  //   sum + user.loans.reduce((userSum, loan) => userSum + loan.principalAmount, 0), 0
  // );

  // const totalContributionAmount = users.reduce((sum, user) => 
  //   sum + user.contributions.reduce((userSum, contribution) => userSum + contribution.amount, 0), 0
  // );

  // Handle successful actions with useEffect to prevent re-render loops
  React.useEffect(() => {
    if (updateState?.success || statusState?.success || createState?.success || resetState?.success) {
      setShowModal('none');
      setSelectedUser(null);
    }
  }, [updateState?.success, statusState?.success, createState?.success, resetState?.success]);

  return (
    <div className="space-y-6">
      {/* User Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-blue-600" />
              <div>
                <p className="text-xs text-muted-foreground">Total Users</p>
                <p className="text-lg font-bold">{totalUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <div>
                <p className="text-xs text-muted-foreground">Active Users</p>
                <p className="text-lg font-bold">{activeUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <UserPlus className="w-4 h-4 text-purple-600" />
              <div>
                <p className="text-xs text-muted-foreground">New (30 days)</p>
                <p className="text-lg font-bold">{recentSignups}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
              <div>
                <p className="text-xs text-muted-foreground">Suspended</p>
                <p className="text-lg font-bold">{suspendedUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters & Actions
            </CardTitle>
            {(currentUserRole === 'SUPERADMIN' || currentUserRole === 'MANAGER') && (
              <Button onClick={() => setShowModal('create')} className="flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                Add User
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="search">Search Users</Label>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            <div className="min-w-[150px]">
              <Label htmlFor="role">Role Filter</Label>
              <select
                id="role"
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value as Role | 'ALL')}
                className="flex mt-2 h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="ALL">All Roles</option>
                <option value="SUPERADMIN">Super Admin</option>
                <option value="MANAGER">Manager</option>
                <option value="BORROWER">Borrower</option>
                <option value="GUEST">Guest</option>
              </select>
            </div>

            <div className="min-w-[150px]">
              <Label htmlFor="status">Status Filter</Label>
              <select
                id="status"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as Status | 'ALL')}
                className="flex mt-2 h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="PENDING">Pending</option>
                <option value="BLOCKED">Blocked</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            All Users ({filteredUsers.length})
          </h2>
        </div>

        {filteredUsers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Users Found</h3>
              <p className="text-muted-foreground">
                {searchTerm || filterRole !== 'ALL' || filterStatus !== 'ALL'
                  ? "No users match your current filters."
                  : "No users have been registered yet."
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map((user) => (
              <Card key={user.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src="/avatar-placeholder.png" alt={user.name} />
                        <AvatarFallback>{getUserInitials(user.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-sm">{user.name}</h3>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-lg">{getRoleIcon(user.role)}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedUser(user);
                          setShowModal('view');
                        }}
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Role:</span>
                      <Badge variant={getRoleColor(user.role)}>
                        {user.role.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Status:</span>
                      <Badge variant={getStatusColor(user.status)}>
                        {user.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Member since:</span>
                      <span className="text-xs">{user.createdAt.toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <Separator className="my-3" />
                  
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-xs text-muted-foreground">Loans</p>
                      <p className="text-sm font-medium">{user._count.loans}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Contributions</p>
                      <p className="text-sm font-medium">{user._count.contributions}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Payments</p>
                      <p className="text-sm font-medium">{user._count.loanPayments}</p>
                    </div>
                  </div>
                  
                  {(currentUserRole === 'SUPERADMIN' || currentUserRole === 'MANAGER') && user.id !== currentUserId && (
                    <div className="flex space-x-1 mt-4">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setSelectedUser(user);
                          setShowModal('edit');
                        }}
                        className="flex-1"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setSelectedUser(user);
                          setShowModal('reset');
                        }}
                      >
                        <Lock className="w-3 h-3" />
                      </Button>
                      {currentUserRole === 'SUPERADMIN' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedUser(user);
                            setShowModal('delete');
                          }}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {showModal === 'create' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Create New User</CardTitle>
              <CardDescription>Add a new user to the system</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={createAction} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input id="name" name="name" placeholder="Enter full name" required />
                  {createState?.errors?.name && (
                    <p className="text-sm text-red-500">{createState.errors.name[0]}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input id="email" name="email" type="email" placeholder="Enter email address" required />
                  {createState?.errors?.email && (
                    <p className="text-sm text-red-500">{createState.errors.email[0]}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phoneNo">Phone Number *</Label>
                  <Input id="phoneNo" name="phoneNo" placeholder="Enter phone number" required />
                  {createState?.errors?.phoneNo && (
                    <p className="text-sm text-red-500">{createState.errors.phoneNo[0]}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dob">Date of Birth *</Label>
                  <Popover open={openCalendar} onOpenChange={setOpenCalendar}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        id="date"
                        className="justify-between font-normal w-full h-full px-4 py-3 border rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      >
                        {dob ? dob.toLocaleDateString() : "Select date of birth"}
                        <CalendarIcon className="w-4 h-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dob}
                        captionLayout="dropdown"
                        onSelect={(date) => {
                          setDob(date)
                          setOpenCalendar(false)
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                  <input
                    type="hidden"
                    name="dob"
                    value={dob ? dob.toISOString().split('T')[0] : ''}
                  />
                  {createState?.errors?.dob && (
                    <p className="text-sm text-red-500">{createState.errors.dob[0]}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="address">Address *</Label>
                  <Textarea id="address" name="address" placeholder="Enter full address" required />
                  {createState?.errors?.address && (
                    <p className="text-sm text-red-500">{createState.errors.address[0]}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="role">Role *</Label>
                  <select
                    id="role"
                    name="role"
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Select role</option>
                    {currentUserRole === 'SUPERADMIN' && <option value="MANAGER">Manager</option>}
                    <option value="BORROWER">Borrower</option>
                    <option value="GUEST">Guest</option>
                  </select>
                  {createState?.errors?.role && (
                    <p className="text-sm text-red-500">{createState.errors.role[0]}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input id="password" name="password" type="password" placeholder="Enter password" required />
                  {createState?.errors?.password && (
                    <p className="text-sm text-red-500">{createState.errors.password[0]}</p>
                  )}
                </div>
                
                {createState?.message && !createState?.success && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600">{createState.message}</p>
                  </div>
                )}
                
                <div className="flex space-x-3">
                  <Button type="submit" disabled={createPending} className="flex-1">
                    {createPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Create User
                      </>
                    )}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setShowModal('none')}
                    disabled={createPending}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* View/Edit User Modal */}
      {(showModal === 'view' || showModal === 'edit') && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">{getRoleIcon(selectedUser.role)}</span>
                {showModal === 'view' ? 'User Details' : 'Edit User'}
              </CardTitle>
              <CardDescription>{selectedUser.name} • {selectedUser.email}</CardDescription>
            </CardHeader>
            <CardContent>
              {showModal === 'view' ? (
                <div className="space-y-6">
                  {/* User Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{selectedUser.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{selectedUser.phoneNo}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <span className="text-sm">{selectedUser.address}</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Role:</span>
                        <Badge variant={getRoleColor(selectedUser.role)}>
                          {selectedUser.role}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Status:</span>
                        <Badge variant={getStatusColor(selectedUser.status)}>
                          {selectedUser.status}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Joined:</span>
                        <span className="text-sm">{selectedUser.createdAt.toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Activity Summary */}
                  <div>
                    <h4 className="font-medium mb-3">Activity Summary</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="p-4 text-center">
                          <FileText className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                          <p className="text-2xl font-bold">{selectedUser._count.loans}</p>
                          <p className="text-sm text-muted-foreground">Total Loans</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <DollarSign className="w-6 h-6 mx-auto mb-2 text-green-600" />
                          <p className="text-2xl font-bold">{selectedUser._count.contributions}</p>
                          <p className="text-sm text-muted-foreground">Contributions</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <CalendarIcon className="w-6 h-6 mx-auto mb-2 text-purple-600" />
                          <p className="text-2xl font-bold">{selectedUser._count.loanPayments}</p>
                          <p className="text-sm text-muted-foreground">Payments Made</p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div>
                    <h4 className="font-medium mb-3">Recent Activity</h4>
                    <div className="space-y-2">
                      {selectedUser.loans.slice(0, 3).map((loan) => (
                        <div key={loan.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span className="text-sm">Loan {loan.loanNumber}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{formatCurrency(loan.principalAmount)}</span>
                            <Badge variant="outline" className="text-xs">{loan.status}</Badge>
                          </div>
                        </div>
                      ))}
                      {selectedUser.contributions.slice(0, 3).map((contribution) => (
                        <div key={contribution.id} className="flex justify-between items-center p-2 bg-green-50 rounded">
                          <span className="text-sm">Contribution</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{formatCurrency(contribution.amount)}</span>
                            <Badge variant="outline" className="text-xs">{contribution.status}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    {(currentUserRole === 'SUPERADMIN' || currentUserRole === 'MANAGER') && selectedUser.id !== currentUserId && (
                      <Button onClick={() => setShowModal('edit')}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit User
                      </Button>
                    )}
                    <Button variant="outline" onClick={() => setShowModal('none')}>
                      Close
                    </Button>
                  </div>
                </div>
              ) : (
                <form action={updateAction} className="space-y-4">
                  <input type="hidden" name="userId" value={selectedUser.id} />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="editRole">Role</Label>
                      <select
                        id="editRole"
                        name="role"
                        defaultValue={selectedUser.role}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {currentUserRole === 'SUPERADMIN' && <option value="SUPERADMIN">Super Admin</option>}
                        {currentUserRole === 'SUPERADMIN' && <option value="MANAGER">Manager</option>}
                        <option value="BORROWER">Borrower</option>
                        <option value="GUEST">Guest</option>
                      </select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="editStatus">Status</Label>
                      <select
                        id="editStatus"
                        name="status"
                        defaultValue={selectedUser.status}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                        <option value="PENDING">Pending</option>
                        <option value="BLOCKED">Blocked</option>
                      </select>
                    </div>
                  </div>
                  
                  {updateState?.message && !updateState?.success && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm text-red-600">{updateState.message}</p>
                    </div>
                  )}
                  
                  <div className="flex space-x-3">
                    <Button type="submit" disabled={updatePending}>
                      {updatePending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <Settings className="w-4 h-4 mr-2" />
                          Update User
                        </>
                      )}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => setShowModal('view')}
                      disabled={updatePending}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Reset Password Modal */}
      {showModal === 'reset' && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Reset Password</CardTitle>
              <CardDescription>
                Reset password for {selectedUser.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={resetAction} className="space-y-4">
                <input type="hidden" name="userId" value={selectedUser.id} />
                
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password *</Label>
                  <Input 
                    id="newPassword" 
                    name="newPassword" 
                    type="password" 
                    placeholder="Enter new password" 
                    required 
                  />
                  {resetState?.errors?.newPassword && (
                    <p className="text-sm text-red-500">{resetState.errors.newPassword[0]}</p>
                  )}
                </div>
                
                {resetState?.message && !resetState?.success && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600">{resetState.message}</p>
                  </div>
                )}
                
                <div className="flex space-x-3">
                  <Button type="submit" disabled={resetPending}>
                    {resetPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Resetting...
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 mr-2" />
                        Reset Password
                      </>
                    )}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setShowModal('none')}
                    disabled={resetPending}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete User Modal */}
      {showModal === 'delete' && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="text-red-600">Delete User</CardTitle>
              <CardDescription>
                Are you sure you want to delete {selectedUser.name}? This action cannot be undone.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                  <h4 className="font-medium text-red-800 mb-2">Warning</h4>
                  <p className="text-sm text-red-600">
                    This will deactivate the user account. Users with active loans cannot be deleted.
                  </p>
                </div>
                
                <div className="flex space-x-3">
                  <Button 
                    onClick={() => handleDeleteUser(selectedUser.id)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete User
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setShowModal('none')}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
