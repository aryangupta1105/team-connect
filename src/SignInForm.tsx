"use client";
import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { toast } from "sonner";

export function SignInForm() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="w-full max-w-md mx-auto -mt-5">
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-blue-100">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-extrabold text-blue-900 mb-2 font-display bg-gradient-to-r from-orange-800 via-green-800 to-blue-900 bg-clip-text text-transparent ">
            Welcome to Team Connect
          </h2>
          <p className="text-gray-600 text-base font-medium">
            {flow === 'signIn' ? "Sign In" : "Sign Up"} to find your perfect hackathon team!
          </p>
        </div>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitting(true);
            const formData = new FormData(e.target as HTMLFormElement);
            formData.set("flow", flow);
            void signIn("password", formData).catch((error) => {
              let toastTitle = "";
              if (error.message.includes("Invalid password")) {
                toastTitle = "Invalid password. Please try again.";
              } else {
                toastTitle =
                  flow === "signIn"
                    ? "Could not sign in, did you mean to sign up?"
                    : "Could not sign up, did you mean to sign in?";
              }
              toast.error(toastTitle);
              setSubmitting(false);
            });
          }}
        >
          <input
            className="px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base font-medium bg-gray-50"
            type="email"
            name="email"
            placeholder="Email"
            required
          />
          <input
            className="px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base font-medium bg-gray-50"
            type="password"
            name="password"
            placeholder="Password"
            required
          />
          <button
            className={`w-full px-4 py-3 rounded-xl font-bold text-lg shadow transition-all bg-gradient-to-r from-orange-400 via-blue-500 to-green-500 text-white hover:scale-105 hover:shadow-xl ${submitting ? "opacity-60 cursor-not-allowed" : ""}`}
            type="submit"
            disabled={submitting}
          >
            {flow === "signIn" ? "Sign in" : "Sign up"}
          </button>
          <div className="text-center text-sm text-gray-500 mt-2">
            <span>
              {flow === "signIn"
                ? "Don't have an account? "
                : "Already have an account? "}
            </span>
            <button
              type="button"
              className="text-blue-600 hover:text-orange-600 hover:underline font-semibold cursor-pointer ml-1"
              onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
            >
              {flow === "signIn" ? "Sign up instead" : "Sign in instead"}
            </button>
          </div>
        </form>
        
      </div>
    </div>
  );
}
