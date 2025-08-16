import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

interface ProjectFormProps {
  onSave: (name: string, description: string) => void;
  title: string;
  description: string;
  initialName?: string;
  initialDescription?: string;
  onCancel?: () => void;
}

export const ProjectForm: React.FC<ProjectFormProps> = ({
  onSave,
  title,
  description,
  initialName = '',
  initialDescription = '',
  onCancel,
}) => {
  const [projectName, setProjectName] = useState(initialName);
  const [projectDescription, setProjectDescription] = useState(initialDescription);

  useEffect(() => {
    setProjectName(initialName);
    setProjectDescription(initialDescription);
  }, [initialName, initialDescription]);

  const handleSubmit = () => {
    if (projectName.trim()) {
      onSave(projectName, projectDescription);
      setProjectName('');
      setProjectDescription('');
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-blue-400">{title}</DialogTitle>
        <DialogDescription className="text-gray-400">{description}</DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="name" className="text-right text-gray-300">
            项目名称
          </Label>
          <Input
            id="name"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="col-span-3 bg-gray-800 border-gray-600 text-white focus:border-blue-500"
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="description" className="text-right text-gray-300">
            项目描述
          </Label>
          <Textarea
            id="description"
            value={projectDescription}
            onChange={(e) => setProjectDescription(e.target.value)}
            className="col-span-3 bg-gray-800 border-gray-600 text-white focus:border-blue-500"
            rows={4}
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel} className="text-gray-300 border-gray-600 hover:bg-gray-700 hover:text-white">
          取消
        </Button>
        <Button type="submit" onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700 text-white">
          保存
        </Button>
      </DialogFooter>
    </>
  );
};