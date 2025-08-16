import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/context/AuthContext';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('player'); // Default role for new user
  const { toast } = useToast();
  const { token } = useAuth(); // Get token for authorization

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:3002/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`, // Include token for authorization
        },
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        const errorData = await response.json();
        toast({
          title: "获取用户失败",
          description: errorData.message || "无法获取用户列表。",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Fetch users error:", error);
      toast({
        title: "错误",
        description: "无法连接到服务器，请稍后再试。",
        variant: "destructive",
      });
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3002/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // Include token for authorization
        },
        body: JSON.stringify({ username: newUsername, password: newPassword, email: newEmail, role: newRole }),
      });

      if (response.ok) {
        toast({
          title: "用户创建成功",
          description: `用户 ${newUsername} 已成功创建。`,
        });
        setIsCreateDialogOpen(false);
        setNewUsername('');
        setNewPassword('');
        setNewEmail('');
        setNewRole('player');
        fetchUsers(); // Refresh user list
      } else {
        const errorData = await response.json();
        toast({
          title: "用户创建失败",
          description: errorData.message || "无法创建用户。",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Create user error:", error);
      toast({
        title: "错误",
        description: "无法连接到服务器，请稍后再试。",
        variant: "destructive",
      });
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setNewUsername(user.username);
    setNewEmail(user.email);
    setNewRole(user.role);
    setIsEditDialogOpen(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const response = await fetch(`http://localhost:3002/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ username: newUsername, email: newEmail, role: newRole }),
      });

      if (response.ok) {
        toast({
          title: "用户更新成功",
          description: `用户 ${newUsername} 已成功更新。`,
        });
        setIsEditDialogOpen(false);
        setEditingUser(null);
        setNewUsername('');
        setNewEmail('');
        setNewRole('player');
        fetchUsers();
      } else {
        const errorData = await response.json();
        toast({
          title: "用户更新失败",
          description: errorData.message || "无法更新用户。",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Update user error:", error);
      toast({
        title: "错误",
        description: "无法连接到服务器，请稍后再试。",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (userId: number, username: string) => {
    if (!window.confirm(`确定要删除用户 ${username} 吗？`)) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3002/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast({
          title: "用户删除成功",
          description: `用户 ${username} 已成功删除。`,
        });
        fetchUsers();
      } else {
        const errorData = await response.json();
        toast({
          title: "用户删除失败",
          description: errorData.message || "无法删除用户。",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Delete user error:", error);
      toast({
        title: "错误",
        description: "无法连接到服务器，请稍后再试。",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6">
      <Card className="bg-gray-800 text-white border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold">用户管理</CardTitle>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>创建新用户</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-gray-800 text-white border-gray-700">
              <DialogHeader>
                <DialogTitle className="text-blue-400">创建新用户</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateUser} className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="create-username" className="text-right">
                    用户名
                  </Label>
                  <Input
                    id="create-username"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="col-span-3 bg-gray-700 border-gray-600 text-white"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="create-password" className="text-right">
                    密码
                  </Label>
                  <Input
                    id="create-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="col-span-3 bg-gray-700 border-gray-600 text-white"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="create-email" className="text-right">
                    邮箱
                  </Label>
                  <Input
                    id="create-email"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="col-span-3 bg-gray-700 border-gray-600 text-white"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="create-role" className="text-right">
                    角色
                  </Label>
                  <Select value={newRole} onValueChange={setNewRole}>
                    <SelectTrigger className="col-span-3 bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="选择角色" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 text-white border-gray-700">
                      <SelectItem value="player">玩家</SelectItem>
                      <SelectItem value="admin">管理员</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter>
                  <Button type="submit">创建</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-gray-700">
                <TableHead className="text-gray-300">ID</TableHead>
                <TableHead className="text-gray-300">用户名</TableHead>
                <TableHead className="text-gray-300">邮箱</TableHead>
                <TableHead className="text-gray-300">角色</TableHead>
                <TableHead className="text-gray-300">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} className="border-gray-700 hover:bg-gray-700">
                  <TableCell>{user.id}</TableCell>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mr-2 bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                      onClick={() => handleEditUser(user)}
                    >
                      编辑
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteUser(user.id, user.username)}
                    >
                      删除
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-gray-800 text-white border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-blue-400">编辑用户</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateUser} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-username" className="text-right">
                用户名
              </Label>
              <Input
                id="edit-username"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                className="col-span-3 bg-gray-700 border-gray-600 text-white"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-email" className="text-right">
                邮箱
              </Label>
              <Input
                id="edit-email"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="col-span-3 bg-gray-700 border-gray-600 text-white"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-role" className="text-right">
                角色
              </Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger className="col-span-3 bg-gray-700 border-gray-600 text-white">
                  <SelectValue placeholder="选择角色" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 text-white border-gray-700">
                  <SelectItem value="player">玩家</SelectItem>
                  <SelectItem value="admin">管理员</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="submit">保存更改</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
