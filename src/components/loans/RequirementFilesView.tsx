"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Download, 
  Eye, 
  Image, 
  File
} from "lucide-react";

interface UploadedFile {
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  path: string;
}

interface RequirementFilesViewProps {
  files: UploadedFile[] | null;
  loanNumber: string;
  borrowerName: string;
}

export function RequirementFilesView({ files, loanNumber, borrowerName }: RequirementFilesViewProps) {

  if (!files || files.length === 0) {
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <FileText className="w-4 h-4" />
            Requirement Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No documents uploaded</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return <FileText className="w-4 h-4 text-red-500" />;
    if (mimeType.includes('image')) return <Image className="w-4 h-4 text-blue-500" />;
    if (mimeType.includes('word')) return <FileText className="w-4 h-4 text-blue-600" />;
    return <File className="w-4 h-4 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownload = (file: UploadedFile) => {
    // Create download link
    const link = document.createElement('a');
    link.href = file.path;
    link.download = file.originalName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePreview = (file: UploadedFile) => {
    // Open file in new tab for preview
    window.open(file.path, '_blank');
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-sm">
              <FileText className="w-4 h-4" />
              Requirement Documents
            </CardTitle>
            <CardDescription>
              Documents uploaded by {borrowerName} for loan {loanNumber}
            </CardDescription>
          </div>
          <Badge variant="secondary">
            {files.length} file{files.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {files.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                {getFileIcon(file.mimeType)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate" title={file.originalName}>
                    {file.originalName}
                  </p>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <span>{formatFileSize(file.size)}</span>
                    <span>•</span>
                    <span>{file.mimeType.split('/')[1].toUpperCase()}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handlePreview(file)}
                  className="h-8 w-8 p-0"
                  title="Preview file"
                >
                  <Eye className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownload(file)}
                  className="h-8 w-8 p-0"
                  title="Download file"
                >
                  <Download className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
        
        {/* Quick Actions */}
        <div className="mt-4 pt-3 border-t">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>All documents can be previewed or downloaded</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                // Download all files (simplified - in real implementation, create zip)
                files.forEach(file => handleDownload(file));
              }}
              className="text-xs"
            >
              <Download className="w-3 h-3 mr-1" />
              Download All
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
