import React from 'react';
import { useParams, Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button'; // Import Button
import { ArrowLeft } from 'lucide-react'; // Import ArrowLeft icon
import { useNavigate } from 'react-router-dom'; // Import useNavigate

const ProjectDetails: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const location = useLocation();
  const navigate = useNavigate(); // Initialize useNavigate

  // Mock project data - in a real app, this would come from an API
  const mockProject = {
    id: projectId,
    name: `项目 ${projectId}`,
    description: `这是项目 ${projectId} 的详细描述。在这里可以管理项目的资产、玩法和数据库。`,
    createdAt: '2023-01-01',
  };

  const getActiveTab = () => {
    if (location.pathname.endsWith(`/project/${projectId}`)) return 'dashboard';
    if (location.pathname.includes('/assets')) return 'assets';
    if (location.pathname.includes('/gameplay')) return 'gameplay';
    if (location.pathname.includes('/database')) return 'database';
    return 'dashboard'; // Default to dashboard
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-4">
        <Button variant="ghost" onClick={() => navigate(-1)} className="text-gray-300 hover:text-white">
          <ArrowLeft className="mr-2 h-4 w-4" /> 返回
        </Button>
      </div>
      <Card className="bg-gray-800 text-white border-gray-700 shadow-lg mb-8">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-blue-400">{mockProject.name}</CardTitle>
          <CardDescription className="text-gray-300">{mockProject.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-400">创建日期: {mockProject.createdAt}</p>
          {/* Add more project details here */}
        </CardContent>
      </Card>

      <Tabs value={getActiveTab()} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-gray-700 mb-4">
          <TabsTrigger value="dashboard" asChild>
            <Link to={`/admin/project/${projectId}`} className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-300 hover:text-white">
              仪表盘
            </Link>
          </TabsTrigger>
          <TabsTrigger value="assets" asChild>
            <Link to={`/admin/project/${projectId}/assets`} className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-300 hover:text-white">
              资产管理
            </Link>
          </TabsTrigger>
          <TabsTrigger value="gameplay" asChild>
            <Link to={`/admin/project/${projectId}/gameplay`} className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-300 hover:text-white">
              玩法管理
            </Link>
          </TabsTrigger>
          <TabsTrigger value="database" asChild>
            <Link to={`/admin/project/${projectId}/database`} className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-300 hover:text-white">
              数据库管理
            </Link>
          </TabsTrigger>
        </TabsList>
        <Outlet />
      </Tabs>
    </div>
  );
};

export default ProjectDetails;