import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2, Code, Megaphone, ScrollText, Folder } from 'lucide-react';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface GameplayElement {
  id: string;
  name: string;
  type: 'rule' | 'event' | 'script' | 'other';
  description: string;
  logic?: string;
}

interface Project {
  id: string;
  name: string;
}

// Helper to encode logic into description
const encodeDescription = (desc: string, logic?: string): string => {
  if (logic) {
    return `[LOGIC_START]${logic}[LOGIC_END]${desc}`;
  }
  return desc;
};

// Helper to decode logic from description
const decodeDescription = (fullDesc: string): { description: string; logic?: string } => {
  const logicStartTag = '[LOGIC_START]';
  const logicEndTag = '[LOGIC_END]';
  const startIndex = fullDesc.indexOf(logicStartTag);
  const endIndex = fullDesc.indexOf(logicEndTag);

  if (startIndex !== -1 && endIndex !== -1 && startIndex < endIndex) {
    const logic = fullDesc.substring(startIndex + logicStartTag.length, endIndex);
    const description = fullDesc.substring(endIndex + logicEndTag.length);
    return { description, logic };
  }
  return { description: fullDesc };
};

const getGameplayIcon = (type: GameplayElement['type']) => {
  switch (type) {
    case 'rule':
      return <ScrollText className="h-5 w-5 text-blue-400" />;
    case 'event':
      return <Megaphone className="h-5 w-5 text-green-400" />;
    case 'script':
      return <Code className="h-5 w-5 text-purple-400" />;
    default:
      return <ScrollText className="h-5 w-5 text-gray-400" />;
  }
};

