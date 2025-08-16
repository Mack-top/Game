import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, ArrowLeft } from 'lucide-react'; // Import ArrowLeft icon
import { Link, useNavigate } from 'react-router-dom'; // Import useNavigate
import { useToast } from '@/hooks/use-toast';

interface Game {
  id: number;
  title: string;
  genre: string;
  coverImage: string;
}

const GameLibrary: React.FC = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate(); // Initialize useNavigate

  const fetchGames = useCallback(async () => {
    try {
      let url = 'http://localhost:3001/api/player/games';
      const params = new URLSearchParams();

      if (searchQuery) {
        url = 'http://localhost:3001/api/player/games/search';
        params.append('query', searchQuery);
      } else if (selectedGenre && selectedGenre !== '全部') {
        url = 'http://localhost:3001/api/player/games/filter';
        params.append('genre', selectedGenre);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setGames(data);
      } else {
        toast({
          title: "加载失败",
          description: "无法加载游戏列表。",
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
  }, [searchQuery, selectedGenre, toast]);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSelectedGenre(null); // Clear genre filter when searching
    fetchGames();
  };

  const handleGenreFilter = (genre: string) => {
    setSelectedGenre(genre === '全部' ? null : genre);
    setSearchQuery(''); // Clear search query when filtering by genre
    fetchGames();
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-4">
          <Button variant="ghost" onClick={() => navigate(-1)} className="text-gray-300 hover:text-white">
            <ArrowLeft className="mr-2 h-4 w-4" /> 返回
          </Button>
        </div>
        <h1 className="text-4xl font-bold text-blue-400 mb-8 text-center">游戏库</h1>

        {/* Filter and Search Area */}
        <div className="mb-8 flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 md:space-x-4">
          <form onSubmit={handleSearch} className="relative w-full md:w-1/2">
            <Input
              type="text"
              placeholder="搜索游戏..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/10 backdrop-blur-md border border-blue-400/20 text-white placeholder-blue-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <Button type="submit" variant="ghost" size="icon" className="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-300 hover:bg-transparent">
              <Search size={20} />
            </Button>
          </form>
          <div className="flex flex-wrap justify-center md:justify-start space-x-2">
            {['全部', '动作', '角色扮演', '策略', '冒险', '模拟'].map((tag) => (
              <Button
                key={tag}
                variant="outline"
                onClick={() => handleGenreFilter(tag)}
                className={`bg-white/10 backdrop-blur-md border border-blue-400/20 text-blue-200 transition-colors duration-200 rounded-full px-4 py-1 text-sm ${selectedGenre === tag || (selectedGenre === null && tag === '全部') ? 'bg-blue-600 text-white' : 'hover:bg-blue-600 hover:text-white'}`}
              >
                {tag}
              </Button>
            ))}
          </div>
        </div>

        {/* Game List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {games.length > 0 ? (
            games.map((game) => (
              <Card key={game.id} className="bg-white/10 backdrop-blur-md border border-blue-400/20 text-white rounded-lg shadow-lg overflow-hidden transition-transform duration-300 hover:scale-105">
                <img src={game.coverImage || '/placeholder.svg'} alt={game.title} className="w-full h-48 object-cover" />
                <CardContent className="p-4">
                  <h3 className="text-xl font-semibold text-blue-200">{game.title}</h3>
                  <p className="text-sm text-blue-100 mt-1">{game.genre}</p>
                  <Button variant="outline" size="sm" className="mt-3 w-full border-blue-500 text-blue-300 hover:bg-blue-600 hover:text-white" asChild>
                    <Link to={`/games/${game.id}`}>查看详情</Link>
                  </Button>
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="text-gray-400 text-center w-full col-span-full">没有找到匹配的游戏。</p>
          )}
        </div>

        {/* Pagination - Placeholder for now, can be implemented later */}
        {/*
        <div className="flex justify-center mt-8 space-x-2">
          <Button variant="outline" className="bg-white/10 backdrop-blur-md border border-blue-400/20 text-blue-200 hover:bg-blue-600 hover:text-white">上一页</Button>
          {Array.from({ length: 3 }).map((_, i) => (
            <Button key={i} variant="outline" className="bg-white/10 backdrop-blur-md border border-blue-400/20 text-blue-200 hover:bg-blue-600 hover:text-white">{i + 1}</Button>
          ))}
          <Button variant="outline" className="bg-white/10 backdrop-blur-md border border-blue-400/20 text-blue-200 hover:bg-blue-600 hover:text-white">下一页</Button>
        </div>
        */}
      </div>
    </div>
  );
};

export default GameLibrary;
