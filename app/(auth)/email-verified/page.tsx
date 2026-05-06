"use client";

import Cookies from "js-cookie";
import { useEffect, useState, useSyncExternalStore } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AxiosError } from "axios";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import apiConfig from "@/lib/apiConfig";
import appConfig from "@/lib/appConfig";

type VerifyUserApiBody = {
    message?: string;
    data?: {
        id: string;
        email: string;
        email_verified_at: string | null;
    };
};

function subscribeToNothing() {
    return () => { };
}

function useIsClient() {
    return useSyncExternalStore(
        subscribeToNothing,
        () => true,
        () => false
    );
}

function resolveProfileTypeFromCookie(): string {
    const raw = Cookies.get(appConfig.cookies.userInfoKey);
    if (!raw) return "PUBLISHER";
    try {
        const user = JSON.parse(raw) as { role?: string };
        const role = String(user?.role ?? "PUBLISHER").toUpperCase();
        return role === "BRAND" || role === "PUBLISHER" ? role : "PUBLISHER";
    } catch {
        return "PUBLISHER";
    }
}

const EmailVerifiedPage = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const isClient = useIsClient();
    const [countdown, setCountdown] = useState<number | null>(null);
    const userId = searchParams.get("id");

    const {
        data,
        isLoading,
        isError,
        error,
        isSuccess,
    } = useQuery({
        queryKey: ["auth", "verify-user", userId],
        enabled: Boolean(userId),
        queryFn: async () => {
            const response = await apiConfig.get<VerifyUserApiBody>("/api/auth/verify-user", {
                params: { id: userId },
            });
            return response.data;
        },
        retry: false,
        staleTime: Infinity,
    });

    useEffect(() => {
        if (!isSuccess || !data?.data?.email_verified_at) return;

        const startId = window.setTimeout(() => {
            setCountdown(3);
        }, 0);

        return () => window.clearTimeout(startId);
    }, [data, isSuccess]);

    useEffect(() => {
        if (countdown === null) return;
        if (countdown <= 0) {
            router.replace(
                `/sign-in`
            );
            return;
        }
        const tickId = window.setTimeout(() => {
            setCountdown((c) => (c === null ? c : c - 1));
        }, 1000);
        return () => window.clearTimeout(tickId);
    }, [countdown, router]);

    const axiosError = error as AxiosError<{ message?: string }> | undefined;
    const errorMessage =
        axiosError?.response?.data?.message ??
        axiosError?.message ??
        "Something went wrong.";

    //   const showSessionError = isClient && !hasToken;
    const showMissingIdError = !userId;

    const cardTitle = (() => {
        if (!isClient) return "Verifying";
        if (showMissingIdError || isError) return "Could not verify email";
        return "Email verified successfully";
    })();

    const cardBody = (() => {
        if (!isClient) {
            return (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Preparing…
                </div>
            );
        }
        // if (showSessionError) {
        //   return (
        //     <p className="text-sm text-muted-foreground">
        //       You need to be signed in to complete verification. Please sign in and
        //       open the verification link again.
        //     </p>
        //   );
        // }
        if (showMissingIdError) {
            return (
                <p className="text-sm text-muted-foreground">
                    Verification link is invalid because user id is missing.
                </p>
            );
        }
        if (isLoading) {
            return (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Verifying your email…
                </div>
            );
        }
        if (isError) {
            return (
                <p className="text-sm text-muted-foreground">{errorMessage}</p>
            );
        }
        return (
            <p className="text-sm text-muted-foreground">
                Your email has been confirmed. You will be redirected to finish your
                profile.
            </p>
        );
    })();

    return (
        <div className="flex min-h-screen w-full items-center justify-center px-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-2">
                    <CardTitle>{cardTitle}</CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">{cardBody}</CardContent>

                <CardFooter className="flex flex-col gap-2">
                    {isSuccess && countdown !== null && countdown > 0 ? (
                        <Button type="button" className="w-full" disabled>
                            Redirecting ({countdown}s)
                        </Button>
                    ) : null}
                    {showMissingIdError || isError ? (
                        <Button asChild className="w-full" variant="default">
                            <Link href="/sign-in">Sign in</Link>
                        </Button>
                    ) : null}
                </CardFooter>
            </Card>
        </div>
    );
};

export default EmailVerifiedPage;
