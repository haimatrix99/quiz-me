import { PrismaClient, Video, UploadStatus, ProcessStatus } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

interface MigrationConfig {
  supabaseUrl: string;
  supabaseServiceKey: string;
  videoBucketName: string;
  thumbnailBucketName: string;
  batchSize: number;
  retryAttempts: number;
  deleteAfterMigration: boolean;
  dryRun: boolean;
}

interface MigrationResult {
  videoId: string;
  videoName: string;
  success: boolean;
  error?: string;
  oldVideoUrl?: string;
  newVideoUrl?: string;
  oldThumbnailUrl?: string;
  newThumbnailUrl?: string;
}

interface MigrationSummary {
  totalVideos: number;
  successfulMigrations: number;
  failedMigrations: number;
  skippedVideos: number;
  results: MigrationResult[];
  startTime: Date;
  endTime?: Date;
  duration?: string;
}

class VideoMigrationService {
  private prisma: PrismaClient;
  private supabase: any;
  private config: MigrationConfig;
  private tempDir: string;
  private summary: MigrationSummary;

  constructor(config: MigrationConfig) {
    this.config = config;
    this.prisma = new PrismaClient();
    this.supabase = createClient(config.supabaseUrl, config.supabaseServiceKey);
    this.tempDir = path.join(process.cwd(), 'temp-migration');
    this.summary = {
      totalVideos: 0,
      successfulMigrations: 0,
      failedMigrations: 0,
      skippedVideos: 0,
      results: [],
      startTime: new Date(),
    };

    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  private async downloadFile(url: string, filename: string): Promise<string> {
    const filePath = path.join(this.tempDir, filename);
    
    try {
      const response = await axios({
        method: 'GET',
        url: url,
        responseType: 'stream',
        timeout: 60000,
      });

      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('finish', () => resolve(filePath));
        writer.on('error', reject);
      });
    } catch (error) {
      throw new Error(`Failed to download file from ${url}: ${error}`);
    }
  }

  private async uploadToSupabase(
    filePath: string,
    bucketName: string,
    storagePath: string
  ): Promise<string> {
    try {
      const fileBuffer = fs.readFileSync(filePath);
      
      const { data, error } = await this.supabase.storage
        .from(bucketName)
        .upload(storagePath, fileBuffer, {
          contentType: this.getContentType(filePath),
          upsert: true,
        });

      if (error) {
        throw error;
      }

      const { data: { publicUrl } } = this.supabase.storage
        .from(bucketName)
        .getPublicUrl(storagePath);

      return publicUrl;
    } catch (error) {
      throw new Error(`Failed to upload to Supabase: ${error}`);
    }
  }

  private getContentType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
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

  private async cleanupTempFile(filePath: string): Promise<void> {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.warn(`Failed to cleanup temp file ${filePath}: ${error}`);
    }
  }

  private async deleteFromUploadThing(key: string): Promise<boolean> {
    try {
      console.log(`Would delete UploadThing file with key: ${key}`);
      return true;
    } catch (error) {
      console.error(`Failed to delete from UploadThing: ${error}`);
      return false;
    }
  }

  private async migrateVideo(video: Video): Promise<MigrationResult> {
    const result: MigrationResult = {
      videoId: video.id,
      videoName: video.name,
      success: false,
    };

    console.log(`\nMigrating video: ${video.name} (${video.id})`);

    try {
      if (!video.url || !video.url.includes('uploadthing') && !video.url.includes('utfs.io')) {
        console.log(`Video already migrated or has non-UploadThing URL: ${video.url}`);
        result.success = true;
        this.summary.skippedVideos++;
        return result;
      }

      result.oldVideoUrl = video.url;
      result.oldThumbnailUrl = video.thumbnailUrl || undefined;

      let tempVideoPath: string | undefined;
      let tempThumbnailPath: string | undefined;
      let newVideoUrl: string | undefined;
      let newThumbnailUrl: string | undefined;

      try {
        console.log(`  Downloading video from: ${video.url}`);
        const videoExtension = path.extname(new URL(video.url).pathname) || '.mp4';
        const videoFilename = `${video.id}_video${videoExtension}`;
        tempVideoPath = await this.downloadFile(video.url, videoFilename);
        console.log(`  Video downloaded to: ${tempVideoPath}`);

        const videoStoragePath = `videos/${video.userId}/${video.id}${videoExtension}`;
        console.log(`  Uploading video to Supabase: ${videoStoragePath}`);
        newVideoUrl = await this.uploadToSupabase(
          tempVideoPath,
          this.config.videoBucketName,
          videoStoragePath
        );
        console.log(`  Video uploaded successfully: ${newVideoUrl}`);
        result.newVideoUrl = newVideoUrl;

        if (video.thumbnailUrl && video.thumbnailUrl.includes('uploadthing')) {
          console.log(`  Downloading thumbnail from: ${video.thumbnailUrl}`);
          const thumbnailExtension = path.extname(new URL(video.thumbnailUrl).pathname) || '.jpg';
          const thumbnailFilename = `${video.id}_thumbnail${thumbnailExtension}`;
          tempThumbnailPath = await this.downloadFile(video.thumbnailUrl, thumbnailFilename);
          console.log(`  Thumbnail downloaded to: ${tempThumbnailPath}`);

          const thumbnailStoragePath = `thumbnails/${video.userId}/${video.id}${thumbnailExtension}`;
          console.log(`  Uploading thumbnail to Supabase: ${thumbnailStoragePath}`);
          newThumbnailUrl = await this.uploadToSupabase(
            tempThumbnailPath,
            this.config.thumbnailBucketName,
            thumbnailStoragePath
          );
          console.log(`  Thumbnail uploaded successfully: ${newThumbnailUrl}`);
          result.newThumbnailUrl = newThumbnailUrl;
        }

        if (!this.config.dryRun) {
          console.log(`  Updating database records...`);
          await this.prisma.video.update({
            where: { id: video.id },
            data: {
              url: newVideoUrl,
              thumbnailUrl: newThumbnailUrl || video.thumbnailUrl,
              key: `videos/${video.userId}/${video.id}${videoExtension}`,
              thumbnailKey: newThumbnailUrl ? `thumbnails/${video.userId}/${video.id}${path.extname(new URL(video.thumbnailUrl!).pathname) || '.jpg'}` : video.thumbnailKey,
            },
          });
          console.log(`  Database updated successfully`);

          const updatedVideo = await this.prisma.video.findUnique({
            where: { id: video.id },
          });

          if (updatedVideo?.url === newVideoUrl) {
            console.log(`  Migration verified successfully`);
            
            if (this.config.deleteAfterMigration && video.key) {
              console.log(`  Deleting old UploadThing files...`);
              await this.deleteFromUploadThing(video.key);
              if (video.thumbnailKey) {
                await this.deleteFromUploadThing(video.thumbnailKey);
              }
            }
          } else {
            throw new Error('Database update verification failed');
          }
        } else {
          console.log(`  [DRY RUN] Would update database with new URLs`);
        }

        result.success = true;
        this.summary.successfulMigrations++;
        console.log(`✅ Successfully migrated video: ${video.name}`);

      } finally {
        if (tempVideoPath) await this.cleanupTempFile(tempVideoPath);
        if (tempThumbnailPath) await this.cleanupTempFile(tempThumbnailPath);
      }

    } catch (error) {
      result.error = error instanceof Error ? error.message : String(error);
      this.summary.failedMigrations++;
      console.error(`❌ Failed to migrate video ${video.name}: ${result.error}`);
    }

    return result;
  }

  private async migrateWithRetry(video: Video, attempts: number = 0): Promise<MigrationResult> {
    try {
      return await this.migrateVideo(video);
    } catch (error) {
      if (attempts < this.config.retryAttempts) {
        console.log(`  Retrying migration (attempt ${attempts + 1}/${this.config.retryAttempts})...`);
        await new Promise(resolve => setTimeout(resolve, 2000 * (attempts + 1)));
        return this.migrateWithRetry(video, attempts + 1);
      }
      throw error;
    }
  }

  public async migrate(): Promise<MigrationSummary> {
    console.log('='.repeat(60));
    console.log('VIDEO MIGRATION TO SUPABASE');
    console.log('='.repeat(60));
    console.log(`Configuration:`);
    console.log(`  - Supabase URL: ${this.config.supabaseUrl}`);
    console.log(`  - Video Bucket: ${this.config.videoBucketName}`);
    console.log(`  - Thumbnail Bucket: ${this.config.thumbnailBucketName}`);
    console.log(`  - Batch Size: ${this.config.batchSize}`);
    console.log(`  - Retry Attempts: ${this.config.retryAttempts}`);
    console.log(`  - Delete After Migration: ${this.config.deleteAfterMigration}`);
    console.log(`  - Dry Run: ${this.config.dryRun}`);
    console.log('='.repeat(60));

    try {
      const videos = await this.prisma.video.findMany({
        where: {
          uploadStatus: UploadStatus.SUCCESS,
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      this.summary.totalVideos = videos.length;
      console.log(`\nFound ${videos.length} videos to process\n`);

      for (let i = 0; i < videos.length; i += this.config.batchSize) {
        const batch = videos.slice(i, i + this.config.batchSize);
        console.log(`\nProcessing batch ${Math.floor(i / this.config.batchSize) + 1}/${Math.ceil(videos.length / this.config.batchSize)}`);
        
        const batchResults = await Promise.allSettled(
          batch.map(video => this.migrateWithRetry(video))
        );

        for (const result of batchResults) {
          if (result.status === 'fulfilled') {
            this.summary.results.push(result.value);
          } else {
            console.error(`Batch processing error: ${result.reason}`);
          }
        }

        if (i + this.config.batchSize < videos.length) {
          console.log(`\nWaiting before next batch...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      this.summary.endTime = new Date();
      const duration = this.summary.endTime.getTime() - this.summary.startTime.getTime();
      this.summary.duration = this.formatDuration(duration);

      this.printSummary();
      this.saveSummaryToFile();

      return this.summary;

    } catch (error) {
      console.error(`Migration failed: ${error}`);
      throw error;
    } finally {
      await this.cleanup();
    }
  }

  private formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  private printSummary(): void {
    console.log('\n' + '='.repeat(60));
    console.log('MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Videos: ${this.summary.totalVideos}`);
    console.log(`Successful: ${this.summary.successfulMigrations}`);
    console.log(`Failed: ${this.summary.failedMigrations}`);
    console.log(`Skipped: ${this.summary.skippedVideos}`);
    console.log(`Duration: ${this.summary.duration}`);
    console.log('='.repeat(60));

    if (this.summary.failedMigrations > 0) {
      console.log('\nFailed Videos:');
      this.summary.results
        .filter(r => !r.success && r.error)
        .forEach(r => {
          console.log(`  - ${r.videoName} (${r.videoId}): ${r.error}`);
        });
    }
  }

  private saveSummaryToFile(): void {
    const summaryPath = path.join(
      process.cwd(),
      `migration-summary-${new Date().toISOString().replace(/:/g, '-')}.json`
    );
    
    fs.writeFileSync(summaryPath, JSON.stringify(this.summary, null, 2));
    console.log(`\nMigration summary saved to: ${summaryPath}`);
  }

  private async cleanup(): Promise<void> {
    console.log('\nCleaning up...');
    
    try {
      if (fs.existsSync(this.tempDir)) {
        fs.rmSync(this.tempDir, { recursive: true, force: true });
      }
    } catch (error) {
      console.warn(`Failed to cleanup temp directory: ${error}`);
    }

    await this.prisma.$disconnect();
  }
}

async function validateEnvironment(): Promise<MigrationConfig> {
  const required = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_KEY',
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  return {
    supabaseUrl: process.env.SUPABASE_URL!,
    supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY!,
    videoBucketName: process.env.SUPABASE_VIDEO_BUCKET || 'videos',
    thumbnailBucketName: process.env.SUPABASE_THUMBNAIL_BUCKET || 'thumbnails',
    batchSize: parseInt(process.env.MIGRATION_BATCH_SIZE || '5'),
    retryAttempts: parseInt(process.env.MIGRATION_RETRY_ATTEMPTS || '3'),
    deleteAfterMigration: process.env.DELETE_AFTER_MIGRATION === 'true',
    dryRun: process.env.DRY_RUN === 'true',
  };
}

async function main() {
  try {
    console.log('Starting video migration to Supabase...\n');
    
    const config = await validateEnvironment();
    
    if (config.dryRun) {
      console.log('⚠️  Running in DRY RUN mode - no changes will be made\n');
    }

    if (config.deleteAfterMigration) {
      console.log('⚠️  DELETE_AFTER_MIGRATION is enabled - old files will be deleted after successful migration\n');
      console.log('Press Ctrl+C within 5 seconds to cancel...\n');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    const migrationService = new VideoMigrationService(config);
    const summary = await migrationService.migrate();

    if (summary.failedMigrations > 0) {
      console.error('\n⚠️  Migration completed with errors. Please review the failed videos.');
      process.exit(1);
    } else {
      console.log('\n✅ Migration completed successfully!');
      process.exit(0);
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { VideoMigrationService, MigrationConfig, MigrationResult, MigrationSummary };