import { supabaseAdmin } from '../config/supabase';
import { CustomError } from '../middleware/errorHandler';
import * as fs from 'fs';
import * as path from 'path';

export interface UploadFileParams {
  file: {
    uri: string;
    type: string;
    name: string;
  };
  bucket: string;
  folder?: string;
}

/**
 * Upload a file to Supabase Storage
 * @param params File upload parameters
 * @returns Public URL of the uploaded file
 */
export const uploadFile = async (params: UploadFileParams): Promise<string> => {
  try {
    const { file, bucket, folder } = params;
    
    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = path.extname(file.name) || '.jpg';
    const fileName = `${timestamp}_${randomString}${fileExtension}`;
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    // Handle file data - can be base64 data URI, file path, or URL
    let fileBuffer: Buffer;
    
    if (file.uri.startsWith('data:')) {
      // Base64 data URI (format: data:image/jpeg;base64,/9j/4AAQSkZJRg...)
      const base64Match = file.uri.match(/^data:([^;]+);base64,(.+)$/);
      if (base64Match && base64Match[2]) {
        fileBuffer = Buffer.from(base64Match[2], 'base64');
      } else {
        // Fallback: try to extract base64 data after comma
        const base64Data = file.uri.split(',')[1];
        if (base64Data) {
          fileBuffer = Buffer.from(base64Data, 'base64');
        } else {
          throw new CustomError('Invalid base64 data URI format', 400);
        }
      }
    } else if (file.uri.startsWith('file://') || file.uri.startsWith('/')) {
      // Local file path (for server-side file handling)
      try {
        const filePath = file.uri.replace('file://', '');
        fileBuffer = fs.readFileSync(filePath);
      } catch (error: any) {
        throw new CustomError(`Failed to read file: ${error.message}`, 500);
      }
    } else if (file.uri.startsWith('http://') || file.uri.startsWith('https://')) {
      // Remote URL - fetch it
      try {
        const response = await fetch(file.uri);
        if (!response.ok) {
          throw new Error(`Failed to fetch file: ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        fileBuffer = Buffer.from(arrayBuffer);
      } catch (error: any) {
        throw new CustomError(`Failed to fetch file from URL: ${error.message}`, 500);
      }
    } else {
      // Assume it's raw base64 string
      try {
        fileBuffer = Buffer.from(file.uri, 'base64');
      } catch (error: any) {
        throw new CustomError('Invalid file data format', 400);
      }
    }

    // Upload to Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(filePath, fileBuffer, {
        contentType: file.type || 'image/jpeg',
        upsert: false,
      });

    if (error) {
      throw new CustomError(`Failed to upload file: ${error.message}`, 500);
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from(bucket)
      .getPublicUrl(filePath);

    if (!urlData?.publicUrl) {
      throw new CustomError('Failed to get public URL for uploaded file', 500);
    }

    return urlData.publicUrl;
  } catch (error: any) {
    if (error instanceof CustomError) {
      throw error;
    }
    throw new CustomError(`File upload error: ${error.message}`, 500);
  }
};

/**
 * Delete a file from Supabase Storage
 * @param bucket Storage bucket name
 * @param filePath Path to the file in storage
 */
export const deleteFile = async (bucket: string, filePath: string): Promise<void> => {
  try {
    const { error } = await supabaseAdmin.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      throw new CustomError(`Failed to delete file: ${error.message}`, 500);
    }
  } catch (error: any) {
    if (error instanceof CustomError) {
      throw error;
    }
    throw new CustomError(`File deletion error: ${error.message}`, 500);
  }
};

/**
 * Upload multiple files
 * @param files Array of files to upload
 * @param bucket Storage bucket name
 * @param folder Optional folder path
 * @returns Array of public URLs
 */
export const uploadMultipleFiles = async (
  files: Array<{ uri: string; type: string; name: string }>,
  bucket: string,
  folder?: string
): Promise<string[]> => {
  const uploadPromises = files.map((file) =>
    uploadFile({ file, bucket, folder })
  );
  return Promise.all(uploadPromises);
};

