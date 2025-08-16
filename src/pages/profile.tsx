import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import { ArrowLeft } from 'lucide-react'; // Import ArrowLeft icon

interface UserProfile {
  username: string;
  email?: string;
  createdAt?: string;
}

const Profile: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate(); // Initialize useNavigate

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      toast({
        title: "未登录",
        description: "请先登录以查看个人资料。",
        variant: "destructive",
      });
    }
  }, []);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-gray-100">
        <Card className="w-full max-w-md bg-gray-800 text-white border-gray-700 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-blue-400">个人资料</CardTitle>
            <CardDescription className="text-gray-300">加载中或未登录...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-4">
        <Button variant="ghost" onClick={() => navigate(-1)} className="text-gray-300 hover:text-white">
          <ArrowLeft className="mr-2 h-4 w-4" /> 返回
        </Button>
      </div>
      <Card className="bg-gray-800 text-white border-gray-700 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-blue-400">个人资料</CardTitle>
          <CardDescription className="text-gray-300">查看和管理您的账户信息。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-2">
            <Label htmlFor="username" className="text-gray-300">用户名</Label>
            <Input
              id="username"
              type="text"
              value={user.username}
              readOnly
              className="bg-gray-700 border-gray-600 text-white focus:border-blue-500"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email" className="text-gray-300">邮箱</Label>
            <Input
              id="email"
              type="email"
              value={user.email || '未设置'}
              readOnly
              className="bg-gray-700 border-gray-600 text-white focus:border-blue-500"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="createdAt" className="text-gray-300">注册日期</Label>
            <Input
              id="createdAt"
              type="text"
              value={user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '未知'}
              readOnly
              className="bg-gray-700 border-gray-600 text-white focus:border-blue-500"
            />
          </div>
          {/* Future: Add edit functionality */}
          <Button className="bg-blue-600 hover:bg-blue-700 text-white" disabled>
            编辑资料 (待开发)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;