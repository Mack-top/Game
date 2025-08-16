import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface Game {
  id: number;
  title: string;
  genre: string;
  coverImage: string;
}

const Home: React.FC = () => {
  const [recentGames, setRecentGames] = useState<Game[]>([]);
  const [recommendedGames, setRecommendedGames] = useState<Game[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const fetchGames = async () => {
      try {
        // Fetch recently played games
        const recentResponse = await fetch('http://localhost:3001/api/player/games/recent');
        if (recentResponse.ok) {
          const data = await recentResponse.json();
          setRecentGames(data);
        } else {
          toast({
            title: "加载失败",
            description: "无法加载最近游玩游戏。",
            variant: "destructive",
          });
        }

        // Fetch recommended games
        const recommendedResponse = await fetch('http://localhost:3001/api/player/games/recommended');
        if (recommendedResponse.ok) {
          const data = await recommendedResponse.json();
          setRecommendedGames(data);
        } else {
          toast({
            title: "加载失败",
            description: "无法加载推荐游戏。",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Failed to fetch games:", error);
        toast({
          title: "错误",
          description: "连接服务器失败，请检查网络。",
          variant: "destructive",
        });
      }
    };

    fetchGames();
  }, [toast]);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center justify-center p-4">
      {/* Hero Section */}
      <section
        className="relative w-full max-w-6xl h-96 rounded-lg overflow-hidden shadow-lg mb-12 flex items-center justify-center p-8"
        style={{
          backgroundImage: 'url(/placeholder.svg?height=1080&width=1920)', // Placeholder image for hero
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/30 to-blue-700/30 backdrop-blur-sm"></div>
        <Card className="relative z-10 bg-white/10 backdrop-blur-md border border-blue-400/20 text-white p-6 rounded-lg shadow-xl text-center max-w-md">
          <CardHeader>
            <CardTitle className="text-4xl font-bold text-blue-200 drop-shadow-lg">探索无限游戏世界</CardTitle>
            <CardDescription className="text-blue-100 mt-2">
              发现您的下一款挚爱游戏，沉浸在史诗般的冒险中。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-full shadow-lg transition-all duration-300 hover:scale-105">
              <Link to="/games">立即探索</Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Recently Played Section */}
      <section className="w-full max-w-6xl mb-12">
        <h2 className="text-3xl font-bold text-blue-400 mb-6 text-center">最近游玩</h2>
        <div className="flex overflow-x-auto space-x-6 pb-4 scrollbar-hide">
          {recentGames.length > 0 ? (
            recentGames.map((game) => (
              <Card key={game.id} className="flex-none w-64 bg-white/10 backdrop-blur-md border border-blue-400/20 text-white rounded-lg shadow-lg overflow-hidden transition-transform duration-300 hover:scale-105">
                <img src={game.coverImage || '/placeholder.svg'} alt={game.title} className="w-full h-40 object-cover" />
                <CardContent className="p-4">
                  <h3 className="text-xl font-semibold text-blue-200">{game.title}</h3>
                  <p className="text-sm text-blue-100 mt-1">{game.genre}</p>
                  <Button variant="outline" size="sm" className="mt-3 w-full border-blue-500 text-blue-300 hover:bg-blue-600 hover:text-white" asChild>
                    <Link to={`/game/${game.id}`}>继续游戏</Link>
                  </Button>
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="text-gray-400 text-center w-full">暂无最近游玩游戏。</p>
          )}
        </div>
      </section>

      {/* Recommended Games Section */}
      <section className="w-full max-w-6xl mb-12">
        <h2 className="text-3xl font-bold text-blue-400 mb-6 text-center">推荐游戏</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {recommendedGames.length > 0 ? (
            recommendedGames.map((game) => (
              <Card key={game.id} className="bg-white/10 backdrop-blur-md border border-blue-400/20 text-white rounded-lg shadow-lg overflow-hidden transition-transform duration-300 hover:scale-105">
                <img src={game.coverImage || '/placeholder.svg'} alt={game.title} className="w-full h-48 object-cover" />
                <CardContent className="p-4">
                  <h3 className="text-xl font-semibold text-blue-200">{game.title}</h3>
                  <p className="text-sm text-blue-100 mt-1">{game.genre}</p>
                  <Button variant="outline" size="sm" className="mt-3 w-full border-blue-500 text-blue-300 hover:bg-blue-600 hover:text-white" asChild>
                    <Link to={`/game/${game.id}`}>查看详情</Link>
                  </Button>
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="text-gray-400 text-center w-full col-span-full">暂无推荐游戏。</p>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full max-w-6xl text-center text-gray-400 py-8 border-t border-gray-700 mt-12">
        <p>&copy; 2024 游戏开发平台. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Home;
