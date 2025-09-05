'use client';

import { useActionState, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signup } from '@/app/signup/actions';
import { ChevronDownIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { toast } from 'sonner';

interface SignupState {
  success: boolean;
  errors?: {
    name?: string[];
    email?: string[];
    password?: string[];
    address?: string[];
    phoneNo?: string[];
    dob?: string[];
  };
  message?: string;
}

export default function SignupForm() {
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [address, setAddress] = useState('');
  const [phoneNo, setPhoneNo] = useState('');
  const [dob, setDob] = useState<Date | undefined>(new Date())
  const [isLoading, setIsLoading] = useState(false);
  const [state, formAction, pending] = useActionState<SignupState, FormData>(signup, { 
    success: false, 
    errors: {}, 
    message: '' 
  });
  const [openCalendar, setOpenCalendar] = useState(false);

  useEffect(() => {
    if (state?.success) {
      toast.success(state.message);
      router.push('/login');
    }
  }, [state]);

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-700">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Create an Account</h1>
        </div>
        <div className="text-center">
          {state.success && <p className="text-red-500">{state.message}</p>}
        </div>
        <form className="space-y-6" action={formAction}>
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="Enter your name"
              disabled={isLoading}
            />
            {state?.errors?.name && (
              <p className="text-red-500">{state.errors.name[0]}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="Enter your email"
              disabled={isLoading}
            />
            {state?.errors?.email && (
              <p className='text-red-500'>{state.errors.email[0]}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="Enter your password"
              disabled={isLoading}
            />
            {state?.errors?.password && (
              <p className='text-red-500'>{state.errors.password[0]}</p>
            )}
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-300 mb-2">
              Address
            </label>
            <input
              id="address"
              name="address"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="Enter your address"
              disabled={isLoading}
            />
            {state?.errors?.address && (
              <p className='text-red-500'>{state.errors.address[0]}</p>
            )}
          </div>

          <div>
            <label htmlFor="phoneNo" className="block text-sm font-medium text-gray-300 mb-2">
              Phone Number
            </label>
            <input
              id="phoneNo"
              name="phoneNo"
              type="tel"
              value={phoneNo}
              onChange={(e) => setPhoneNo(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="e.g., +639123456789 or 09123456789"
              disabled={isLoading}
            />
            {state?.errors?.phoneNo && (
              <p className='text-red-500'>{state.errors.phoneNo[0]}</p>
            )}
          </div>

          <div>
            <label htmlFor="dob" className="block text-sm font-medium text-gray-300 mb-2">
              Date of Birth
            </label>
            <div className="flex flex-col gap-3">
              <Popover open={openCalendar} onOpenChange={setOpenCalendar}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    id="date"
                    className="justify-between font-normal w-full h-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  >
                    {dob ? dob.toLocaleDateString() : "Select date"}
                    <ChevronDownIcon />
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
            </div>
            {state?.errors?.dob && (
              <p className='text-red-500'>{state.errors.dob[0]}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={pending}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
          >
            {pending ? 'Signing up...' : 'Sign Up'}
          </button>

          <div className="text-center text-white">
            Already have an account? <a href="/login" className="text-blue-400 hover:text-blue-300">Sign in</a>
          </div>

        </form>
      </div>
    </div>
  )
}