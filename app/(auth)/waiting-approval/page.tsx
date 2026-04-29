"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const WaitingApproval = () => {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    router.replace("/sign-in");
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-3">
          <div className="inline-flex w-fit items-center rounded-full border border-amber-300 bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
            Approval Pending
          </div>
          <CardTitle>Your account is under review</CardTitle>
          <CardDescription>
            Your brand profile has been created successfully and sent to the
            admin team for verification. You will get dashboard access once it
            is approved.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <div className="rounded-md border bg-muted/40 p-4">
            <p className="font-medium text-foreground">What happens next?</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Admin reviews your submitted details.</li>
              <li>After approval, dashboard access is enabled automatically.</li>
              <li>If anything is missing, the team may reach out to you.</li>
            </ul>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-2 sm:flex-row">
          <Button asChild className="w-full sm:w-auto">
            <Link href="mailto:support@tmoe.com">Contact support</Link>
          </Button>
          <Button variant='secondary' className="w-full sm:w-auto cursor-pointer" onClick={handleLogout}>
            Logout
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default WaitingApproval;