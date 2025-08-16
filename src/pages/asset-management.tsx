import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, FileText, Image, Music, Folder, Trash2, Download, Edit, ArrowLeft } from 'lucide-react';
import { Dialog, DialogTrigger, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface Asset {
  id: string;
  name: string;
  type: 'model' | 'texture' | 'audio' | 'script' | 'other';
  size: string;
  uploadDate: string;
  path: string; // Path to the asset on the server
}

const getAssetIcon = (type: Asset['type']) => {
  switch (type) {
    case 'model':
      return <Folder className="h-5 w-5 text-blue-400" />;
    case 'texture':
      return <Image className="h-5 w-5 text-green-400" />;
    case 'audio':
      return <Music className="h-5 w-5 text-purple-400" />;
    case 'script':
      return <FileText className="h-5 w-5 text-yellow-400" />;
    default:
      return <Folder className="h-5 w-5 text-gray-400" />;
  }
};

const AssetManagement: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [newAssetName, setNewAssetName] = useState('');
  const [newAssetType, setNewAssetType] = useState<Asset['type']>('other');
  const [newAssetFile, setNewAssetFile] = useState<File | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { token } = useAuth();

  const fetchAssets = async () => {
    try {
      const response = await fetch(`http://localhost:3002/api/assets?projectId=${projectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: Asset[] = await response.json();
      setAssets(data);
    } catch (error) {
      console.error("Failed to fetch assets:", error);
      toast({
        title: "加载失败",
        description: "无法加载资产列表。",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchAssets();
  }, [projectId, token]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setNewAssetFile(event.target.files[0]);
    }
  };

  const handleUploadAsset = async () => {
    if (!newAssetName || !newAssetFile) {
      toast({
        title: "上传失败",
        description: "请填写资产名称并选择文件。",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append('file', newAssetFile);
    formData.append('name', newAssetName);
    formData.append('type', newAssetType);
    formData.append('projectId', projectId || '');

    try {
      const response = await fetch('http://localhost:3002/api/assets/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const uploadedAsset: Asset = await response.json();
      setAssets((prevAssets) => [...prevAssets, uploadedAsset]);
      setIsUploadDialogOpen(false);
      setNewAssetName('');
      setNewAssetType('other');
      setNewAssetFile(null);
      toast({
        title: "上传成功",
        description: `资产 "${uploadedAsset.name}" 已成功上传。`,
      });
    } catch (error) {
      console.error("Failed to upload asset:", error);
      toast({
        title: "上传失败",
        description: "无法上传资产。",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAsset = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:3002/api/assets/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setAssets(assets.filter(asset => asset.id !== id));
      toast({
        title: "删除成功",
        description: "资产已删除。",
      });
    } catch (error) {
      console.error("Failed to delete asset:", error);
      toast({
        title: "删除失败",
        description: "无法删除资产。",
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
            <CardTitle className="text-2xl font-bold text-blue-400">项目 {projectId} - 资产管理</CardTitle>
            <CardDescription className="text-gray-300">
              在这里管理您的游戏资产，包括模型、纹理、音频等。
            </CardDescription>
          </div>
          <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <PlusCircle className="mr-2 h-4 w-4" />
                上传资产
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-gray-900 text-white border-gray-700">
              <CardHeader>
                <CardTitle className="text-blue-400">上传新资产</CardTitle>
                <CardDescription className="text-gray-400">
                  填写资产信息并选择文件进行上传。
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="asset-name" className="text-right text-gray-300">
                    资产名称
                  </Label>
                  <Input
                    id="asset-name"
                    value={newAssetName}
                    onChange={(e) => setNewAssetName(e.target.value)}
                    className="col-span-3 bg-gray-800 border-gray-600 text-white focus:border-blue-500"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="asset-type" className="text-right text-gray-300">
                    资产类型
                  </Label>
                  <Select value={newAssetType} onValueChange={(value) => setNewAssetType(value as Asset['type'])}>
                    <SelectTrigger className="col-span-3 bg-gray-800 border-gray-600 text-white focus:border-blue-500">
                      <SelectValue placeholder="选择类型" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700 text-white">
                      <SelectItem value="model">模型</SelectItem>
                      <SelectItem value="texture">纹理</SelectItem>
                      <SelectItem value="audio">音频</SelectItem>
                      <SelectItem value="script">脚本</SelectItem>
                      <SelectItem value="other">其他</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="asset-file" className="text-right text-gray-300">
                    选择文件
                  </Label>
                  <Input
                    id="asset-file"
                    type="file"
                    onChange={handleFileUpload}
                    className="col-span-3 bg-gray-800 border-gray-600 text-white file:text-blue-400 file:bg-gray-700 file:border-none file:rounded-md file:px-3 file:py-1 hover:file:bg-gray-600"
                  />
                </div>
                {newAssetFile && (
                  <div className="col-span-4 text-center text-sm text-gray-400">
                    已选择: {newAssetFile.name} ({newAssetFile.size / 1024 > 1024 ? (newAssetFile.size / (1024 * 1024)).toFixed(2) + ' MB' : (newAssetFile.size / 1024).toFixed(2) + ' KB'})
                  </div>
                )}
              </CardContent>
              <CardContent className="flex justify-end pt-0">
                <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)} className="text-gray-300 border-gray-600 hover:bg-gray-700 hover:text-white mr-2">
                  取消
                </Button>
                <Button onClick={handleUploadAsset} className="bg-blue-600 hover:bg-blue-700 text-white">
                  上传
                </Button>
              </CardContent>
            </DialogContent>
          </Dialog>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {assets.map((asset) => (
          <Card key={asset.id} className="bg-gradient-to-br from-gray-800 to-gray-900 text-white shadow-lg border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center space-x-2">
                {getAssetIcon(asset.type)}
                <CardTitle className="text-lg font-bold">{asset.name}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {asset.type === 'texture' && asset.path && (
                <img src={`http://localhost:3002${asset.path}`} alt={asset.name} className="w-full h-32 object-cover rounded-md mb-2" />
              )}
              <p className="text-sm text-gray-300">类型: {asset.type}</p>
              <p className="text-sm text-gray-300">大小: {asset.size}</p>
              <p className="text-sm text-gray-400">上传日期: {new Date(asset.uploadDate).toLocaleDateString()}</p>
            </CardContent>
            <CardContent className="flex justify-end space-x-2 pt-0">
              <a href={`http://localhost:3002${asset.path}`} download={asset.name} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="text-blue-300 border-blue-300 hover:bg-blue-300 hover:text-blue-900">
                  <Download className="h-4 w-4" />
                </Button>
              </a>
              <Button variant="outline" size="sm" className="text-yellow-300 border-yellow-300 hover:bg-yellow-300 hover:text-yellow-900">
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="destructive" size="sm" onClick={() => handleDeleteAsset(asset.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AssetManagement;