import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { useState } from "react";
import { supabase } from "../../../util/supabase";
import PlayerAvatar from "src/components/play/PlayerAvatar";

type AuthFormInputs = {
  email: string;
  password: string;
  confirmPassword?: string;
  username?: string;
};

export default function Auth() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(false);
  const [authError, setAuthError] = useState<string>("");
  const [isSuccess, setIsSuccess] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm<AuthFormInputs>({
    mode: "onBlur",
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      username: "",
    },
  });

  const password = watch("password");

  const onSubmit = async (data: AuthFormInputs) => {
    setAuthError("");
    setIsSuccess(false);
    
    try {
      if (isLogin) {
        // Login logic
        const { error } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });
        
        if (error) {
          setAuthError(error.message);
        } else {
          setIsSuccess(true);
          setTimeout(() => navigate("/"), 1000);
        }
      } else {
        // Signup logic
        const { data: authData, error } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,

        });

        if (authData.user) {
        await supabase
          .from("profiles")
          .update({ username: data.username })
          .eq("user_id", authData.user.id);
        }

        if (error) {
          setAuthError(error.message);
        } else if (authData.user) {
          // Create profile immediately with username
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              user_id: authData.user.id,
              username: data.username,
              level: 1,
              accuracy: 0,
              streak: 0,
              bullseyes: 0,
              score: 0,
              shot_attempts: 0
            });

          if (profileError) {
            console.error("Error creating profile:", profileError);
            // Don't fail the signup if profile creation fails - it can be created later
          }
          
          setIsSuccess(true);
          setAuthError("Check your email for a confirmation link!");
        }
      }
    } catch (error) {
      console.error("Auth error:", error);
      setAuthError("An unexpected error occurred. Please try again.");
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setAuthError("");
    setIsSuccess(false);
    reset();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:bg-gradient-to-br dark:from-gray-950 dark:via-gray-900 dark:to-blue-950/20 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>
      
      <form
        className="relative z-10 bg-white/95 dark:bg-gray-950/95 backdrop-blur-sm border border-gray-200 dark:border-gray-700 px-8 py-8 rounded-2xl shadow-lg min-w-[360px] flex flex-col gap-6 text-black dark:text-white"
        style={{ boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)" }}
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        {/* Header with mode toggle */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {isLogin ? "Welcome Back" : "Sign Up"}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            {isLogin ? "Continue your journey" : "Create your account to start playing"}
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="font-medium text-gray-700 dark:text-gray-300">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="username"
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-base text-gray-900 dark:text-white bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-colors duration-200"
            {...register("email", {
              required: "Email is required",
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "Invalid email address",
              },
            })}
          />
          {errors.email && (
            <span className="text-red-500 dark:text-red-400 text-sm font-medium">{errors.email.message}</span>
          )}
        </div>

        {/* Username field - only show for signup */}
        {!isLogin && (
          <div className="flex flex-col gap-2">
            <label htmlFor="username" className="font-medium text-gray-700 dark:text-gray-300">
              Username
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              placeholder="Choose a unique username"
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-base text-gray-900 dark:text-white bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-colors duration-200"
              {...register("username", {
                required: !isLogin ? "Username is required" : false,
                minLength: {
                  value: 3,
                  message: "Username must be at least 3 characters",
                },
                maxLength: {
                  value: 20,
                  message: "Username must be no more than 20 characters",
                },
                pattern: {
                  value: /^[a-zA-Z0-9_-]+$/,
                  message: "Username can only contain letters, numbers, underscores, and hyphens",
                },
              })}
            />
            {errors.username && (
              <span className="text-red-500 dark:text-red-400 text-sm font-medium">{errors.username.message}</span>
            )}
          </div>
        )}
        <div className="flex flex-col gap-2">
          <label htmlFor="password" className="font-medium text-gray-700 dark:text-gray-300">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete={isLogin ? "current-password" : "new-password"}
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-base text-gray-900 dark:text-white bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-colors duration-200"
            {...register("password", {
              required: "Password is required",
              minLength: {
                value: 6,
                message: "Password must be at least 6 characters",
              },
            })}
          />
          {errors.password && (
            <span className="text-red-500 dark:text-red-400 text-sm font-medium">{errors.password.message}</span>
          )}
        </div>

        {/* Confirm Password field - only show for signup */}
        {!isLogin && (
          <div className="flex flex-col gap-2">
            <label htmlFor="confirmPassword" className="font-medium text-gray-700 dark:text-gray-300">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-base text-gray-900 dark:text-white bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-colors duration-200"
              {...register("confirmPassword", {
                required: !isLogin ? "Please confirm your password" : false,
                validate: (value) => 
                  !isLogin && value !== password ? "Passwords do not match" : true,
              })}
            />
            {errors.confirmPassword && (
              <span className="text-red-500 dark:text-red-400 text-sm font-medium">{errors.confirmPassword.message}</span>
            )}
          </div>
        )}
        {/* Error/Success Messages */}
        {authError && (
          <div className={`p-3 rounded-lg text-sm font-medium ${
            isSuccess 
              ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800" 
              : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800"
          }`}>
            {authError}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-blue-400 disabled:to-blue-400 disabled:cursor-not-allowed text-white font-semibold text-base cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-[1.02] disabled:transform-none"
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              {isLogin ? "Signing in..." : "Creating account..."}
            </div>
          ) : (
            isLogin ? "Sign In" : "Create Account"
          )}
        </button>

        {/* Mode Toggle */}
        <div className="text-center pt-2">
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button
              type="button"
              onClick={toggleMode}
              className="ml-1 text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors duration-200"
            >
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </form>

    </div>
  );
}
