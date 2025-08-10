import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

async function validateSupabaseSetup() {
  console.log('Validating Supabase Setup for Video Migration\n');
  console.log('='.repeat(50));

  const errors: string[] = [];
  const warnings: string[] = [];

  // Check environment variables
  console.log('\n1. Checking Environment Variables...');
  
  const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY'];
  const optionalEnvVars = [
    'SUPABASE_VIDEO_BUCKET',
    'SUPABASE_THUMBNAIL_BUCKET',
    'MIGRATION_BATCH_SIZE',
    'MIGRATION_RETRY_ATTEMPTS',
  ];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      errors.push(`Missing required environment variable: ${envVar}`);
      console.log(`   ❌ ${envVar}: Not set`);
    } else {
      console.log(`   ✅ ${envVar}: Set`);
    }
  }

  for (const envVar of optionalEnvVars) {
    if (!process.env[envVar]) {
      console.log(`   ⚠️  ${envVar}: Not set (will use default)`);
    } else {
      console.log(`   ✅ ${envVar}: ${process.env[envVar]}`);
    }
  }

  if (errors.length > 0) {
    console.log('\n❌ Validation Failed!');
    console.log('\nErrors:');
    errors.forEach(error => console.log(`  - ${error}`));
    console.log('\nPlease set the required environment variables in your .env file');
    process.exit(1);
  }

  // Initialize Supabase client
  console.log('\n2. Connecting to Supabase...');
  
  let supabase;
  try {
    supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );
    console.log('   ✅ Successfully connected to Supabase');
  } catch (error) {
    console.log('   ❌ Failed to connect to Supabase');
    console.error(`   Error: ${error}`);
    process.exit(1);
  }

  // Check storage buckets
  console.log('\n3. Checking Storage Buckets...');
  
  const videoBucket = process.env.SUPABASE_VIDEO_BUCKET || 'videos';
  const thumbnailBucket = process.env.SUPABASE_THUMBNAIL_BUCKET || 'thumbnails';

  // Check video bucket
  try {
    const { data: videoBucketData, error: videoBucketError } = await supabase.storage.getBucket(videoBucket);
    
    if (videoBucketError) {
      if (videoBucketError.message.includes('not found')) {
        errors.push(`Video bucket '${videoBucket}' does not exist. Please create it in Supabase Dashboard.`);
        console.log(`   ❌ Video bucket '${videoBucket}': Not found`);
      } else {
        errors.push(`Error checking video bucket: ${videoBucketError.message}`);
        console.log(`   ❌ Video bucket '${videoBucket}': Error - ${videoBucketError.message}`);
      }
    } else {
      console.log(`   ✅ Video bucket '${videoBucket}': Found`);
      if (videoBucketData.public) {
        console.log(`      - Public: Yes (URLs will be publicly accessible)`);
      } else {
        console.log(`      - Public: No (URLs will require authentication)`);
        warnings.push(`Video bucket is private. Consider making it public for direct URL access.`);
      }
    }
  } catch (error) {
    errors.push(`Failed to check video bucket: ${error}`);
    console.log(`   ❌ Video bucket '${videoBucket}': Error - ${error}`);
  }

  // Check thumbnail bucket
  try {
    const { data: thumbnailBucketData, error: thumbnailBucketError } = await supabase.storage.getBucket(thumbnailBucket);
    
    if (thumbnailBucketError) {
      if (thumbnailBucketError.message.includes('not found')) {
        errors.push(`Thumbnail bucket '${thumbnailBucket}' does not exist. Please create it in Supabase Dashboard.`);
        console.log(`   ❌ Thumbnail bucket '${thumbnailBucket}': Not found`);
      } else {
        errors.push(`Error checking thumbnail bucket: ${thumbnailBucketError.message}`);
        console.log(`   ❌ Thumbnail bucket '${thumbnailBucket}': Error - ${thumbnailBucketError.message}`);
      }
    } else {
      console.log(`   ✅ Thumbnail bucket '${thumbnailBucket}': Found`);
      if (thumbnailBucketData.public) {
        console.log(`      - Public: Yes (URLs will be publicly accessible)`);
      } else {
        console.log(`      - Public: No (URLs will require authentication)`);
        warnings.push(`Thumbnail bucket is private. Consider making it public for direct URL access.`);
      }
    }
  } catch (error) {
    errors.push(`Failed to check thumbnail bucket: ${error}`);
    console.log(`   ❌ Thumbnail bucket '${thumbnailBucket}': Error - ${error}`);
  }

  // Test upload permissions
  console.log('\n4. Testing Upload Permissions...');
  
  const testFileName = `test-upload-${Date.now()}.txt`;
  const testContent = 'This is a test file for migration validation';

  // Test video bucket upload
  try {
    const { error: uploadError } = await supabase.storage
      .from(videoBucket)
      .upload(testFileName, testContent, {
        contentType: 'text/plain',
      });

    if (uploadError) {
      errors.push(`Cannot upload to video bucket: ${uploadError.message}`);
      console.log(`   ❌ Video bucket upload: Failed - ${uploadError.message}`);
    } else {
      console.log(`   ✅ Video bucket upload: Success`);
      
      // Clean up test file
      await supabase.storage.from(videoBucket).remove([testFileName]);
    }
  } catch (error) {
    errors.push(`Failed to test video bucket upload: ${error}`);
    console.log(`   ❌ Video bucket upload: Error - ${error}`);
  }

  // Test thumbnail bucket upload
  try {
    const { error: uploadError } = await supabase.storage
      .from(thumbnailBucket)
      .upload(testFileName, testContent, {
        contentType: 'text/plain',
      });

    if (uploadError) {
      errors.push(`Cannot upload to thumbnail bucket: ${uploadError.message}`);
      console.log(`   ❌ Thumbnail bucket upload: Failed - ${uploadError.message}`);
    } else {
      console.log(`   ✅ Thumbnail bucket upload: Success`);
      
      // Clean up test file
      await supabase.storage.from(thumbnailBucket).remove([testFileName]);
    }
  } catch (error) {
    errors.push(`Failed to test thumbnail bucket upload: ${error}`);
    console.log(`   ❌ Thumbnail bucket upload: Error - ${error}`);
  }

  // Check database connection
  console.log('\n5. Checking Database Connection...');
  
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const videoCount = await prisma.video.count();
    console.log(`   ✅ Database connected: Found ${videoCount} videos`);
    
    const pendingVideos = await prisma.video.count({
      where: {
        uploadStatus: 'SUCCESS',
        url: {
          contains: 'uploadthing',
        },
      },
    });
    
    if (pendingVideos > 0) {
      console.log(`   📊 Videos to migrate: ${pendingVideos}`);
    } else {
      console.log(`   📊 No videos found that need migration`);
    }
    
    await prisma.$disconnect();
  } catch (error) {
    warnings.push(`Could not check database: ${error}`);
    console.log(`   ⚠️  Database check: ${error}`);
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('VALIDATION SUMMARY');
  console.log('='.repeat(50));

  if (errors.length > 0) {
    console.log('\n❌ Validation Failed!\n');
    console.log('Errors that must be fixed:');
    errors.forEach(error => console.log(`  - ${error}`));
  } else {
    console.log('\n✅ Validation Passed!\n');
    console.log('Your Supabase setup is ready for migration.');
  }

  if (warnings.length > 0) {
    console.log('\n⚠️  Warnings (optional to fix):');
    warnings.forEach(warning => console.log(`  - ${warning}`));
  }

  if (errors.length === 0) {
    console.log('\n📝 Next Steps:');
    console.log('1. Run a dry migration: npm run migrate:videos:dry');
    console.log('2. Review the output and migration summary');
    console.log('3. Run actual migration: npm run migrate:videos');
    console.log('4. (Optional) Clean up old files: npm run migrate:videos:cleanup');
  }

  process.exit(errors.length > 0 ? 1 : 0);
}

validateSupabaseSetup().catch(console.error);