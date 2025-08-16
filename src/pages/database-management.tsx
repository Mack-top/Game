import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Database, Table, Edit, Trash2, Eye } from 'lucide-react';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import { ArrowLeft } from 'lucide-react'; // Import ArrowLeft icon

interface DatabaseTable {
  id: string;
  name: string;
  description: string;
  recordCount: number; // This will remain mock or derived if possible
  fields: { name: string; type: string }[]; // Simplified fields
}

const DatabaseManagement: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [tables, setTables] = useState<DatabaseTable[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<DatabaseTable | null>(null);
  const [tableName, setTableName] = useState('');
  const [tableDescription, setTableDescription] = useState('');
  const [tableFields, setTableFields] = useState<{ name: string; type: string }[]>([{ name: '', type: '' }]);
  const { toast } = useToast();
  const navigate = useNavigate(); // Initialize useNavigate

  const fetchTables = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3002/api/user-tables/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      const fetchedTables: DatabaseTable[] = data.map((item: any) => ({
        id: item.id.toString(),
        name: item.name,
        description: item.description,
        recordCount: Math.floor(Math.random() * 1000) + 50, // Mock record count for now
        fields: JSON.parse(item.schemaJson || '[]'),
      }));
      setTables(fetchedTables);
    } catch (error) {
      console.error("Failed to fetch database tables:", error);
      toast({
        title: "加载失败",
        description: "无法加载数据表列表。",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchTables();
  }, [projectId]);

  const resetForm = () => {
    setEditingTable(null);
    setTableName('');
    setTableDescription('');
    setTableFields([{ name: '', type: '' }]);
  };

  const handleOpenDialog = (table?: DatabaseTable) => {
    if (table) {
      setEditingTable(table);
      setTableName(table.name);
      setTableDescription(table.description);
      setTableFields(table.fields.length > 0 ? table.fields : [{ name: '', type: '' }]);
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleAddField = () => {
    setTableFields([...tableFields, { name: '', type: '' }]);
  };

  const handleFieldChange = (index: number, key: 'name' | 'type', value: string) => {
    const newFields = [...tableFields];
    newFields[index][key] = value;
    setTableFields(newFields);
  };

  const handleRemoveField = (index: number) => {
    const newFields = tableFields.filter((_, i) => i !== index);
    setTableFields(newFields.length > 0 ? newFields : [{ name: '', type: '' }]);
  };

  const handleSave = async () => {
    if (!tableName.trim() || !tableDescription.trim()) {
      toast({
        title: "保存失败",
        description: "表名称和描述不能为空。",
        variant: "destructive",
      });
      return;
    }

    const validFields = tableFields.filter(field => field.name.trim() !== '');
    if (validFields.length === 0) {
      toast({
        title: "保存失败",
        description: "至少需要定义一个字段。",
        variant: "destructive",
      });
      return;
    }

    const payload = {
      projectId: projectId,
      name: tableName,
      description: tableDescription,
      schemaJson: JSON.stringify(validFields),
    };

    try {
      let response;
      if (editingTable) {
        response = await fetch(`http://localhost:3002/api/user-tables/${editingTable.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch('http://localhost:3002/api/user-tables', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify(payload),
        });
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      fetchTables(); // Re-fetch data to update UI
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: editingTable ? "更新成功" : "创建成功",
        description: `数据表 "${tableName}" 已${editingTable ? '更新' : '创建'}。`,
      });
    } catch (error) {
      console.error("Failed to save database table:", error);
      toast({
        title: "保存失败",
        description: `无法${editingTable ? '更新' : '创建'}数据表。`,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3002/api/user-tables/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      fetchTables(); // Re-fetch data to update UI
      toast({
        title: "删除成功",
        description: "数据表已删除。",
      });
    } catch (error) {
      console.error("Failed to delete database table:", error);
      toast({
        title: "删除失败",
        description: "无法删除数据表。",
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
            <CardTitle className="text-2xl font-bold text-blue-400">项目 {projectId} - 数据库管理</CardTitle>
            <CardDescription className="text-gray-300">
              在这里管理您的游戏数据库，包括数据表和记录。
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => handleOpenDialog()}>
                <PlusCircle className="mr-2 h-4 w-4" />
                创建新表
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] bg-gray-900 text-white border-gray-700">
              <DialogHeader>
                <DialogTitle className="text-blue-400">{editingTable ? '编辑数据表' : '创建新表'}</DialogTitle>
                <DialogDescription className="text-gray-400">
                  {editingTable ? '修改数据表的结构和信息。' : '定义一个新的数据表。'}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="tableName" className="text-right text-gray-300">
                    表名称
                  </Label>
                  <Input
                    id="tableName"
                    value={tableName}
                    onChange={(e) => setTableName(e.target.value)}
                    className="col-span-3 bg-gray-800 border-gray-600 text-white focus:border-blue-500"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="tableDescription" className="text-right text-gray-300">
                    描述
                  </Label>
                  <Textarea
                    id="tableDescription"
                    value={tableDescription}
                    onChange={(e) => setTableDescription(e.target.value)}
                    className="col-span-3 bg-gray-800 border-gray-600 text-white focus:border-blue-500"
                    rows={3}
                  />
                </div>
                <div className="col-span-4">
                  <h3 className="text-lg font-semibold text-gray-200 mb-2">字段定义</h3>
                  {tableFields.map((field, index) => (
                    <div key={index} className="grid grid-cols-6 items-center gap-2 mb-2">
                      <Label htmlFor={`fieldName-${index}`} className="col-span-1 text-right text-gray-300">
                        字段名
                      </Label>
                      <Input
                        id={`fieldName-${index}`}
                        value={field.name}
                        onChange={(e) => handleFieldChange(index, 'name', e.target.value)}
                        className="col-span-2 bg-gray-800 border-gray-600 text-white focus:border-blue-500"
                        placeholder="例如: userId"
                      />
                      <Label htmlFor={`fieldType-${index}`} className="col-span-1 text-right text-gray-300">
                        类型
                      </Label>
                      <Input
                        id={`fieldType-${index}`}
                        value={field.type}
                        onChange={(e) => handleFieldChange(index, 'type', e.target.value)}
                        className="col-span-1 bg-gray-800 border-gray-600 text-white focus:border-blue-500"
                        placeholder="例如: string"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveField(index)}
                        className="col-span-1 text-red-400 hover:bg-red-900/20"
                      >
                        移除
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" onClick={handleAddField} className="mt-2 text-blue-400 border-blue-400 hover:bg-blue-900/20">
                    添加字段
                  </Button>
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
        </CardHeader>
      </Card>

      {tables.length === 0 ? (
        <div className="text-center text-gray-400 py-10">
          <Database className="mx-auto h-12 w-12 mb-4 text-gray-500" />
          <p className="text-lg">暂无自定义数据表。</p>
          <p className="text-sm">点击“创建新表”开始定义您的游戏数据结构。</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {tables.map((table) => (
            <Card key={table.id} className="bg-gradient-to-br from-gray-800 to-gray-900 text-white shadow-lg border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center space-x-2">
                  <Table className="h-5 w-5 text-blue-400" />
                  <CardTitle className="text-lg font-bold">{table.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-300 line-clamp-2">描述: {table.description}</p>
                <p className="text-sm text-gray-300">记录数: {table.recordCount}</p>
                <div className="mt-2">
                  <h4 className="text-xs font-semibold text-gray-400">字段:</h4>
                  <ul className="list-disc list-inside text-xs text-gray-400 max-h-16 overflow-auto">
                    {table.fields.map((field, idx) => (
                      <li key={idx}>{field.name} ({field.type})</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
              <CardContent className="flex justify-end space-x-2 pt-0">
                <Button variant="outline" size="sm" className="text-blue-300 border-blue-300 hover:bg-blue-300 hover:text-blue-900" onClick={() => toast({ title: "功能开发中", description: "查看记录功能正在开发中。", variant: "default" })}>
                  <Eye className="h-4 w-4" />
                  <span className="ml-1">查看记录</span>
                </Button>
                <Button variant="outline" size="sm" className="text-yellow-300 border-yellow-300 hover:bg-yellow-300 hover:text-yellow-900" onClick={() => handleOpenDialog(table)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(table.id)}>
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

export default DatabaseManagement;
