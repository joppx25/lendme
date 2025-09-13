"use client";

import { useActionState, useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Lock, Loader2, Check } from "lucide-react";
import { changePassword } from "@/app/profile/actions";

interface PasswordUpdateState {
  success: boolean;
  message?: string;
  errors?: {
    newPassword?: string[];
  };
}

export function PasswordUpdateForm() {
  const [state, formAction, pending] = useActionState<PasswordUpdateState, FormData>(changePassword, { success: false, message: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordMatch, setPasswordMatch] = useState(true);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const password = e.target.value;
    const confirmPassword = (document.getElementById('confirmPassword') as HTMLInputElement)?.value;
    setPasswordMatch(password === confirmPassword);
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const confirmPassword = e.target.value;
    const password = (document.getElementById('newPassword') as HTMLInputElement)?.value;
    setPasswordMatch(password === confirmPassword);
  };

  // Reset form on successful update
  useEffect(() => {
    if (state?.success) {
      const form = document.querySelector('form') as HTMLFormElement;
      if (form) {
        form.reset();
        setPasswordMatch(true);
      }
    }
  }, [state?.success]);

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Lock className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <CardTitle className="text-xl">Change Password</CardTitle>
            <CardDescription>
              Update your account password for better security.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <div className="relative">
              <Input
                id="newPassword"
                name="newPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Enter new password"
                required
                onChange={handlePasswordChange}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </Button>
            </div>
            {state?.errors?.newPassword && (
              <p className="text-sm text-red-500">{state.errors.newPassword[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm new password"
                required
                onChange={handleConfirmPasswordChange}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </Button>
            </div>
            {!passwordMatch && (
              <p className="text-sm text-red-500">Passwords do not match</p>
            )}
          </div>

          {/* Password Requirements */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-2">Password Requirements:</p>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• At least 8 characters long</li>
              <li>• Mix of letters, numbers, and symbols recommended</li>
              <li>• Avoid common passwords</li>
            </ul>
          </div>

          {/* Error/Success Messages */}
          {state?.message && !state?.success && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{state.message}</p>
            </div>
          )}

          {state?.success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-green-600" />
                <p className="text-sm text-green-600">{state.message}</p>
              </div>
            </div>
          )}

          {/* Action Button */}
          <Button 
            type="submit" 
            disabled={pending || !passwordMatch}
            className="w-full"
          >
            {pending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Updating Password...
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 mr-2" />
                Update Password
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
