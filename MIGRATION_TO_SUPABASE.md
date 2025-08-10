# Migration from UploadThing to Supabase Storage - Complete Guide

## Overview
This project has been fully migrated from UploadThing to Supabase Storage for video and thumbnail hosting. This guide documents the changes made and setup required.

## What Changed

### 1. Storage Provider
- **Before**: UploadThing (third-party service)
- **After**: Supabase Storage (self-hosted/managed)

### 2. File Structure Changes

#### Removed Files
- `/lib/uploadthing.ts` - UploadThing React helpers
- `/lib/utapi.ts` - UploadThing server API
- `/app/api/uploadthing/core.ts` - UploadThing file router
- `/app/api/uploadthing/route.ts` - UploadThing API route

#### New Files
- `/lib/supabase.ts` - Supabase client configuration
- `/lib/supabase-storage.ts` - Storage utility functions
- `/lib/supabase-upload.ts` - React upload hooks
- `/app/api/upload/route.ts` - New upload API endpoint

#### Modified Files
- `/lib/generateThumbnail.ts` - Updated to use Supabase storage
- `/components/dashboard/UploadButton.tsx` - Updated to use new upload hook
- `/trpc/index.ts` - Updated delete operations for Supabase
- `/middleware.ts` - Updated API routes
- `/package.json` - Removed UploadThing dependencies

## Setup Instructions

### 1. Supabase Project Setup

1. Create a Supabase project at https://supabase.com
2. Go to Storage section in your dashboard
3. Create two public buckets:
   - `videos` - for video files
   - `thumbnails` - for thumbnail images

### 2. Bucket Configuration

For each bucket:
1. Click on the bucket name
2. Go to "Policies" tab
3. Create a new policy with:
   - **Name**: Public Access
   - **Policy**: Allow all operations (or customize as needed)
   - **Target roles**: Authenticated and Anonymous

Example RLS policy for public read access:
```sql
-- Allow public read access
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id IN ('videos', 'thumbnails'));

-- Allow authenticated users to upload
CREATE POLICY "Authenticated Upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id IN ('videos', 'thumbnails') AND
  auth.role() = 'authenticated'
);

-- Allow users to delete their own files
CREATE POLICY "User Delete Own" ON storage.objects
FOR DELETE USING (
  bucket_id IN ('videos', 'thumbnails') AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

### 3. Environment Variables

Update your `.env.local` file with:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key

# Remove these UploadThing variables
# UPLOADTHING_SECRET=
# UPLOADTHING_APP_ID=
```

### 4. Database Migration

If you have existing videos in UploadThing:

1. Run the migration validation:
```bash
npm run migrate:validate
```

2. Run a dry-run migration:
```bash
npm run migrate:videos:dry
```

3. Execute the actual migration:
```bash
npm run migrate:videos
```

4. (Optional) Clean up old UploadThing files:
```bash
npm run migrate:videos:cleanup
```

## API Changes

### Upload Endpoint
- **Before**: `/api/uploadthing`
- **After**: `/api/upload`

### Upload Response Format
```typescript
// Before (UploadThing)
{
  key: string;
  url: string;
}

// After (Supabase)
{
  success: boolean;
  video: {
    id: string;
    key: string;
    url: string;
  }
}
```

## Frontend Changes

### Upload Hook
```typescript
// Before
import { useUploadThing } from "@/lib/uploadthing";
const { startUpload } = useUploadThing("freePlanUploader");

// After
import { useUploadThing } from "@/lib/supabase-upload";
const { startUpload } = useUploadThing(isSubscribed);
```

## Storage Structure

### Supabase Storage Path Format
```
videos/
  └── {userId}/
      └── {fileName}_{timestamp}.{ext}

thumbnails/
  └── {userId}/
      └── thumbnail_{fileName}_{timestamp}.png
```

## Features Comparison

| Feature | UploadThing | Supabase Storage |
|---------|-------------|------------------|
| File Size Limits | ✅ Built-in | ✅ Custom implementation |
| Direct URL Access | ✅ | ✅ |
| File Deletion | ✅ | ✅ |
| Progress Tracking | ✅ | ✅ Simulated |
| Cost | Pay per use | Included in Supabase plan |
| Data Ownership | Third-party | Self-hosted |
| CDN | ✅ Global CDN | ✅ Via Supabase CDN |

## Benefits of Migration

1. **Cost Efficiency**: Storage included in Supabase plan
2. **Data Sovereignty**: Full control over your data
3. **Unified Stack**: Single provider for database and storage
4. **Flexibility**: Custom storage rules and policies
5. **Performance**: Direct integration with your database

## Troubleshooting

### Common Issues

1. **Upload fails with 401 Unauthorized**
   - Check your Supabase keys in environment variables
   - Ensure bucket policies allow uploads

2. **Videos not playing**
   - Verify bucket is set to public
   - Check CORS settings in Supabase dashboard

3. **Thumbnails not generating**
   - Ensure ffmpeg is installed and accessible
   - Check write permissions in the temp directory

4. **Migration script fails**
   - Verify all environment variables are set
   - Check network connectivity to both services
   - Review migration logs for specific errors

### Rollback Plan

If you need to rollback to UploadThing:

1. Restore the removed files from git history
2. Re-add UploadThing dependencies:
   ```bash
   npm install uploadthing @uploadthing/react
   ```
3. Restore environment variables
4. Revert the changed files

## Performance Considerations

- **Upload Speed**: Depends on user's connection to Supabase region
- **Storage Limits**: Check your Supabase plan limits
- **Bandwidth**: Monitor usage in Supabase dashboard
- **File Processing**: Thumbnail generation happens server-side

## Security Notes

- Service role key should only be used server-side
- Implement proper RLS policies for production
- Consider adding virus scanning for uploaded files
- Monitor storage usage to prevent abuse

## Future Enhancements

1. Add resumable uploads for large files
2. Implement client-side video compression
3. Add support for multiple video formats
4. Implement automatic quality variants
5. Add CDN caching strategies

## Support

For issues related to:
- **Supabase Storage**: https://supabase.com/docs/guides/storage
- **Migration Script**: Check `/scripts/README-MIGRATION.md`
- **Application Issues**: Review error logs and this guide