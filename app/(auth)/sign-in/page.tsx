"use client";

import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { yupResolver } from '@hookform/resolvers/yup'
import Link from 'next/link';
import { useForm } from 'react-hook-form'
import * as yup from 'yup';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

const signInSchema = yup.object().shape({
    email: yup.string().email('Invalid email').required('Email is required'),
    password: yup.string().required('Password is required'),
})

const defaultValues = {
    email: "",
    password: ""
}

const SignIn = () => {
    const {
        handleSubmit,
        register,
        formState: {
            errors,
            isValid,

        }
    } = useForm({
        defaultValues,
        resolver: yupResolver(signInSchema),
        mode: 'onTouched'
    })

    const onSubmit = (data: typeof defaultValues) => {
        console.log(data);
    }

    return (
        <div className='h-screen flex items-center justify-center'>
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle>Login to your account</CardTitle>
                    <CardDescription>
                        Enter your email below to login to your account
                    </CardDescription>
                    <CardAction>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="link">Sign Up</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Choose account type</DialogTitle>
                                    <DialogDescription>
                                        Select how you want to sign up.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="flex flex-col gap-3 pt-2">
                                    <Button asChild variant="outline" className="h-16 w-full text-base">
                                        <Link href="/sign-up?type=BRAND">Brand</Link>
                                    </Button>
                                    <Button asChild variant="outline" className="h-16 w-full text-base">
                                        <Link href="/sign-up?type=PUBLISHER">Publisher</Link>
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </CardAction>
                </CardHeader>
                <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
                    <CardContent>
                        <div className="flex flex-col gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="example@tmoe.com"
                                    required
                                    {...register('email')}
                                    errorMessage={errors?.email?.message}
                                />
                            </div>
                            <div className="grid gap-2">
                                <div className="flex items-center">
                                    <Label htmlFor="password">Password</Label>
                                    {/* <a
                                        href="#"
                                        className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                                    >
                                        Forgot your password?
                                    </a> */}
                                </div>
                                <Input id="password" type="password" required {...register('password')} errorMessage={errors?.password?.message} />
                            </div>
                        </div>

                    </CardContent>
                    <CardFooter className="flex-col gap-2">
                        <Button type="submit" className="w-full" disabled={!isValid}>
                            Login
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}

export default SignIn