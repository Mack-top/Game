import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Button } from '../components/ui/button';
import { useToast } from '../hooks/use-toast';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import { ArrowLeft } from 'lucide-react'; // Import ArrowLeft icon

const Settings: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate(); // Initialize useNavigate

  const handleSaveSettings = () => {
    toast({
      title: "设置已保存",
      description: "您的设置已成功更新。",
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-4">
        <Button variant="ghost" onClick={() => navigate(-1)} className="text-gray-300 hover:text-white">
          <ArrowLeft className="mr-2 h-4 w-4" /> 返回
        </Button>
      </div>
      <Card className="bg-gray-800 text-white border-gray-700 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-blue-400">设置</CardTitle>
          <CardDescription className="text-gray-300">管理您的应用偏好和配置。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="darkMode" className="text-gray-300">深色模式</Label>
            <Switch id="darkMode" className="data-[state=checked]:bg-blue-600" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="language" className="text-gray-300">语言</Label>
            <Select>
              <SelectTrigger id="language" className="bg-gray-700 border-gray-600 text-white focus:ring-blue-500">
                <SelectValue placeholder="选择语言" />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 text-white border-gray-600">
                <SelectItem value="zh-CN">简体中文</SelectItem>
                <SelectItem value="en-US">English</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="notifications" className="text-gray-300">通知</Label>
            <div className="flex items-center space-x-4">
              <Switch id="notifications" className="data-[state=checked]:bg-blue-600" />
              <span className="text-sm text-gray-400">接收应用通知</span>
            </div>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSaveSettings}>
            保存设置
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;