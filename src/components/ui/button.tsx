import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className = "",
      variant = "primary",
      size = "md",
      isLoading = false,
      fullWidth = false,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles = "font-medium rounded-xl transition-all";
    
    const variantStyles = {
      primary: "bg-gradient-to-r from-gray-200 via-rose-200 to-amber-200 hover:opacity-90 text-black shadow-lg",
      secondary: "border border-gray-800 bg-[#111111] hover:bg-gray-900 text-white",
      outline: "border border-gray-700 hover:bg-gray-800/20 text-white",
      ghost: "hover:bg-gray-800/30 text-white",
    };
    
    const sizeStyles = {
      sm: "text-xs py-2 px-3",
      md: "text-sm py-3.5 px-4",
      lg: "text-base py-4 px-6",
    };
    
    const widthStyles = fullWidth ? "w-full" : "";
    
    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyles} ${disabled || isLoading ? "opacity-70 cursor-not-allowed" : ""} ${className}`}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {children}
          </div>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button"; 