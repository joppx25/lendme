import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

export interface UploadedFile {
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  path: string;
}

export async function saveUploadedFiles(files: File[], uploadDir: string = 'loan-documents'): Promise<UploadedFile[]> {
  const uploadedFiles: UploadedFile[] = [];
  
  // Create upload directory if it doesn't exist
  const uploadsPath = join(process.cwd(), 'public', 'uploads', uploadDir);
  
  try {
    await mkdir(uploadsPath, { recursive: true });
  } catch (error) {
    console.error('Error creating upload directory:', error);
  }

  for (const file of files) {
    try {
      // Generate unique filename
      const fileExtension = file.name.split('.').pop() || '';
      const uniqueFilename = `${randomUUID()}.${fileExtension}`;
      const filePath = join(uploadsPath, uniqueFilename);
      
      // Convert File to Buffer
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      // Save file to disk
      await writeFile(filePath, buffer);
      
      uploadedFiles.push({
        filename: uniqueFilename,
        originalName: file.name,
        size: file.size,
        mimeType: file.type,
        path: `/uploads/${uploadDir}/${uniqueFilename}`
      });
    } catch (error) {
      console.error(`Error saving file ${file.name}:`, error);
      throw new Error(`Failed to save file: ${file.name}`);
    }
  }
  
  return uploadedFiles;
}

export function validateFile(file: File): { valid: boolean; error?: string } {
  // Check file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    return { valid: false, error: 'File size must be less than 5MB' };
  }
  
  // Check file type
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'File type not supported. Please upload PDF, JPG, PNG, or Word documents.' };
  }
  
  return { valid: true };
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
