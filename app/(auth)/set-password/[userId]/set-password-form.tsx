"use client";

import { yupResolver } from "@hookform/resolvers/yup";
import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import * as yup from "yup";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import apiConfig from "@/lib/apiConfig";

const setPasswordSchema = yup
  .object({
    password: yup.string().trim().required("Password is required"),
    confirmPassword: yup
      .string()
      .trim()
      .required("Please confirm your password")
      .oneOf([yup.ref("password")], "Passwords must match"),
  })
  .required();

type SetPasswordFormProps = {
  userId: string;
  inviteToken: string | undefined;
};

const SetPasswordForm = ({ userId, inviteToken }: SetPasswordFormProps) => {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm({
    defaultValues: { password: "", confirmPassword: "" },
    resolver: yupResolver(setPasswordSchema),
    mode: "onTouched",
  });

  const { mutate: setPassword, isPending } = useMutation({
    mutationFn: async (password: string) => {
      const response = await apiConfig.post("/api/users/set-new-user-password", {
        userId,
        invite_token: inviteToken,
        password,
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success("Password set successfully. You can sign in.");
      router.push("/sign-in");
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(
        error?.response?.data?.message || "Failed to set password. Try again.",
      );
    },
  });

  const onSubmit = (data: yup.InferType<typeof setPasswordSchema>) => {
    if (!inviteToken) {
      toast.error("This invite link is missing a token.");
      return;
    }
    setPassword(data.password);
  };

  const invalidLink = !inviteToken;

  return (
    <div className="h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Set your password</CardTitle>
          <CardDescription>
            Choose a password for your account. You will use it to sign in.
          </CardDescription>
        </CardHeader>
        {invalidLink ? (
          <CardContent>
            <p className="text-sm text-destructive">
              This link is invalid or incomplete. Open the invite link from your
              email again, or contact your administrator.
            </p>
          </CardContent>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <CardContent>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    {...register("password")}
                    errorMessage={errors.password?.message}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirmPassword">Confirm password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    {...register("confirmPassword")}
                    errorMessage={errors.confirmPassword?.message}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex-col gap-2">
              <Button
                type="submit"
                className="w-full"
                disabled={!isValid || isPending}
              >
                {isPending ? "Saving…" : "Set Password"}
              </Button>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
};

export default SetPasswordForm;
