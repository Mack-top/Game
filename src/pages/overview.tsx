import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { ProjectCard } from '@/components/project-card';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'; // Add DialogHeader, DialogTitle, DialogDescription
import { ProjectForm } from '@/components/project-form';
import { useToast } from '@/hooks/use-toast';

interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string; // Assuming backend returns this format
}

const Overview: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null); // New state for editing
  const { toast } = useToast();

  const fetchProjects = async () => {
    try {
      const response = await fetch('http://localhost:3002/api/projects');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: Project[] = await response.json();
      setProjects(data);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
      toast({
        title: "加载失败",
        description: "无法加载项目列表。",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // Modify handleCreateProject to handleSaveProject
  const handleSaveProject = async (projectName: string, projectDescription: string) => {
    try {
      let response;
      let method;
      let url;
      let successMessage;
      let errorMessage;

      if (editingProject) {
        // Editing existing project
        method = 'PUT';
        url = `http://localhost:3002/api/projects/${editingProject.id}`;
        successMessage = `项目 "${projectName}" 已成功更新。`;
        errorMessage = "无法更新项目。";
      } else {
        // Creating new project
        method = 'POST';
        url = 'http://localhost:3002/api/projects';
        successMessage = `项目 "${projectName}" 已成功创建。`;
        errorMessage = "无法创建新项目。";
      }

      response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: projectName,
          description: projectDescription,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Re-fetch projects to update the list
      fetchProjects();
      setIsDialogOpen(false);
      setEditingProject(null); // Clear editing state
      toast({
        title: editingProject ? "更新成功" : "创建成功",
        description: successMessage,
      });
    } catch (error) {
      console.error("Failed to save project:", error);
      toast({
        title: editingProject ? "更新失败" : "创建失败",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setIsDialogOpen(true);
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      const response = await fetch(`http://localhost:3002/api/projects/${projectId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setProjects(projects.filter(p => p.id !== projectId)); // Remove deleted project from state
      toast({
        title: "删除成功",
        description: "项目已成功删除。",
      });
    } catch (error) {
      console.error("Failed to delete project:", error);
      toast({
        title: "删除失败",
        description: "无法删除项目。",
        variant: "destructive",
      });
    }
  };

  const handleOpenDialog = (project?: Project) => {
    if (project) {
      setEditingProject(project);
    } else {
      setEditingProject(null); // For new project creation
    }
    setIsDialogOpen(true);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">我的项目</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => handleOpenDialog()}>
              <PlusCircle className="mr-2 h-4 w-4" />
              创建新项目
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-gray-900 text-white border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-blue-400">{editingProject ? '编辑项目' : '创建新项目'}</DialogTitle>
              <DialogDescription className="text-gray-400">
                {editingProject ? '修改项目的名称和描述。' : '填写项目名称和描述来创建一个新项目。'}
              </DialogDescription>
            </DialogHeader>
            <ProjectForm
              onSave={handleSaveProject}
              initialData={editingProject || undefined} // Pass initial data for editing
              onCancel={() => setIsDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            onEdit={handleEditProject} // Pass the handleEditProject function
            onDelete={handleDeleteProject} // Pass the handleDeleteProject function
          />
        ))}
      </div>
    </div>
  );
};

export default Overview;