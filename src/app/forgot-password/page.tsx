import type { Metadata } from "next";
import { AuthFrame } from "@/components/auth/AuthFrame";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Forgot password",
};

export default function ForgotPasswordPage() {
  return (
    <AuthFrame title="Password assistance">
      <ForgotPasswordForm />
    </AuthFrame>
  );
}
