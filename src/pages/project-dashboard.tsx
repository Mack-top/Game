import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Code, Database, Image, CalendarCheck, ArrowLeft } from 'lucide-react'; // Import ArrowLeft icon
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom'; // Import useNavigate

interface Activity {
  id: string;
  type: string;
  description: string;
  timestamp: string; // Assuming backend returns ISO string
}

const ProjectDashboard: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [assetCount, setAssetCount] = useState(0);
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate(); // Initialize useNavigate

  // Mock data for project details (will be fetched from /api/projects/:id in project-details.tsx)
  const mockProjectDetails = {
    id: projectId,
    name: `项目 ${projectId}`,
    description: `这是项目 ${projectId} 的仪表盘。在这里您可以快速了解项目的概况和关键数据。`,
    createdAt: '2023-01-01',
    lastUpdated: '2023-08-16',
    // gameplayRuleCount and databaseTableCount are still mock as no direct backend API
    gameplayRuleCount: 15,
    databaseTableCount: 5,
  };

  useEffect(() => {
    const fetchAssetCount = async () => {
      try {
        const response = await fetch(`http://localhost:3002/api/assets?projectId=${projectId}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setAssetCount(data.length);
      } catch (error) {
        console.error("Failed to fetch asset count:", error);
        toast({
          title: "加载失败",
          description: "无法加载资产数量。",
          variant: "destructive",
        });
      }
    };

    const fetchRecentActivities = async () => {
      try {
        const response = await fetch('http://localhost:3002/api/activities');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: Activity[] = await response.json();
        setRecentActivities(data);
      } catch (error) {
        console.error("Failed to fetch recent activities:", error);
        toast({
          title: "加载失败",
          description: "无法加载最近活动。",
          variant: "destructive",
        });
      }
    };

    fetchAssetCount();
    fetchRecentActivities();
  }, [projectId, toast]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-4">
        <Button variant="ghost" onClick={() => navigate(-1)} className="text-gray-300 hover:text-white">
          <ArrowLeft className="mr-2 h-4 w-4" /> 返回
        </Button>
      </div>
      <Card className="bg-gray-800 text-white border-gray-700 shadow-lg mb-8">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-blue-400">项目 {mockProjectDetails.name} - 仪表盘</CardTitle>
          <CardDescription className="text-gray-300">{mockProjectDetails.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-400">创建日期: {mockProjectDetails.createdAt}</p>
          <p className="text-sm text-gray-400">最近更新: {mockProjectDetails.lastUpdated}</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Key Statistics */}
        <Card className="bg-gradient-to-br from-blue-900 to-purple-900 text-white shadow-lg border-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">资产总数</CardTitle>
            <Image className="h-5 w-5 text-blue-300" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assetCount}</div>
            <p className="text-xs text-gray-300">已上传的游戏资产</p>
            <Link to={`/project/${projectId}/assets`}>
              <Button variant="link" className="text-blue-200 hover:text-blue-100 p-0 h-auto mt-2">
                查看所有资产 <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-900 to-teal-900 text-white shadow-lg border-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">玩法规则</CardTitle>
            <Code className="h-5 w-5 text-green-300" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockProjectDetails.gameplayRuleCount}</div>
            <p className="text-xs text-gray-300">已定义的玩法逻辑</p>
            <Link to={`/project/${projectId}/gameplay`}>
              <Button variant="link" className="text-green-200 hover:text-green-100 p-0 h-auto mt-2">
                管理玩法 <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-900 to-orange-900 text-white shadow-lg border-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">数据表</CardTitle>
            <Database className="h-5 w-5 text-red-300" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockProjectDetails.databaseTableCount}</div>
            <p className="text-xs text-gray-300">已创建的数据库表</p>
            <Link to={`/project/${projectId}/database`}>
              <Button variant="link" className="text-red-200 hover:text-red-100 p-0 h-auto mt-2">
                管理数据库 <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <Card className="bg-gray-800 text-white border-gray-700 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-200">最近活动</CardTitle>
          <CardDescription className="text-gray-400">项目内的最新操作记录。</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-4">
            {recentActivities.map((activity) => (
              <li key={activity.id} className="flex items-start space-x-3">
                <CalendarCheck className="h-5 w-5 text-blue-400 mt-1 shrink-0" />
                <div>
                  <p className="text-gray-200">
                    <span className="font-semibold text-blue-300">[{activity.type}]</span> {activity.description}
                  </p>
                  <p className="text-xs text-gray-500">{new Date(activity.timestamp).toLocaleString()}</p>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectDashboard;