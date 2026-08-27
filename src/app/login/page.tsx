import type { Metadata } from "next";
import { AuthFrame } from "@/components/auth/AuthFrame";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Login",
};

export default function LoginPage() {
  return (
    <AuthFrame title="Sign in">
      <LoginForm />
    </AuthFrame>
  );
}
