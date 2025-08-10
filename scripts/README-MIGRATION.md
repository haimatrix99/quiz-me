# Video Migration Script - UploadThing to Supabase

This script migrates existing videos and thumbnails from UploadThing storage to Supabase storage buckets.

## Prerequisites

1. **Supabase Project Setup**
   - Create a Supabase project at https://supabase.com
   - Create two storage buckets:
     - `videos` - for video files
     - `thumbnails` - for thumbnail images
   - Set both buckets to public if you want direct URL access

2. **Environment Variables**
   - Copy `.env.migration.example` to `.env` (if not exists)
   - Fill in the required Supabase credentials
   - Configure migration settings

## Installation

```bash
# Install dependencies (if not already installed)
npm install @supabase/supabase-js dotenv axios

# Install dev dependencies for TypeScript execution
npm install -D ts-node @types/node
```

## Configuration

Edit your `.env` file with the following variables:

```env
# Required
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key

# Optional (with defaults)
SUPABASE_VIDEO_BUCKET=videos          # Default: 'videos'
SUPABASE_THUMBNAIL_BUCKET=thumbnails  # Default: 'thumbnails'
MIGRATION_BATCH_SIZE=5                # Default: 5
MIGRATION_RETRY_ATTEMPTS=3            # Default: 3
DELETE_AFTER_MIGRATION=false          # Default: false
DRY_RUN=true                          # Default: false
```

## Running the Migration

### 1. Dry Run (Recommended First)

Always start with a dry run to see what will be migrated:

```bash
DRY_RUN=true npx ts-node scripts/migrate-videos-to-supabase.ts
```

### 2. Actual Migration

After verifying the dry run results:

```bash
DRY_RUN=false npx ts-node scripts/migrate-videos-to-supabase.ts
```

### 3. Migration with Cleanup

To delete UploadThing files after successful migration:

```bash
DRY_RUN=false DELETE_AFTER_MIGRATION=true npx ts-node scripts/migrate-videos-to-supabase.ts
```

**⚠️ WARNING**: This will delete the original files from UploadThing. Make sure you have backups!

## Features

### Batch Processing
- Processes videos in configurable batches to avoid overwhelming the system
- Default batch size: 5 videos at a time

### Retry Logic
- Automatically retries failed migrations
- Configurable retry attempts (default: 3)
- Exponential backoff between retries

### Progress Tracking
- Real-time progress updates
- Detailed logging for each video
- Summary report at the end

### Safety Features
- **Dry Run Mode**: Test the migration without making changes
- **Verification**: Verifies each migration before marking as complete
- **Skip Already Migrated**: Automatically skips videos already using Supabase URLs
- **Rollback Support**: Original URLs preserved until verification

### Error Handling
- Comprehensive error logging
- Continues processing even if individual videos fail
- Detailed error report at the end

## Migration Process

1. **Fetch Videos**: Retrieves all videos with `uploadStatus: SUCCESS` from database
2. **Download**: Downloads video and thumbnail files from UploadThing
3. **Upload**: Uploads files to Supabase storage buckets
4. **Update Database**: Updates video records with new Supabase URLs
5. **Verify**: Confirms database updates were successful
6. **Cleanup** (Optional): Deletes original UploadThing files
7. **Report**: Generates detailed migration summary

## Output

### Console Output
- Real-time progress for each video
- Success/failure indicators
- Summary statistics

### JSON Report
- Saves detailed report to `migration-summary-[timestamp].json`
- Includes all migration results and errors

## Troubleshooting

### Common Issues

1. **"Missing required environment variables"**
   - Ensure all required variables are set in `.env`
   - Check for typos in variable names

2. **"Failed to download file"**
   - Check UploadThing URLs are still valid
   - Verify network connectivity
   - Increase timeout if needed

3. **"Failed to upload to Supabase"**
   - Verify Supabase credentials
   - Check bucket permissions
   - Ensure buckets exist

4. **"Database update verification failed"**
   - Check database connection
   - Verify Prisma schema is up to date
   - Run `npx prisma generate` if needed

### Recovery

If migration fails partway through:
1. Check the migration summary JSON file
2. Fix any configuration issues
3. Re-run the migration - it will skip already migrated videos
4. Failed videos will be retried

## Rollback

If you need to rollback:
1. The original URLs are preserved in the migration summary
2. You can write a reverse migration using the summary data
3. Ensure you haven't deleted UploadThing files yet

## Performance Considerations

- **Large Files**: Videos are downloaded to temp directory before upload
- **Memory**: Processes videos in batches to manage memory
- **Network**: Includes timeouts and retries for network issues
- **Storage**: Ensure sufficient disk space for temporary files

## Security Notes

- Uses Supabase service role key (keep secure!)
- Temporary files are cleaned up after processing
- Original files preserved unless explicitly deleted

## Support

For issues or questions:
1. Check the migration summary JSON for detailed errors
2. Review console output for specific failure reasons
3. Verify all prerequisites are met
4. Test with a single video first using batch size of 1