import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, ArrowLeft } from 'lucide-react'; // Import ArrowLeft icon
import { useNavigate } from 'react-router-dom'; // Import useNavigate

const GameDetail: React.FC = () => {
  const navigate = useNavigate(); // Initialize useNavigate

  const game = {
    id: 1,
    name: '史诗冒险：失落的遗迹',
    genre: '动作冒险',
    developer: '幻想工作室',
    releaseDate: '2024年3月15日',
    rating: 4.8,
    description: '踏上一段史诗般的旅程，探索古老的遗迹，解开被遗忘的谜团，与强大的敌人作战。这款游戏融合了刺激的战斗、引人入胜的故事情节和令人惊叹的视觉效果。',
    coverImage: '/placeholder.svg?height=720&width=1280&text=Game Cover',
    trailerVideo: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Placeholder for a trailer video
    screenshots: [
      '/placeholder.svg?height=400&width=600&text=Screenshot 1',
      '/placeholder.svg?height=400&width=600&text=Screenshot 2',
      '/placeholder.svg?height=400&width=600&text=Screenshot 3',
      '/placeholder.svg?height=400&width=600&text=Screenshot 4',
    ],
    reviews: [
      { user: '玩家A', rating: 5, comment: '太棒了！画面精美，剧情引人入胜。' },
      { user: '玩家B', rating: 4, comment: '战斗系统很棒，但有些谜题太难了。' },
      { user: '玩家C', rating: 5, comment: '年度最佳游戏！强烈推荐！' },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-4">
          <Button variant="ghost" onClick={() => navigate(-1)} className="text-gray-300 hover:text-white">
            <ArrowLeft className="mr-2 h-4 w-4" /> 返回
          </Button>
        </div>
        <h1 className="text-4xl font-bold text-blue-400 mb-8 text-center">{game.name}</h1>

        {/* Game Main Visual Section */}
        <section className="relative w-full aspect-video rounded-lg overflow-hidden shadow-lg mb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/30 to-blue-700/30 backdrop-blur-sm"></div>
          <iframe
            className="relative z-10 w-full h-full"
            src={game.trailerVideo}
            title="Game Trailer"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
          <div className="absolute bottom-4 left-4 z-20 flex items-center space-x-4">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-full shadow-lg transition-all duration-300">
              添加到游戏库
            </Button>
            <Button variant="outline" className="border-blue-500 text-blue-300 hover:bg-blue-600 hover:text-white font-semibold py-3 px-6 rounded-full shadow-lg transition-all duration-300">
              立即启动
            </Button>
          </div>
        </section>

        {/* Information Overview Card */}
        <Card className="bg-white/10 backdrop-blur-md border border-blue-400/20 text-white p-6 rounded-lg shadow-lg mb-8">
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <Star className="text-yellow-400" size={20} />
              <span className="text-lg font-semibold">{game.rating} / 5</span>
              <span className="text-sm text-gray-300">(用户评分)</span>
            </div>
            <div>
              <p className="text-lg font-semibold">开发者:</p>
              <p className="text-gray-300">{game.developer}</p>
            </div>
            <div>
              <p className="text-lg font-semibold">发布日期:</p>
              <p className="text-gray-300">{game.releaseDate}</p>
            </div>
          </CardContent>
        </Card>

        {/* Game Description and Screenshots */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card className="bg-white/10 backdrop-blur-md border border-blue-400/20 text-white p-6 rounded-lg shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-blue-400">游戏介绍</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 leading-relaxed">{game.description}</p>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-md border border-blue-400/20 text-white p-6 rounded-lg shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-blue-400">游戏截图</CardTitle>
            </CardHeader>
            <CardContent className="flex overflow-x-auto space-x-4 pb-2 scrollbar-hide">
              {game.screenshots.map((src, index) => (
                <img
                  key={index}
                  src={src}
                  alt={`Screenshot ${index + 1}`}
                  className="flex-none w-64 h-40 object-cover rounded-md border border-blue-400/20 shadow-md"
                />
              ))}
            </CardContent>
          </Card>
        </section>

        {/* User Reviews */}
        <section className="mb-8">
          <h2 className="text-3xl font-bold text-blue-400 mb-6 text-center">用户评价</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {game.reviews.map((review, index) => (
              <Card key={index} className="bg-white/10 backdrop-blur-md border border-blue-400/20 text-white p-6 rounded-lg shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="flex items-center space-x-2">
                    <img src="/placeholder.svg?height=40&width=40" alt="User Avatar" className="rounded-full" />
                    <span className="font-semibold text-blue-200">{review.user}</span>
                  </div>
                  <div className="flex items-center">
                    {Array.from({ length: review.rating }).map((_, i) => (
                      <Star key={i} className="text-yellow-400" size={16} fill="currentColor" />
                    ))}
                    {Array.from({ length: 5 - review.rating }).map((_, i) => (
                      <Star key={i} className="text-gray-500" size={16} />
                    ))}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 mt-2">{review.comment}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default GameDetail;