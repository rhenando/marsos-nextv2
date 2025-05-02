"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/firebase/config";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { GithubIcon, LockIcon, MailIcon } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const user = result.user;

      if (user.email !== "marsos@ayn-almanal.com") {
        toast.error("Access denied: Not an admin account");
        return;
      }

      toast.success("Login successful");
      router.push("/admin-dashboard");
    } catch (error) {
      toast.error("Invalid credentials");
      console.error("Login error:", error);
    }
  };

  return (
    <div className='grid min-h-screen grid-cols-1 lg:grid-cols-2 bg-white'>
      {/* Left: Login Form */}
      <div className='flex flex-col justify-center px-6 py-12 lg:px-24'>
        {/* Logo */}
        <div className='mb-8'>
          <h1 className='text-lg font-semibold'>Marsos Admin</h1>
        </div>

        <div className='mx-auto w-full max-w-md space-y-6'>
          <div className='space-y-1'>
            <h2 className='text-2xl font-bold tracking-tight'>
              Login to your account
            </h2>
            <p className='text-sm text-muted-foreground'>
              Enter your admin credentials below to continue
            </p>
          </div>

          {/* Email */}
          <div className='space-y-2'>
            <label htmlFor='email' className='text-sm font-medium'>
              Email
            </label>
            <div className='relative'>
              <Input
                id='email'
                type='email'
                placeholder='admin@example.com'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className='pr-10'
              />
              <MailIcon className='absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
            </div>
          </div>

          {/* Password */}
          <div className='space-y-2'>
            <div className='flex justify-between items-center'>
              <label htmlFor='password' className='text-sm font-medium'>
                Password
              </label>
              <a
                href='#'
                className='text-sm text-muted-foreground hover:underline'
              >
                Forgot password?
              </a>
            </div>
            <div className='relative'>
              <Input
                id='password'
                type='password'
                placeholder='••••••••'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className='pr-10'
              />
              <LockIcon className='absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
            </div>
          </div>

          {/* Login Button */}
          <Button
            className='w-full bg-[#2c6449] hover:bg-[#24523b] text-white'
            onClick={handleLogin}
          >
            Login
          </Button>

          {/* OR separator */}
          <div className='flex items-center gap-4'>
            <Separator className='flex-1' />
            <span className='text-xs text-muted-foreground'>
              Or continue with
            </span>
            <Separator className='flex-1' />
          </div>

          {/* GitHub Button (placeholder only) */}
          <Button variant='outline' className='w-full flex gap-2 items-center'>
            <GithubIcon className='w-4 h-4' />
            Login with GitHub
          </Button>

          <p className='text-sm text-center text-muted-foreground'>
            Don’t have access?{" "}
            <span className='underline text-primary'>Contact admin</span>
          </p>
        </div>
      </div>

      {/* Right Panel: Placeholder */}
      <div className='hidden lg:block bg-gray-100'>
        <div className='flex h-full items-center justify-center'>
          <div className='border border-gray-300 rounded-full p-6 opacity-20'>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              className='w-16 h-16 text-gray-400'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
              strokeWidth={1.5}
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M12 4.5v15m7.5-7.5h-15'
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
