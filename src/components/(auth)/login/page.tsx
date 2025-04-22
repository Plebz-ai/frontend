"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { login } = useAuth();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  
  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await login(data.email, data.password);
      router.push("/");
    } catch (error) {
      console.error("Login failed:", error);
      setError(error instanceof Error ? error.message : "Failed to login. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="flex justify-center mb-2">
        <div className="w-10 h-10 flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17 7H7C4.23858 7 2 9.23858 2 12C2 14.7614 4.23858 17 7 17H17C19.7614 17 22 14.7614 22 12C22 9.23858 19.7614 7 17 7Z" stroke="white" strokeWidth="2"/>
            <path d="M17 7H7C4.23858 7 2 9.23858 2 12C2 14.7614 4.23858 17 7 17H17C19.7614 17 22 14.7614 22 12C22 9.23858 19.7614 7 17 7Z" stroke="white" strokeWidth="2"/>
            <path d="M17 7C19.7614 7 22 9.23858 22 12C22 14.7614 19.7614 17 17 17C14.2386 17 12 14.7614 12 12C12 9.23858 14.2386 7 17 7Z" fill="white"/>
          </svg>
        </div>
      </div>

      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
        <p className="text-sm text-gray-500 mt-1">
          Enter your credentials to access your account
        </p>
      </div>
      
      <div className="w-full max-w-sm bg-[#0c0c0c]/80 border border-gray-800 rounded-2xl backdrop-blur-sm shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-800/5 to-transparent pointer-events-none"></div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 relative z-10">
          <Input
            {...register("email")}
            id="email"
            type="email"
            label="Email address"
            placeholder="you@example.com"
            error={errors.email?.message}
          />
          
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-white hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              {...register("password")}
              id="password"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
            />
          </div>
          
          <Button
            type="submit"
            fullWidth
            isLoading={isLoading}
          >
            {isLoading ? "Signing in..." : "SIGN IN"}
          </Button>
          
          <div className="relative flex items-center justify-center mt-2 mb-2">
            <div className="absolute border-t border-gray-800 w-full"></div>
            <div className="relative bg-[#0c0c0c] px-2 text-xs text-gray-500">OR</div>
          </div>
          
          <Button
            type="button"
            variant="secondary"
            fullWidth
          >
            <svg className="mr-2 h-5 w-5" aria-hidden="true" viewBox="0 0 24 24">
              <path
                d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z"
                fill="#EA4335"
              />
              <path
                d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z"
                fill="#4285F4"
              />
              <path
                d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z"
                fill="#FBBC05"
              />
              <path
                d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.2654 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z"
                fill="#34A853"
              />
            </svg>
            Continue with Google
          </Button>
        </form>
      </div>
      
      <p className="text-sm text-center text-gray-500 mt-6">
        Don't have an account?{" "}
        <Link 
          href="/signup" 
          className="font-medium text-white hover:underline"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
} 