import { supabaseAdmin, STORAGE_BUCKETS } from './supabase';
import fs from 'fs';
import path from 'path';

export class SupabaseStorageApi {
  async uploadFile(
    file: File | Buffer,
    fileName: string,
    bucket: keyof typeof STORAGE_BUCKETS,
    userId: string
  ): Promise<{ url: string; key: string }> {
    try {
      const ext = path.extname(fileName);
      const nameWithoutExt = path.basename(fileName, ext);
      const timestamp = Date.now();
      const uniqueFileName = `${nameWithoutExt}_${timestamp}${ext}`;
      const storagePath = `${userId}/${uniqueFileName}`;

      let fileData: ArrayBuffer | Buffer;
      
      if (file instanceof File) {
        fileData = await file.arrayBuffer();
      } else {
        fileData = file;
      }

      const { data, error } = await supabaseAdmin.storage
        .from(STORAGE_BUCKETS[bucket])
        .upload(storagePath, fileData, {
          contentType: this.getContentType(fileName),
          upsert: false,
        });

      if (error) {
        throw new Error(`Failed to upload file: ${error.message}`);
      }

      const { data: { publicUrl } } = supabaseAdmin.storage
        .from(STORAGE_BUCKETS[bucket])
        .getPublicUrl(storagePath);

      return {
        url: publicUrl,
        key: storagePath,
      };
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  }

  async uploadFiles(
    file: File | Buffer,
    fileName: string,
    bucket: keyof typeof STORAGE_BUCKETS,
    userId: string
  ): Promise<{ data: { url: string; key: string } | null }> {
    try {
      const result = await this.uploadFile(file, fileName, bucket, userId);
      return { data: result };
    } catch (error) {
      console.error('Upload error:', error);
      return { data: null };
    }
  }

  async deleteFiles(keys: string[]): Promise<void> {
    try {
      const videoKeys = keys.filter(key => key && !key.includes('thumbnail'));
      const thumbnailKeys = keys.filter(key => key && key.includes('thumbnail'));

      if (videoKeys.length > 0) {
        const { error: videoError } = await supabaseAdmin.storage
          .from(STORAGE_BUCKETS.videos)
          .remove(videoKeys);

        if (videoError) {
          console.error('Error deleting video files:', videoError);
        }
      }

      if (thumbnailKeys.length > 0) {
        const { error: thumbnailError } = await supabaseAdmin.storage
          .from(STORAGE_BUCKETS.thumbnails)
          .remove(thumbnailKeys);

        if (thumbnailError) {
          console.error('Error deleting thumbnail files:', thumbnailError);
        }
      }
    } catch (error) {
      console.error('Delete error:', error);
      throw error;
    }
  }

  async deleteFile(key: string, bucket: keyof typeof STORAGE_BUCKETS): Promise<void> {
    try {
      const { error } = await supabaseAdmin.storage
        .from(STORAGE_BUCKETS[bucket])
        .remove([key]);

      if (error) {
        throw new Error(`Failed to delete file: ${error.message}`);
      }
    } catch (error) {
      console.error('Delete error:', error);
      throw error;
    }
  }

  private getContentType(fileName: string): string {
    const ext = path.extname(fileName).toLowerCase();
    const contentTypes: { [key: string]: string } = {
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.ogg': 'video/ogg',
      '.mov': 'video/quicktime',
      '.avi': 'video/x-msvideo',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
    };
    return contentTypes[ext] || 'application/octet-stream';
  }

  async getFileUrl(key: string, bucket: keyof typeof STORAGE_BUCKETS): Promise<string> {
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from(STORAGE_BUCKETS[bucket])
      .getPublicUrl(key);
    
    return publicUrl;
  }
}

export const storageApi = new SupabaseStorageApi();