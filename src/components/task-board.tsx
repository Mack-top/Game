import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Task {
  id: string;
  title: string;
  description: string;
  status: "todo" | "in-progress" | "done";
  assignee: string;
  priority: "low" | "medium" | "high";
  projectId: string; // Add projectId to Task interface
}

interface TaskBoardProps {
  projectId: string; // TaskBoard now accepts projectId as a prop
}

const TaskBoard: React.FC<TaskBoardProps> = ({ projectId }) => {
  const [tasks, setTasks] = useState<Task[]>([]); // Initialize with empty array, data will be fetched
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newTask, setNewTask] = useState<Omit<Task, "id">>({
    title: "",
    description: "",
    status: "todo",
    assignee: "",
    priority: "medium",
    projectId: projectId, // Set projectId for new tasks
  });

  // Fetch tasks from backend
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await fetch(`http://localhost:3001/api/tasks?projectId=${projectId}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: Task[] = await response.json();
        // No need to filter here, backend already filters by projectId
        setTasks(data);
      } catch (err: any) {
        setError(err.message);
        console.error("Error fetching tasks:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [projectId]); // Re-fetch tasks if projectId changes

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setNewTask((prev) => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (id: keyof Omit<Task, "id">, value: string) => {
    setNewTask((prev) => ({ ...prev, [id]: value as any }));
  };

  const addTask = async () => {
    if (!newTask.title.trim()) {
      alert("任务标题不能为空。");
      return;
    }

    try {
      const response = await fetch("http://localhost:3001/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newTask),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // After successfully adding, re-fetch tasks to update the list
      const updatedTask = await response.json(); // Get the task with its new ID from backend
      setTasks((prev) => [...prev, updatedTask]); // Add the new task to the state

      // Reset form fields and close dialog
      setNewTask({
        title: "",
        description: "",
        status: "todo",
        assignee: "",
        priority: "medium",
        projectId: projectId,
      });
      // Assuming you have a way to close the dialog, e.g., by managing its open state
      // For now, we'll just rely on the user closing it or a full page refresh
      // If the dialog state is managed by the parent, you might need a callback here.
    } catch (error: any) {
      console.error("Error adding task:", error);
      alert("添加任务失败：" + error.message);
    }
  };

  const getTasksByStatus = (status: Task["status"]) => {
    return tasks.filter((task) => task.status === status);
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-white">任务看板</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">添加任务</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-gray-800 text-gray-100 border-gray-700">
            <DialogHeader>
              <DialogTitle>添加新任务</DialogTitle>
              <DialogDescription className="text-gray-400">
                填写任务详情。
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">
                  标题
                </Label>
                <Input id="title" value={newTask.title} onChange={handleInputChange} className="col-span-3 bg-gray-700 border-gray-600 text-white" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  描述
                </Label>
                <Textarea id="description" value={newTask.description} onChange={handleInputChange} className="col-span-3 bg-gray-700 border-gray-600 text-white" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="assignee" className="text-right">
                  负责人
                </Label>
                <Input id="assignee" value={newTask.assignee} onChange={handleInputChange} className="col-span-3 bg-gray-700 border-gray-600 text-white" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="priority" className="text-right">
                  优先级
                </Label>
                <Select onValueChange={(value) => handleSelectChange("priority", value)} defaultValue={newTask.priority}>
                  <SelectTrigger className="col-span-3 bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="选择优先级" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 text-gray-100 border-gray-700">
                    <SelectItem value="low">低</SelectItem>
                    <SelectItem value="medium">中</SelectItem>
                    <SelectItem value="high">高</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">
                  状态
                </Label>
                <Select onValueChange={(value) => handleSelectChange("status", value)} defaultValue={newTask.status}>
                  <SelectTrigger className="col-span-3 bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="选择状态" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 text-gray-100 border-gray-700">
                    <SelectItem value="todo">待办</SelectItem>
                    <SelectItem value="in-progress">进行中</SelectItem>
                    <SelectItem value="done">已完成</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={addTask} className="bg-blue-600 hover:bg-blue-700 text-white">保存任务</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* To Do Column */}
        <div className="bg-gray-800 rounded-lg shadow-md p-4">
          <h3 className="text-xl font-semibold text-white mb-4 border-b border-gray-700 pb-2">待办</h3>
          <div className="space-y-4">
            {getTasksByStatus("todo").map((task) => (
              <Card key={task.id} className="bg-gray-700 text-gray-100 border-gray-600">
                <CardHeader>
                  <CardTitle className="text-lg">{task.title}</CardTitle>
                  <CardDescription className="text-gray-300">负责人: {task.assignee}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-200">{task.description}</p>
                  <p className="text-xs text-gray-400 mt-2">优先级: {task.priority}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* In Progress Column */}
        <div className="bg-gray-800 rounded-lg shadow-md p-4">
          <h3 className="text-xl font-semibold text-white mb-4 border-b border-gray-700 pb-2">进行中</h3>
          <div className="space-y-4">
            {getTasksByStatus("in-progress").map((task) => (
              <Card key={task.id} className="bg-gray-700 text-gray-100 border-gray-600">
                <CardHeader>
                  <CardTitle className="text-lg">{task.title}</CardTitle>
                  <CardDescription className="text-gray-300">负责人: {task.assignee}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-200">{task.description}</p>
                  <p className="text-xs text-gray-400 mt-2">优先级: {task.priority}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Done Column */}
        <div className="bg-gray-800 rounded-lg shadow-md p-4">
          <h3 className="text-xl font-semibold text-white mb-4 border-b border-gray-700 pb-2">已完成</h3>
          <div className="space-y-4">
            {getTasksByStatus("done").map((task) => (
              <Card key={task.id} className="bg-gray-700 text-gray-100 border-gray-600">
                <CardHeader>
                  <CardTitle className="text-lg">{task.title}</CardTitle>
                  <CardDescription className="text-gray-300">负责人: {task.assignee}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-200">{task.description}</p>
                  <p className="text-xs text-gray-400 mt-2">优先级: {task.priority}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskBoard;