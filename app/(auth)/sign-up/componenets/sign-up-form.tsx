"use client";

import Link from "next/link";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import * as yup from "yup";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const signUpSchema = yup
  .object({
    name: yup.string().trim().required("Name is required"),
    email: yup.string().email("Invalid email").required("Email is required"),
    website_url: yup.string().optional(),
    password: yup.string().trim().required("Password is required"),
  })
  .required();

const defaultValues = {
  name: "",
  email: "",
  website_url: "",
  password: "",
};

const SignUpForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm({
    defaultValues,
    resolver: yupResolver(signUpSchema),
    mode: "onTouched",
  });

  const onSubmit = (data: yup.InferType<typeof signUpSchema>) => {
    console.log(data);
  };

  return (
    <div className="flex h-screen items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Create your account</CardTitle>
          <CardDescription>
            Fill in your details below to sign up for TMOE.
          </CardDescription>
          <CardAction>
            <Button asChild variant="link">
              <Link href="/sign-in">Sign In</Link>
            </Button>
          </CardAction>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <CardContent>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  {...register("name")}
                  errorMessage={errors?.name?.message}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@tmoe.com"
                  {...register("email")}
                  errorMessage={errors?.email?.message}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="website_url">Website (Optional)</Label>
                <Input
                  id="website_url"
                  type="url"
                  placeholder="https://your-site.com"
                  {...register("website_url")}
                  errorMessage={errors?.website_url?.message}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  {...register("password")}
                  errorMessage={errors?.password?.message}
                />
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex-col gap-2">
            <Button type="submit" className="w-full" disabled={!isValid}>
              Create Account
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default SignUpForm;
