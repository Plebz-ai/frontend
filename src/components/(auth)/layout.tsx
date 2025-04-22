import Link from "next/link";
import { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full bg-black text-white relative overflow-hidden">
      {/* Background with glow effect */}
      <div className="absolute pointer-events-none inset-0">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[140px] -translate-y-1/3"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[140px] translate-y-1/3"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-rose-500/10 rounded-full blur-[120px]"></div>
      </div>
      
      {/* Simple nav bar */}
      <div className="absolute top-0 left-0 w-full p-6 z-10">
        <Link href="/" className="font-semibold text-xl">
          Scaler
        </Link>
      </div>
      
      {/* Center content */}
      <div className="w-full flex items-center justify-center p-8 z-10">
        <div className="w-full max-w-sm mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
} 