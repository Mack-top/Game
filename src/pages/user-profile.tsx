import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Settings as SettingsIcon, Gamepad, Trophy, ArrowLeft } from 'lucide-react'; // Import ArrowLeft icon
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom'; // Import useNavigate

interface UserProfileData {
  id: number;
  username: string;
  email: string;
  // Add other user-specific fields if available from the backend
  // For now, using placeholder for level, signature, playtime, achievements, gamesPlayed
  level?: number;
  signature?: string;
  playtime?: string;
  achievementsCount?: number;
  gamesPlayedCount?: number;
}

interface GameHistoryItem {
  id: number;
  gameId: number;
  gameTitle: string;
  gameCoverImage: string;
  lastPlayed: string; // ISO string date
}

interface Achievement {
  id: number;
  name: string;
  description: string;
  icon?: string; // Optional icon URL
  unlockedAt: string; // ISO string date
  gameTitle?: string; // Optional, if achievement is game-specific
}

const UserProfile: React.FC = () => {
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [gameHistory, setGameHistory] = useState<GameHistoryItem[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate(); // Initialize useNavigate

  useEffect(() => {
    const fetchUserData = async () => {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) {
        toast({
          title: "未登录",
          description: "请先登录以查看个人资料。",
          variant: "destructive",
        });
        // Optionally redirect to login if not logged in
        // navigate('/login'); 
        return;
      }

      const user = JSON.parse(storedUser);
      const userId = user.id;
      const token = localStorage.getItem('token');

      if (!userId || !token) {
        toast({
          title: "认证失败",
          description: "无法获取用户ID或认证信息。",
          variant: "destructive",
        });
        return;
      }

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      };

      try {
        // Fetch User Profile
        const profileResponse = await fetch(`http://localhost:3001/api/player/profile/${userId}`, { headers });
        if (profileResponse.ok) {
          const profileData: UserProfileData = await profileResponse.json();
          // Add placeholder data if not available from backend
          setUserProfile({
            ...profileData,
            level: 15, // Placeholder
            signature: '探索无限游戏世界！', // Placeholder
            playtime: '1200 小时', // Placeholder
            achievementsCount: 85, // Placeholder
            gamesPlayedCount: 30, // Placeholder
          });
        } else {
          toast({
            title: "加载失败",
            description: "无法加载用户资料。",
            variant: "destructive",
          });
        }

        // Fetch Game History
        const historyResponse = await fetch(`http://localhost:3001/api/player/history/${userId}`, { headers });
        if (historyResponse.ok) {
          const historyData: GameHistoryItem[] = await historyResponse.json();
          setGameHistory(historyData);
        } else {
          toast({
            title: "加载失败",
            description: "无法加载游戏历史。",
            variant: "destructive",
          });
        }

        // Fetch Achievements
        const achievementsResponse = await fetch(`http://localhost:3001/api/player/achievements/${userId}`, { headers });
        if (achievementsResponse.ok) {
          const achievementsData: Achievement[] = await achievementsResponse.json();
          setAchievements(achievementsData);
        } else {
          toast({
            title: "加载失败",
            description: "无法加载成就。",
            variant: "destructive",
          });
        }

      } catch (error) {
        console.error("Failed to fetch user data:", error);
        toast({
          title: "错误",
          description: "连接服务器失败，请检查网络。",
          variant: "destructive",
        });
      }
    };

    fetchUserData();
  }, [toast]);

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center">
        <p>加载用户资料中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-4">
          <Button variant="ghost" onClick={() => navigate(-1)} className="text-gray-300 hover:text-white">
            <ArrowLeft className="mr-2 h-4 w-4" /> 返回
          </Button>
        </div>
        <h1 className="text-4xl font-bold text-blue-400 mb-8 text-center">个人中心</h1>

        {/* User Overview Card */}
        <Card className="bg-white/10 backdrop-blur-md border border-blue-400/20 text-white p-6 rounded-lg shadow-lg mb-8 flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
          <Avatar className="w-24 h-24 border-4 border-blue-500 shadow-lg">
            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${userProfile.username}`} alt={userProfile.username} />
            <AvatarFallback className="bg-blue-600 text-white text-3xl">{userProfile.username.substring(0, 2)}</AvatarFallback>
          </Avatar>
          <div className="text-center md:text-left">
            <CardTitle className="text-3xl font-bold text-blue-200">{userProfile.username}</CardTitle>
            <CardDescription className="text-blue-100 mt-1">等级: {userProfile.level} | {userProfile.signature}</CardDescription>
            <Button variant="outline" className="mt-4 border-blue-500 text-blue-300 hover:bg-blue-600 hover:text-white">
              <SettingsIcon className="mr-2 h-4 w-4" /> 编辑资料
            </Button>
          </div>
        </Card>

        {/* Data Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white/10 backdrop-blur-md border border-blue-400/20 text-white p-6 rounded-lg shadow-lg text-center">
            <CardTitle className="text-2xl font-bold text-blue-400">{userProfile.playtime}</CardTitle>
            <CardDescription className="text-blue-100">总游玩时长</CardDescription>
          </Card>
          <Card className="bg-white/10 backdrop-blur-md border border-blue-400/20 text-white p-6 rounded-lg shadow-lg text-center">
            <CardTitle className="text-2xl font-bold text-blue-400">{userProfile.achievementsCount}</CardTitle>
            <CardDescription className="text-blue-100">成就点数</CardDescription>
          </Card>
          <Card className="bg-white/10 backdrop-blur-md border border-blue-400/20 text-white p-6 rounded-lg shadow-lg text-center">
            <CardTitle className="text-2xl font-bold text-blue-400">{userProfile.gamesPlayedCount}</CardTitle>
            <CardDescription className="text-blue-100">已玩游戏</CardDescription>
          </Card>
        </div>

        {/* Game History and Achievements */}
        <Tabs defaultValue="history" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white/10 backdrop-blur-md border border-blue-400/20 text-blue-200">
            <TabsTrigger value="history" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Gamepad className="mr-2 h-4 w-4" /> 游戏历史
            </TabsTrigger>
            <TabsTrigger value="achievements" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Trophy className="mr-2 h-4 w-4" /> 已解锁成就
            </TabsTrigger>
          </TabsList>
          <TabsContent value="history" className="mt-4">
            <Card className="bg-white/10 backdrop-blur-md border border-blue-400/20 text-white p-6 rounded-lg shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-blue-400">最近游玩</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  {gameHistory.length > 0 ? (
                    gameHistory.map((item) => (
                      <li key={item.id} className="flex items-center space-x-4 p-2 rounded-md hover:bg-white/5 transition-colors duration-200">
                        <img src={item.gameCoverImage || `/placeholder.svg?height=100&width=150&text=${item.gameTitle}`} alt={item.gameTitle} className="w-16 h-10 object-cover rounded-sm" />
                        <div>
                          <p className="font-semibold text-blue-200">{item.gameTitle}</p>
                          <p className="text-sm text-gray-400">上次游玩: {new Date(item.lastPlayed).toLocaleDateString()}</p>
                        </div>
                      </li>
                    ))
                  ) : (
                    <p className="text-gray-400">暂无游戏历史记录。</p>
                  )}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="achievements" className="mt-4">
            <Card className="bg-white/10 backdrop-blur-md border border-blue-400/20 text-white p-6 rounded-lg shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-blue-400">已解锁成就</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  {achievements.length > 0 ? (
                    achievements.map((achievement) => (
                      <li key={achievement.id} className="flex items-center space-x-4 p-2 rounded-md hover:bg-white/5 transition-colors duration-200">
                        <img src={achievement.icon || `/placeholder.svg?height=32&width=32&text=${achievement.name.substring(0, 3)}`} alt={achievement.name} className="w-8 h-8 object-cover rounded-full" />
                        <div>
                          <p className="font-semibold text-blue-200">{achievement.name}</p>
                          <p className="text-sm text-gray-400">{achievement.description}</p>
                          {achievement.gameTitle && <p className="text-xs text-gray-500">游戏: {achievement.gameTitle}</p>}
                          <p className="text-xs text-gray-500">解锁于: {new Date(achievement.unlockedAt).toLocaleDateString()}</p>
                        </div>
                      </li>
                    ))
                  ) : (
                    <p className="text-gray-400">暂无已解锁成就。</p>
                  )}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default UserProfile;
