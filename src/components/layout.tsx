import React, { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, Search, UserCircle } from "lucide-react"; // Import Search icon
import { Link, useLocation, useNavigate } from "react-router-dom"; // Import useNavigate
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"; // Import DropdownMenuSeparator
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from '@/hooks/use-toast'; // Import useToast
import { useAuth } from '@/context/AuthContext'; // Import useAuth

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate(); // Initialize useNavigate
  const { toast } = useToast(); // Initialize useToast
  const { user, logout } = useAuth(); // Use useAuth hook

  const handleLinkClick = () => {
    setIsSheetOpen(false);
  };

  const handleLogout = () => {
    logout(); // Use AuthContext's logout function
    toast({
      title: "已退出登录",
      description: "您已成功退出登录。",
    });
    navigate('/login'); // Redirect to login page
  };

  const playerNavItems = [
    { name: "首页", path: "/home" },
    { name: "游戏库", path: "/games" },
    { name: "个人中心", path: "/player-profile" },
  ];

  const adminNavItems = [
    { name: "项目总览", path: "/admin/overview" },
    { name: "用户管理", path: "/admin/users" },
    { name: "资产管理", path: "/admin/assets" },
    { name: "玩法管理", path: "/admin/gameplay" },
    { name: "数据库管理", path: "/admin/database" },
  ];

  const username = user ? user.username : 'Guest';
  const userRole = user ? user.role : 'guest'; // Default to 'guest' if no user or role

  // Determine which set of nav items to display based on user role
  let displayedNavItems = [];
  if (userRole === 'admin') {
    displayedNavItems = adminNavItems;
  } else if (userRole === 'player') {
    displayedNavItems = playerNavItems;
  }
  // If userRole is 'guest' or other, displayedNavItems remains empty,
  // which means no main navigation will be shown for unauthenticated users
  // or users without a specific role.

  // Helper function to determine if a path is active
  const isActive = (path: string) => {
    // Special handling for root path redirecting to /home
    if (path === "/home" && location.pathname === "/") return true;
    // For admin project-related paths, check if the base path matches
    if (path.startsWith("/admin/project/") && location.pathname.startsWith("/admin/project/")) {
      // Compare up to the last slash to match base project path
      return location.pathname.startsWith(path.substring(0, path.lastIndexOf('/')));
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-gray-100">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-gray-800 p-4 flex items-center justify-between shadow-md">
        <div className="flex items-center">
          {/* Mobile Menu Button */}
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden mr-4">
                <Menu className="h-6 w-6 text-white" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 bg-gray-800 p-4 border-none">
              <div className="text-2xl font-bold text-white mb-6">游戏管理平台</div>
              <nav>
                <ul className="space-y-2">
                  {displayedNavItems.map((item) => (
                    <li key={item.name}>
                      <Link
                        to={item.path}
                        className={`flex items-center p-2 rounded-md ${
                          isActive(item.path) ? "bg-blue-700 text-white" : "text-gray-300 hover:bg-gray-700"
                        }`}
                        onClick={handleLinkClick}
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </SheetContent>
          </Sheet>

          {/* Logo/Title */}
          <Link to="/home" className="text-2xl font-bold text-white">
            游戏平台
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex ml-8 space-x-4">
            {displayedNavItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`p-2 rounded-md ${
                  isActive(item.path) ? "bg-blue-700 text-white" : "text-gray-300 hover:bg-gray-700"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>

        {/* User Profile/Actions */}
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" className="text-white hover:bg-gray-700">
            <Search className="h-5 w-5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/placeholder.svg?height=128&width=128" alt="@shadcn" />
                  <AvatarFallback>{username.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-gray-800 border-gray-700 text-white" align="end" forceMount>
              <DropdownMenuItem className="hover:bg-gray-700 cursor-pointer">
                <span className="font-bold">{username}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-700" />
              <DropdownMenuItem className="hover:bg-gray-700 cursor-pointer" onClick={() => navigate('/profile')}>
                个人资料
              </DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-gray-700 cursor-pointer" onClick={() => navigate('/settings')}>
                设置
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-700" />
              <DropdownMenuItem className="hover:bg-gray-700 cursor-pointer text-red-400" onClick={handleLogout}>
                退出登录
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-6 overflow-auto">
        {children}
      </main>
    </div>
  );
};

export default Layout;
