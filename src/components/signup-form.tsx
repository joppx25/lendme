'use client';

import { useActionState, useState } from 'react';
import { signup } from '@/app/signup/actions';
import { ChevronDownIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export default function SignupForm() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [address, setAddress] = useState('');
  const [phoneNo, setPhoneNo] = useState('');
  const [dob, setDob] = useState<Date | undefined>(new Date())
  const [isLoading, setIsLoading] = useState(false);
  const [state, formAction, pending] = useActionState(signup, null);
  const [openCalendar, setOpenCalendar] = useState(false);

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-700">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Create an Account</h1>
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
            {state?.error?.name && (
              <p className="text-red-500">{state.error.name}</p>
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
            {state?.error?.email && (
              <p className='text-red-500'>{state.error.email}</p>
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
            {state?.error?.password && (
              <p className='text-red-500'>{state.error.password}</p>
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
            {state?.error?.address && (
              <p className='text-red-500'>{state.error.address}</p>
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
            {state?.error?.phoneNo && (
              <p className='text-red-500'>{state.error.phoneNo}</p>
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
            {state?.error?.dob && (
              <p className='text-red-500'>{state.error.dob}</p>
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