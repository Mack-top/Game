import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UploadCloud, Trash2 } from "lucide-react"; // Icons

interface Asset {
  id: number;
  name: string;
  path: string; // Relative path from server, e.g., /uploads/filename.png
  type: string;
  size: number; // in bytes
  uploadDate: string;
  projectId: number;
}

interface ProjectAssetsListProps {
  projectId: string;
}

const ProjectAssetsList: React.FC<ProjectAssetsListProps> = ({ projectId }) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);

  const fetchAssets = useCallback(async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/assets?projectId=${projectId}`);
      if (!response.ok) throw new Error('Failed to fetch assets');
      const data = await response.json();
      setAssets(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const handleDeleteAsset = async (assetId: number) => {
    if (!window.confirm("确定要删除此资产吗？")) return;
    try {
      const response = await fetch(`http://localhost:3001/api/assets/${assetId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete asset');
      fetchAssets(); // Refresh list
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) return <p className="text-white">加载资产...</p>;
  if (error) return <p className="text-red-500">错误: {error}</p>;

  return (
    <Card className="bg-gray-800 text-gray-100 border-gray-700">
      <CardHeader className="flex flex-row justify-between items-center">
        <CardTitle>项目资产</CardTitle>
        <AddAssetForm projectId={projectId} onAssetUploaded={() => { fetchAssets(); setIsUploadDialogOpen(false); }} isOpen={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen} />
      </CardHeader>
      <CardContent>
        {assets.length === 0 ? (
          <p className="text-gray-400">暂无资产。点击“上传资产”添加。</p>
        ) : (
          <Table className="bg-gray-700 rounded-md">
            <TableHeader>
              <TableRow className="border-gray-600">
                <TableHead className="text-gray-300">名称</TableHead>
                <TableHead className="text-gray-300">类型</TableHead>
                <TableHead className="text-gray-300">大小</TableHead>
                <TableHead className="text-gray-300">上传日期</TableHead>
                <TableHead className="text-gray-300 text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assets.map((asset) => (
                <TableRow key={asset.id} className="border-gray-600">
                  <TableCell className="font-medium text-gray-200">
                    <a href={`http://localhost:3001${asset.path}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                      {asset.name}
                    </a>
                  </TableCell>
                  <TableCell className="text-gray-200">{asset.type}</TableCell>
                  <TableCell className="text-gray-200">{(asset.size / 1024).toFixed(2)} KB</TableCell>
                  <TableCell className="text-gray-200">{new Date(asset.uploadDate).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteAsset(asset.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

// --- Add Asset Form Component ---
interface AddAssetFormProps {
  projectId: string;
  onAssetUploaded: () => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const AddAssetForm: React.FC<AddAssetFormProps> = ({ projectId, onAssetUploaded, isOpen, onOpenChange }) => {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setName(e.target.files[0].name); // Default name to filename
      setType(e.target.files[0].type); // Default type to file mimetype
    } else {
      setFile(null);
      setName('');
      setType('');
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      setUploadError("请选择一个文件。");
      return;
    }
    setUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name);
    formData.append('type', type);
    formData.append('projectId', projectId); // Append projectId

    try {
      const response = await fetch("http://localhost:3001/api/assets/upload", {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '文件上传失败');
      }

      onAssetUploaded(); // Callback to refresh list and close dialog
      setFile(null);
      setName('');
      setType('');
    } catch (err: any) {
      setUploadError(err.message);
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          <UploadCloud className="mr-2 h-4 w-4" />上传资产
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-gray-800 text-gray-100 border-gray-700">
        <DialogHeader>
          <DialogTitle>上传新资产</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="file" className="text-right">文件</Label>
            <Input id="file" type="file" onChange={handleFileChange} className="col-span-3 bg-gray-700 border-gray-600" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">名称</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3 bg-gray-700 border-gray-600" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="type" className="text-right">类型</Label>
            <Input id="type" value={type} onChange={(e) => setType(e.target.value)} placeholder="例如: image/png" className="col-span-3 bg-gray-700 border-gray-600" />
          </div>
          {uploadError && <p className="col-span-4 text-red-500 text-center">{uploadError}</p>}
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={uploading} className="bg-blue-600 hover:bg-blue-700 text-white">
            {uploading ? '上传中...' : '上传'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectAssetsList;