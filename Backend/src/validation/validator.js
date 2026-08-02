import {z} from 'zod';

const registerSchema = z.object({
    username: z.string().min(3, {message: "Username must be at least 3 characters long"}),
    email: z.string().email({message: "Please provide a valid email"}),
    password: z.string().min(6, {message: "Password must be at least 6 characters long"})
})

const loginSchema = z.object({
    email: z.string().email({message: "Please provide a valid email"}),
    password: z.string().min(6, {message: "Password must be at least 6 characters long"})
})

