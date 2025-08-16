import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Import Card components for consistent styling
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton for loading state

interface BuildRecord {
  id: number;
  projectId: number;
  version: string;
  platform: string;
  status: "成功" | "失败" | "进行中";
  timestamp: string;
  duration: string;
}

interface BuildHistoryListProps {
  projectId: string; // Now accepts projectId as a prop
}

const BuildHistoryList: React.FC<BuildHistoryListProps> = ({ projectId }) => {
  const [buildRecords, setBuildRecords] = useState<BuildRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBuilds = useCallback(async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/builds?projectId=${projectId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: BuildRecord[] = await response.json();
      setBuildRecords(data);
    } catch (err: any) {
      setError(err.message);
      console.error("Error fetching build history:", err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchBuilds();
  }, [fetchBuilds]);

  const getStatusBadgeVariant = (status: BuildRecord["status"]) => {
    switch (status) {
      case "成功":
        return "default"; // Green-like default
      case "失败":
        return "destructive"; // Red
      case "进行中":
        return "secondary"; // Gray/blue
      default:
        return "outline";
    }
  };

  if (loading) {
    return (
      <Card className="bg-gray-800 text-gray-100 border-gray-700">
        <CardHeader>
          <CardTitle>构建历史</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-4 w-full bg-gray-700" />
            <Skeleton className="h-4 w-full bg-gray-700" />
            <Skeleton className="h-4 w-full bg-gray-700" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-gray-800 text-gray-100 border-gray-700">
        <CardHeader>
          <CardTitle>构建历史</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">错误: {error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-800 text-gray-100 border-gray-700">
      <CardHeader>
        <CardTitle>构建历史</CardTitle>
      </CardHeader>
      <CardContent>
        {buildRecords.length === 0 ? (
          <p className="text-gray-400">暂无构建历史记录。</p>
        ) : (
          <Table className="bg-gray-700 rounded-md">
            <TableHeader>
              <TableRow className="border-gray-600">
                <TableHead className="w-[100px] text-gray-300">构建ID</TableHead>
                <TableHead className="text-gray-300">版本</TableHead>
                <TableHead className="text-gray-300">平台</TableHead>
                <TableHead className="text-gray-300">状态</TableHead>
                <TableHead className="text-gray-300">时间</TableHead>
                <TableHead className="text-gray-300">耗时</TableHead>
                <TableHead className="text-right text-gray-300">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {buildRecords.map((record) => (
                <TableRow key={record.id} className="border-gray-600 hover:bg-gray-700">
                  <TableCell className="font-medium text-gray-200">{record.id}</TableCell>
                  <TableCell className="text-gray-200">{record.version}</TableCell>
                  <TableCell className="text-gray-200">{record.platform}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(record.status)}>
                      {record.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-200">{record.timestamp}</TableCell>
                  <TableCell className="text-gray-200">{record.duration || '-'}</TableCell>
                  <TableCell className="text-right">
                    <a href="#" className="text-blue-400 hover:underline">查看日志</a>
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

export default BuildHistoryList;