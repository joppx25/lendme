"use client";

import { useActionState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Save, X, Loader2, Edit } from "lucide-react";
import { User, useAuthStore } from "@/store/authStore";
import { updateProfile } from "@/app/profile/actions";

interface ProfileEditFormProps {
  user: User;
  onCancel: () => void;
  onSuccess: () => void;
}

interface ProfileUpdateState {
  success: boolean;
  message?: string;
  errors?: {
    name?: string[];
    email?: string[];
    phoneNo?: string[];
    address?: string[];
    dob?: string[];
  };
}

export function ProfileEditForm({ user, onCancel, onSuccess }: ProfileEditFormProps) {
  const { setUser } = useAuthStore();
  const [state, formAction, pending] = useActionState<ProfileUpdateState, FormData>(updateProfile, { success: false, message: '' });

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Handle successful update with useEffect to prevent setState during render
  useEffect(() => {
    if (state?.success) {
      // Update the store with new data
      const form = document.querySelector('form') as HTMLFormElement;
      if (form) {
        const formData = new FormData(form);
        const updatedUser = {
          ...user,
          name: formData.get('name') as string,
          email: formData.get('email') as string,
          phoneNo: formData.get('phoneNo') as string,
          address: formData.get('address') as string,
          dob: formData.get('dob') as string,
        };
        setUser(updatedUser);
        onSuccess();
      }
    }
  }, [state?.success, user, setUser, onSuccess]);

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <Edit className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <CardTitle className="text-xl">Edit Profile</CardTitle>
            <CardDescription>
              Update your personal information and contact details.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                name="name"
                defaultValue={user.name}
                placeholder="Enter your full name"
                required
              />
              {state?.errors?.name && (
                <p className="text-sm text-red-500">{state.errors.name[0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={user.email}
                placeholder="Enter your email address"
                required
              />
              {state?.errors?.email && (
                <p className="text-sm text-red-500">{state.errors.email[0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNo">Phone Number</Label>
              <Input
                id="phoneNo"
                name="phoneNo"
                defaultValue={user.phoneNo}
                placeholder="+639XXXXXXXXX or 09XXXXXXXXX"
                required
              />
              {state?.errors?.phoneNo && (
                <p className="text-sm text-red-500">{state.errors.phoneNo[0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dob">Date of Birth</Label>
              <Input
                id="dob"
                name="dob"
                type="date"
                defaultValue={user.dob}
                required
              />
              {state?.errors?.dob && (
                <p className="text-sm text-red-500">{state.errors.dob[0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                name="address"
                defaultValue={user.address}
                placeholder="Enter your complete address"
                rows={3}
                required
              />
              {state?.errors?.address && (
                <p className="text-sm text-red-500">{state.errors.address[0]}</p>
              )}
            </div>
          </div>

          {/* Error/Success Messages */}
          {state?.message && !state?.success && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{state.message}</p>
            </div>
          )}

          {state?.success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-600">{state.message}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={pending}
              size="sm"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" disabled={pending} size="sm">
              {pending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
