import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router';
import { useLoginMutation, useRegisterMutation } from '../redux/api/authApi';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "react-hot-toast";

const loginSchema = z.object({
  identifier: z.string().min(3, "Username or email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();
  
  const [login, { isLoading: isLoginLoading }] = useLoginMutation();
  const [register, { isLoading: isRegisterLoading }] = useRegisterMutation();

  const { register: loginRegister, handleSubmit: handleLoginSubmit, formState: { errors: loginErrors } } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const { register: registerRegister, handleSubmit: handleRegisterSubmit, formState: { errors: registerErrors } } = useForm({
    resolver: zodResolver(registerSchema),
  });

  const onLoginSubmit = async (data) => {
    try {
      const payload = await login(data).unwrap();
      toast.success(payload.message || 'Logged in successfully!');
      navigate('/');
    } catch (err) {
      toast.error(err.data?.message || 'Failed to login');
    }
  };

  const onRegisterSubmit = async (data) => {
    try {
      const { confirmPassword, ...registerData } = data;
      const payload = await register(registerData).unwrap();
      toast.success(payload.message || 'Registered successfully!');
      navigate('/');
    } catch (err) {
      toast.error(err.data?.message || 'Failed to register');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-black pointer-events-none" />
      
      <div className="w-full max-w-md relative z-10">
        <Card className="border-zinc-800 bg-zinc-950/50 backdrop-blur-xl shadow-2xl text-zinc-100">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold tracking-tight text-center">
              {isLogin ? 'Welcome back' : 'Create an account'}
            </CardTitle>
            <CardDescription className="text-zinc-400 text-center">
              {isLogin ? 'Enter your credentials to enter the cube' : 'Sign up to start competing'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLogin ? (
              <form onSubmit={handleLoginSubmit(onLoginSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="identifier" className="text-zinc-300">Username or Email</Label>
                  <Input id="identifier" placeholder="cuber123" className="bg-zinc-900 border-zinc-800 text-white" {...loginRegister("identifier")} />
                  {loginErrors.identifier && <p className="text-sm text-red-400">{loginErrors.identifier.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-zinc-300">Password</Label>
                  <Input id="password" type="password" placeholder="••••••••" className="bg-zinc-900 border-zinc-800 text-white" {...loginRegister("password")} />
                  {loginErrors.password && <p className="text-sm text-red-400">{loginErrors.password.message}</p>}
                </div>
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={isLoginLoading}>
                  {isLoginLoading ? 'Logging in...' : 'Sign In'}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit(onRegisterSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reg-username" className="text-zinc-300">Username</Label>
                  <Input id="reg-username" placeholder="cuber123" className="bg-zinc-900 border-zinc-800 text-white" {...registerRegister("username")} />
                  {registerErrors.username && <p className="text-sm text-red-400">{registerErrors.username.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-email" className="text-zinc-300">Email</Label>
                  <Input id="reg-email" type="email" placeholder="cuber@example.com" className="bg-zinc-900 border-zinc-800 text-white" {...registerRegister("email")} />
                  {registerErrors.email && <p className="text-sm text-red-400">{registerErrors.email.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-password" className="text-zinc-300">Password</Label>
                  <Input id="reg-password" type="password" placeholder="••••••••" className="bg-zinc-900 border-zinc-800 text-white" {...registerRegister("password")} />
                  {registerErrors.password && <p className="text-sm text-red-400">{registerErrors.password.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-confirm" className="text-zinc-300">Confirm Password</Label>
                  <Input id="reg-confirm" type="password" placeholder="••••••••" className="bg-zinc-900 border-zinc-800 text-white" {...registerRegister("confirmPassword")} />
                  {registerErrors.confirmPassword && <p className="text-sm text-red-400">{registerErrors.confirmPassword.message}</p>}
                </div>
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={isRegisterLoading}>
                  {isRegisterLoading ? 'Registering...' : 'Sign Up'}
                </Button>
              </form>
            )}
          </CardContent>
          <CardFooter>
            <Button 
              variant="ghost" 
              className="w-full text-zinc-400 hover:text-white hover:bg-zinc-900"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
