"use client";

import Link from "next/link";
import Cookies from "js-cookie";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import apiConfig from "@/lib/apiConfig";
import appConfig from "@/lib/appConfig";

const VerifyEmailPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "your email";
  const isValidEmail = Boolean(email && email !== "your email");

  const { data: userData } = useQuery({
    queryKey: ["single-user-by-email", email],
    enabled: isValidEmail,
    queryFn: async () => {
      const response = await apiConfig.get("/api/users/single", {
        params: { email },
      });

      return response?.data?.data;
    },
    refetchInterval: 3000,
    retry: false,
  });
  useEffect(() => {
    if (!userData?.email_verified_at || !userData?.id) {
      return;
    }

    Cookies.set(appConfig.cookies.userInfoKey, JSON.stringify(userData), {
      sameSite: "lax",
      path: "/",
    });
    const role = String(userData?.role ?? "PUBLISHER").toUpperCase();
    const type =
      role === "BRAND" || role === "PUBLISHER" ? role : "PUBLISHER";
    router.push(`/complete-profile?type=${encodeURIComponent(type)}`);
  }, [router, userData]);

  return (
    <div className="flex min-h-screen w-full items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2">
          <CardTitle>Check your inbox</CardTitle>
          <CardDescription>
            A verification link has been sent to <span className="font-medium text-foreground">{email}</span>.
            Please check your email and verify your account.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <p className="text-sm text-muted-foreground">
            If you do not see the email, please check your spam folder or resend the link.
          </p>
        </CardContent>

        <CardFooter className="flex flex-col gap-3 sm:flex-row">
          <Button type="button" variant="outline" className="w-full sm:flex-1">
            Resend link
          </Button>
          <Button asChild className="w-full sm:flex-1">
            <Link href="/sign-in">Login</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default VerifyEmailPage;