const GameplayManagement: React.FC = () => {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [gameplayElements, setGameplayElements] = useState<GameplayElement[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingElement, setEditingElement] = useState<GameplayElement | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<GameplayElement['type']>('rule');
  const [description, setDescription] = useState('');
  const [logic, setLogic] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();
  const { token } = useAuth();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('http://localhost:3002/api/projects', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: Project[] = await response.json();
        setProjects(data);
        if (data.length > 0) {
          setSelectedProjectId(data[0].id); // Automatically select the first project
        }
      } catch (error) {
        console.error("Failed to fetch projects:", error);
        toast({
          title: "加载失败",
          description: "无法加载项目列表。",
          variant: "destructive",
        });
      }
    };
    if (token) {
      fetchProjects();
    }
  }, [token, toast]);

  const fetchGameplayElements = async () => {
    if (!selectedProjectId) {
      setGameplayElements([]);
      return;
    }
    try {
      const response = await fetch(`http://localhost:3002/api/tasks?projectId=${selectedProjectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      const mappedElements: GameplayElement[] = data.map((task: any) => {
        const { description: decodedDescription, logic: decodedLogic } = decodeDescription(task.description || '');
        let derivedType: GameplayElement['type'] = 'other';
        if (decodedLogic) {
          derivedType = 'script';
        } else if (task.title.toLowerCase().includes('规则')) {
          derivedType = 'rule';
        } else if (task.title.toLowerCase().includes('事件')) {
          derivedType = 'event';
        }

        return {
          id: task.id,
          name: task.title,
          type: derivedType,
          description: decodedDescription,
          logic: decodedLogic,
        };
      });
      setGameplayElements(mappedElements);
    } catch (error) {
      console.error("Failed to fetch gameplay elements:", error);
      toast({
        title: "加载失败",
        description: "无法加载玩法元素列表。",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchGameplayElements();
  }, [selectedProjectId, token]);

  const resetForm = () => {
    setEditingElement(null);
    setName('');
    setType('rule');
    setDescription('');
    setLogic('');
  };

  const handleOpenDialog = (element?: GameplayElement) => {
    if (element) {
      setEditingElement(element);
      setName(element.name);
      setType(element.type);
      setDescription(element.description);
      setLogic(element.logic || '');
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim() || !description.trim() || !selectedProjectId) {
      toast({
        title: "保存失败",
        description: "名称、描述和项目不能为空。",
        variant: "destructive",
      });
      return;
    }

    const fullDescription = encodeDescription(description, logic);
    const payload = {
      title: name,
      description: fullDescription,
      projectId: selectedProjectId,
      status: 'todo',
      priority: 'medium',
    };

    try {
      let response;
      if (editingElement) {
        response = await fetch(`http://localhost:3002/api/tasks/${editingElement.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch('http://localhost:3002/api/tasks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      fetchGameplayElements();
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: editingElement ? "更新成功" : "添加成功",
        description: `玩法元素 "${name}" 已${editingElement ? '更新' : '添加'}。`,
      });
    } catch (error) {
      console.error("Failed to save gameplay element:", error);
      toast({
        title: "保存失败",
        description: `无法${editingElement ? '更新' : '添加'}玩法元素。`,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!selectedProjectId) {
      toast({
        title: "删除失败",
        description: "请先选择一个项目。",
        variant: "destructive",
      });
      return;
    }
    try {
      const response = await fetch(`http://localhost:3002/api/tasks/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setGameplayElements(gameplayElements.filter(el => el.id !== id));
      toast({
        title: "删除成功",
        description: "玩法元素已删除。",
      });
    } catch (error) {
      console.error("Failed to delete gameplay element:", error);
      toast({
        title: "删除失败",
        description: "无法删除玩法元素。",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-4">
        <Button variant="ghost" onClick={() => navigate(-1)} className="text-gray-300 hover:text-white">
          <ArrowLeft className="mr-2 h-4 w-4" /> 返回
        </Button>
      </div>
      <Card className="bg-gray-800 text-white border-gray-700 shadow-lg mb-8">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-2xl font-bold text-blue-400">玩法管理</CardTitle>
            <CardDescription className="text-gray-300">
              在这里定义和管理您的游戏玩法逻辑和规则。
            </CardDescription>
          </div>
          <div className="flex items-center space-x-4">
            <Select value={selectedProjectId || ''} onValueChange={setSelectedProjectId}>
              <SelectTrigger className="w-[180px] bg-gray-800 border-gray-600 text-white focus:border-blue-500">
                <SelectValue placeholder="选择项目" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700 text-white">
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white" disabled={!selectedProjectId} onClick={() => handleOpenDialog()}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  添加玩法元素
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] bg-gray-900 text-white border-gray-700">
                <DialogHeader>
                  <DialogTitle className="text-blue-400">{editingElement ? '编辑玩法元素' : '添加玩法元素'}</DialogTitle>
                  <DialogDescription className="text-gray-400">
                    {editingElement ? '修改玩法元素的详细信息。' : '创建一个新的玩法元素。'}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right text-gray-300">
                      名称
                    </Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="col-span-3 bg-gray-800 border-gray-600 text-white focus:border-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="type" className="text-right text-gray-300">
                      类型
                    </Label>
                    <Select value={type} onValueChange={(value) => setType(value as GameplayElement['type'])}>
                      <SelectTrigger className="col-span-3 bg-gray-800 border-gray-600 text-white focus:border-blue-500">
                        <SelectValue placeholder="选择类型" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700 text-white">
                        <SelectItem value="rule">规则</SelectItem>
                        <SelectItem value="event">事件</SelectItem>
                        <SelectItem value="script">脚本</SelectItem>
                        <SelectItem value="other">其他</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="description" className="text-right text-gray-300">
                      描述
                    </Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="col-span-3 bg-gray-800 border-gray-600 text-white focus:border-blue-500"
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label htmlFor="logic" className="text-right text-gray-300 pt-2">
                      逻辑/代码
                    </Label>
                    <Textarea
                      id="logic"
                      value={logic}
                      onChange={(e) => setLogic(e.target.value)}
                      className="col-span-3 bg-gray-800 border-gray-600 text-white font-mono focus:border-blue-500"
                      rows={8}
                      placeholder="输入玩法逻辑或代码片段..."
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="text-gray-300 border-gray-600 hover:bg-gray-700 hover:text-white mr-2">
                    取消
                  </Button>
                  <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">
                    保存
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {!selectedProjectId ? (
        <div className="text-center text-gray-400 py-10">
          <Folder className="mx-auto h-12 w-12 mb-4 text-gray-500" />
          <p className="text-lg">请先选择一个项目来管理玩法元素。</p>
          <p className="text-sm">您可以在上方下拉菜单中选择一个项目。</p>
        </div>
      ) : gameplayElements.length === 0 ? (
        <div className="text-center text-gray-400 py-10">
          <Folder className="mx-auto h-12 w-12 mb-4 text-gray-500" />
          <p className="text-lg">当前项目暂无玩法元素。</p>
          <p className="text-sm">点击“添加玩法元素”按钮添加新玩法元素。</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {gameplayElements.map((element) => (
            <Card key={element.id} className="bg-gradient-to-br from-gray-800 to-gray-900 text-white shadow-lg border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center space-x-2">
                  {getGameplayIcon(element.type)}
                  <CardTitle className="text-lg font-bold">{element.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-300">类型: {element.type}</p>
                <p className="text-sm text-gray-300 line-clamp-2">描述: {element.description}</p>
                {element.logic && (
                  <pre className="mt-2 p-2 bg-gray-700 rounded-md text-xs overflow-auto max-h-24">
                    <code>{element.logic}</code>
                  </pre>
                )}
              </CardContent>
              <CardContent className="flex justify-end space-x-2 pt-0">
                <Button variant="outline" size="sm" className="text-yellow-300 border-yellow-300 hover:bg-yellow-300 hover:text-yellow-900" onClick={() => handleOpenDialog(element)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(element.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default GameplayManagement;
