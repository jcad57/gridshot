import { useState } from "react";
import { useNavigate } from "react-router";

type AuthFormInputs = {
  email: string;
  password: string;
};

export default function Auth() {
  const [form, setForm] = useState<AuthFormInputs>({ email: "", password: "" });
  const [errors, setErrors] = useState<Partial<AuthFormInputs>>({});
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: undefined });
  };

  const validate = () => {
    const newErrors: Partial<AuthFormInputs> = {};
    if (!form.email) {
      newErrors.email = "Email is required";
    }
    if (!form.password) {
      newErrors.password = "Password is required";
    }
    return newErrors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    // TODO: Login Logic
    navigate("/");
    console.log(form);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:bg-gradient-to-br dark:from-gray-950 dark:via-gray-900 dark:to-blue-950/20">
      <form
        className="bg-white/95 dark:bg-gray-950/95 backdrop-blur-sm border border-gray-200 dark:border-gray-700 px-8 py-8 rounded-2xl shadow-lg min-w-[320px] flex flex-col gap-6 text-black dark:text-white"
        style={{ boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)" }}
        onSubmit={handleSubmit}
        noValidate
      >
        <h2 className="text-center m-0 text-gray-900 dark:text-white text-2xl font-bold">Login</h2>
        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="font-medium text-gray-700 dark:text-gray-300">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-base text-gray-900 dark:text-white bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-colors duration-200"
            value={form.email}
            onChange={handleChange}
          />
          {errors.email && (
            <span className="text-red-500 dark:text-red-400 text-sm font-medium">{errors.email}</span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="password" className="font-medium text-gray-700 dark:text-gray-300">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-base text-gray-900 dark:text-white bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-colors duration-200"
            value={form.password}
            onChange={handleChange}
          />
          {errors.password && (
            <span className="text-red-500 dark:text-red-400 text-sm font-medium">{errors.password}</span>
          )}
        </div>
        <button
          type="submit"
          className="mt-2 py-3 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-semibold text-base cursor-pointer transition-colors duration-200 shadow-sm hover:shadow-md"
        >
          Log In
        </button>
      </form>
    </div>
  );
}
