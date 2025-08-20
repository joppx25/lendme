import SignupForm from '@/components/signup-form';
import { Suspense } from 'react';

export default function SignupPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Suspense fallback={<div className="text-white text-center">Loading...</div>}>
          <SignupForm />
        </Suspense>
      </div>
    </main>
  );
}