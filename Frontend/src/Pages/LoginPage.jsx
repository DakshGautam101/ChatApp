import React, { useEffect, useState } from 'react'
import useAuthStore from '../Stores/useAuthStore';
import { Button } from '../components/ui/button.jsx'
import { toast } from 'react-hot-toast';
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useNavigate } from 'react-router-dom';




const LoginPage = () => {
    const {
        isLoading,
        login,
        isAuthenticated,
    } = useAuthStore();

    const navigate = useNavigate();

    useEffect(() => {
        if (isAuthenticated) {
            navigate("/");
        }
    }, [isAuthenticated, navigate])

    const handleSignUpClick = () => {
        navigate("/signup");
    }

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!email || !password) {
            toast.error("Please enter both email and password");
            return;
        }
        try {
            const success = await login(email, password);
            if (success) {
                toast.success("Login successful");
            }
        } catch (error) {
            console.error("Login failed:", error);
            const msg = error?.response?.data?.message || "Login failed. Please check your credentials and try again.";
            toast.error(msg);
        }
    }

    return (
        <>
            <div className="min-h-screen flex flex-col items-center justify-center gap-10 px-4"> 
                <div className="flex flex-col items-center gap-2 mt-4">
                    <h1 className="text-4xl font-extrabold tracking-tight text-center sm:text-5xl">
                        Chat App
                    </h1>
                </div>
                <Card className="w-full max-w-sm">
                    <CardHeader>
                        <CardTitle>Login to your account</CardTitle>
                        <CardDescription>
                            Enter your email below to login to your account
                        </CardDescription>
                        <CardAction>
                            <Button variant="link" onClick={handleSignUpClick}>
                                Sign Up
                            </Button>
                        </CardAction>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleLogin}>
                            <div className="flex flex-col gap-6">
                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="m@example.com"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <div className="flex items-center">
                                        <Label htmlFor="password">Password</Label>
                                        <a
                                            href="#"
                                            className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                                        >
                                            Forgot your password?
                                        </a>
                                    </div>
                                    <Input id="password" type="password" required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>
                            <CardFooter className="flex-col gap-2">
                                <Button type="submit" className="w-full" onClick={handleLogin} disabled={isLoading}>
                                    {isLoading ? "Logging in..." : "Login"}
                                </Button>
                            </CardFooter>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </>
    )
}

export default LoginPage
