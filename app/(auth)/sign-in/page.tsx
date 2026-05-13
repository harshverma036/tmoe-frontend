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
import { useMutation } from '@tanstack/react-query';
import apiConfig from '@/lib/apiConfig';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';
import appConfig from '@/lib/appConfig';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { AuthSplitLayout } from '@/components/auth/auth-split-layout';

const signInSchema = yup.object().shape({
    email: yup.string().email('Invalid email').required('Email is required'),
    password: yup.string().required('Password is required'),
})

const defaultValues = {
    email: "",
    password: ""
}

const SignIn = () => {
    const router = useRouter(); 
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

    const { mutate: signIn, isPending } = useMutation({
        mutationFn: async (payload: yup.InferType<typeof signInSchema>) => {
            const response = await apiConfig.post('/api/auth/login', payload);
            return response.data;
        },
        onSuccess: (responseData) => {
            const userInfo = responseData?.userinfo;
            const token = responseData?.token;

            Cookies.set(appConfig.cookies.userInfoKey, JSON.stringify(userInfo), { sameSite: 'lax', path: '/' });
            Cookies.set(appConfig.cookies.userTokenKey, token, { sameSite: 'lax', path: '/' });

            toast.success('Logged in successfully');
            router.push('/insights');
        },
        onError: (error: AxiosError<{ message?: string }>) => {
            toast.error(error?.response?.data?.message || 'Failed to login');
        }
    })

    const onSubmit = (data: yup.InferType<typeof signInSchema>) => {
        signIn(data);
    }

    return (
        <AuthSplitLayout>
            <Card className="w-full">
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
                        <Button type="submit" className="w-full" disabled={!isValid || isPending}>
                            {isPending ? 'Logging in...' : 'Login'}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </AuthSplitLayout>
    )
}

export default SignIn