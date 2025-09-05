"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Edit, Mail, Phone, MapPin, Calendar, Shield } from "lucide-react";
import { User } from "@/store/authStore";
import { ProfileEditForm } from "./ProfileEditForm";
import { Role } from "@prisma/client";

interface ProfileCardProps {
  user: User;
}

export function ProfileCard({ user }: ProfileCardProps) {
  const [isEditing, setIsEditing] = useState(false);

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadgeVariant = (role: Role) => {
    switch (role) {
      case Role.SUPERADMIN:
        return "destructive";
      case Role.MANAGER:
        return "default";
      case Role.BORROWER:
        return "secondary";
      default:
        return "outline";
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "default";
      case "PENDING":
        return "secondary";
      case "BLOCKED":
        return "destructive";
      default:
        return "outline";
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  if (isEditing) {
    return (
      <ProfileEditForm 
        user={user} 
        onCancel={() => setIsEditing(false)}
        onSuccess={() => setIsEditing(false)}
      />
    );
  }

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader className="pb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src="/avatar-placeholder.png" alt={user.name} />
              <AvatarFallback className="text-lg">
                {getUserInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl">{user.name}</CardTitle>
              <CardDescription className="text-base">{user.email}</CardDescription>
              <div className="flex items-center space-x-2 mt-2">
                <Badge variant={getRoleBadgeVariant(user.role)}>
                  <Shield className="w-3 h-3 mr-1" />
                  {user.role.toLowerCase()}
                </Badge>
                <Badge variant={getStatusBadgeVariant(user.status)}>
                  {user.status.toLowerCase()}
                </Badge>
              </div>
            </div>
          </div>
          <Button onClick={() => setIsEditing(true)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit Profile
          </Button>
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contact Information</h3>
            
            <div className="flex items-center space-x-3">
              <Mail className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Phone className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Phone Number</p>
                <p className="text-sm text-muted-foreground">{user.phoneNo}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Address</p>
                <p className="text-sm text-muted-foreground">{user.address}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Personal Information</h3>
            
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Date of Birth</p>
                <p className="text-sm text-muted-foreground">{formatDate(user.dob)}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Shield className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Account Role</p>
                <p className="text-sm text-muted-foreground capitalize">{user.role.toLowerCase()}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 flex items-center justify-center">
                <div className={`w-3 h-3 rounded-full ${
                  user.status === 'ACTIVE' ? 'bg-green-500' : 
                  user.status === 'PENDING' ? 'bg-yellow-500' : 
                  'bg-red-500'
                }`} />
              </div>
              <div>
                <p className="text-sm font-medium">Account Status</p>
                <p className="text-sm text-muted-foreground capitalize">{user.status.toLowerCase()}</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
