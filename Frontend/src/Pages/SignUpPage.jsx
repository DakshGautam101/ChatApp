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
import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../Stores/useAuthStore";
import toast from "react-hot-toast";

export default function SignUpPage() {

    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const {signup , isLoading} = useAuthStore();
    

    const [formData , setFormData] = useState({
        username : "",
        email : "",
        password : ""
    });
    const handleSubmit = async (e) =>{
        try {
            e.preventDefault();
            const {username , email , password} = formData;
            if(!username || !email || !password){
                toast.error("Please fill all the fields.");
                return;
            }
            const success = await signup({username , email , password});

            if(success){
                toast.success("Account created successfully! Please verify your email.");
                setFormData({
                    username : "",
                    email : "" ,
                    password : ""
                })
                navigate("/verify-email");
            }

        } catch (error) {
            toast.error(error?.response?.data?.message || "Unable to create account. Please try again.");
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-2 text-center">
                    <CardTitle className="text-3xl font-bold">
                        Create an Account
                    </CardTitle>
                    <CardDescription>
                        Enter your details below to create your account.
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <form className="space-y-5">

                        <div className="space-y-2">
                            <Label htmlFor="fullname">Full Name :</Label>
                            <Input
                                id="fullname"
                                type="text"
                                placeholder="Enter your full name"
                                value={formData.username}
                                onChange={(e)=> setFormData({...formData , username : e.target.value})}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email :</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="Enter your email"
                                value={formData.email}
                                onChange={(e)=> setFormData({...formData , email : e.target.value})}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password :</Label>

                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter your password"
                                    value={formData.password}
                                    onChange={(e)=> setFormData({...formData , password : e.target.value})}
                                    className="pr-10"
                                />

                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-5 w-5" />
                                    ) : (
                                        <Eye className="h-5 w-5" />
                                    )}
                                </button>
                            </div>
                        </div>
                        <Button className="w-full" type="submit" onClick={(e)=>handleSubmit(e)}>
                            {isLoading ? <Loader2 className="animate-spin"/> : "Create account"} 
                        </Button>
                    </form>
                </CardContent>

                <CardFooter className="flex flex-col gap-3">
                    <p className="text-center text-sm text-muted-foreground">
                        Already have an account?{" "}
                        <Button variant="link" className="h-auto p-0" onClick={() => navigate("/login")}>
                            Sign In
                        </Button>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}