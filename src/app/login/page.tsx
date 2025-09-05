import LoginForm from '@/components/login-form';
import { Suspense } from 'react'

interface LoginPageProps {
  searchParams: Promise<{ message?: string | undefined }>
}
 
export default async function LoginPage({
  searchParams,
}: LoginPageProps) {
  const params = await searchParams;
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Lending App
          </div>
        </div>
        {params.message && (
          <div className="mb-4 p-3 bg-green-800 border border-green-600 rounded-lg text-green-200 text-sm text-center">
            {params.message}
          </div>
        )}
        <Suspense fallback={<div className="text-white text-center">Loading...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}