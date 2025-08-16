import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const Register: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('http://localhost:3001/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token); // Store the JWT token
        localStorage.setItem('user', JSON.stringify(data.user)); // Store user info
        toast({
          title: "注册成功",
          description: "您的账户已创建并登录成功。",
        });
        navigate('/home'); // Redirect to player home page
      } else {
        toast({
          title: "注册失败",
          description: data.message || "注册失败，请重试。",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Register error:", error);
      toast({
        title: "错误",
        description: "无法连接到服务器，请稍后再试。",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-4">
      <Card className="w-full max-w-md bg-gray-800 text-white border-gray-700 shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-blue-400">注册</CardTitle>
          <CardDescription className="text-gray-300">
            创建一个新账户来开始您的游戏开发之旅。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-6">
            <div className="grid gap-2">
              <Label htmlFor="username" className="text-gray-300">用户名</Label>
              <Input
                id="username"
                type="text"
                placeholder="选择一个用户名"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="bg-gray-700 border-gray-600 text-white focus:border-blue-500"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email" className="text-gray-300">邮箱 (可选)</Label>
              <Input
                id="email"
                type="email"
                placeholder="您的邮箱地址"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white focus:border-blue-500"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password" className="text-gray-300">密码</Label>
              <Input
                id="password"
                type="password"
                placeholder="设置您的密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-gray-700 border-gray-600 text-white focus:border-blue-500"
              />
            </div>
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              注册
            </Button>
          </form>
          <div className="mt-6 text-center text-sm text-gray-400">
            已经有账户了？{" "}
            <Link to="/login" className="text-blue-400 hover:underline">
              立即登录
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;