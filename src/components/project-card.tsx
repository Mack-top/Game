import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreVertical } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

interface ProjectCardProps {
  project: Project;
  onEdit: (project: Project) => void; // Add onEdit prop
  onDelete: (projectId: string) => void; // Add onDelete prop
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onEdit, onDelete }) => {
  return (
    <Card className="bg-gradient-to-br from-blue-900 to-purple-900 text-white shadow-lg border-none">
      <CardHeader className="relative pb-2">
        <CardTitle className="text-xl font-bold">{project.name}</CardTitle>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="absolute top-4 right-4 text-white hover:bg-white/10">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700 text-white">
            <DropdownMenuItem className="hover:bg-gray-700 cursor-pointer" onClick={() => onEdit(project)}>编辑</DropdownMenuItem>
            <DropdownMenuItem className="hover:bg-gray-700 cursor-pointer text-red-400" onClick={() => onDelete(project.id)}>删除</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="pt-0">
        <CardDescription className="text-gray-300 text-sm line-clamp-3">
          {project.description}
        </CardDescription>
      </CardContent>
      <CardFooter className="flex justify-between items-center pt-2">
        <span className="text-xs text-gray-400">创建于: {project.createdAt}</span>
        <Link to={`/admin/project/${project.id}`} className="ml-auto">
          <Button variant="outline" className="text-blue-300 border-blue-300 hover:bg-blue-300 hover:text-blue-900">
            进入项目
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};
