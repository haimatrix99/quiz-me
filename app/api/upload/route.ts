import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs';
import { db } from '@/lib/db';
import { deepgram } from '@/lib/deepgram';
import { generateThumbnail } from '@/lib/generateThumbnail';
import { chain } from '@/lib/openai';
import { Quiz } from '@/lib/types';
import { getUserSubscriptionPlan } from '@/lib/stripe';
import { PLANS } from '@/config/stripe';
import { storageApi } from '@/lib/supabase-storage';
import { MAX_FILE_SIZES } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();

    if (!user || !user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subscriptionPlan = await getUserSubscriptionPlan();
    const { isSubscribed } = subscriptionPlan;

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Check file size based on subscription
    const maxSize = isSubscribed ? MAX_FILE_SIZES.pro : MAX_FILE_SIZES.free;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File size exceeds limit of ${isSubscribed ? '256MB' : '32MB'}` },
        { status: 400 }
      );
    }

    // Check file type
    if (!file.type.startsWith('video/')) {
      return NextResponse.json(
        { error: 'Only video files are allowed' },
        { status: 400 }
      );
    }

    // Check quota
    const currentVideos = await db.video.findMany({
      where: {
        userId: user.id,
      },
    });

    const proQuota = PLANS.find((plan) => plan.name === 'Pro')!.quota;
    const freeQuota = PLANS.find((plan) => plan.name === 'Free')!.quota;

    if (
      (isSubscribed && currentVideos.length >= proQuota) ||
      (!isSubscribed && currentVideos.length >= freeQuota)
    ) {
      return NextResponse.json(
        { error: 'Video quota exceeded' },
        { status: 403 }
      );
    }

    // Upload video to Supabase
    const videoBuffer = Buffer.from(await file.arrayBuffer());
    const uploadResult = await storageApi.uploadFile(
      videoBuffer,
      file.name,
      'videos',
      user.id
    );

    if (!uploadResult) {
      return NextResponse.json(
        { error: 'Failed to upload video' },
        { status: 500 }
      );
    }

    // Create database entry
    const createdVideo = await db.video.create({
      data: {
        key: uploadResult.key,
        name: file.name,
        userId: user.id,
        url: uploadResult.url,
        uploadStatus: 'PROCESSING',
        processStatus: 'PENDING',
      },
    });

    // Start async processing
    processVideo(createdVideo.id, uploadResult.url, file.name, user.id);

    return NextResponse.json({
      success: true,
      video: {
        id: createdVideo.id,
        key: uploadResult.key,
        url: uploadResult.url,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process upload' },
      { status: 500 }
    );
  }
}

async function processVideo(
  videoId: string,
  videoUrl: string,
  fileName: string,
  userId: string
) {
  try {
    // Generate thumbnail
    const { url: thumbnailUrl, key: thumbnailKey } = await generateThumbnail(
      videoUrl,
      fileName.split('.')[0],
      userId
    );

    if (!thumbnailUrl || !thumbnailKey) {
      await db.video.update({
        data: {
          uploadStatus: 'FAILED',
        },
        where: {
          id: videoId,
        },
      });
      return;
    }

    // Update video with thumbnail
    await db.video.update({
      data: {
        thumbnailKey,
        thumbnailUrl,
        uploadStatus: 'SUCCESS',
      },
      where: {
        id: videoId,
      },
    });

    // Start transcription
    await db.video.update({
      data: {
        processStatus: 'PROCESSING',
      },
      where: {
        id: videoId,
      },
    });

    const { result, error } = await deepgram.listen.prerecorded.transcribeUrl(
      {
        url: videoUrl,
      },
      {
        smart_format: true,
        model: 'nova-2',
      }
    );

    if (error) {
      await db.video.update({
        data: {
          processStatus: 'FAILED',
        },
        where: {
          id: videoId,
        },
      });
      throw error;
    }

    const transcript = result.results.channels[0].alternatives[0].transcript;

    if (!transcript) {
      await db.video.update({
        data: {
          processStatus: 'FAILED',
        },
        where: {
          id: videoId,
        },
      });
      throw new Error('Video cannot be transcribed');
    }

    // Generate quiz questions
    const output = await chain.invoke({
      transcript,
    });

    const outputJson: { questions: Quiz[] } = JSON.parse(
      output.content.toString().trim()
    );

    // Create quiz questions
    await Promise.all(
      outputJson.questions.map(async (question: Quiz) => {
        await db.quiz.create({
          data: {
            videoId,
            question: question.question,
            answerA: question.answers[0].split('. ')[1],
            answerB: question.answers[1].split('. ')[1],
            answerC: question.answers[2].split('. ')[1],
            answerD: question.answers[3].split('. ')[1],
            correctAnswer: question.correct_answer.split('. ')[1],
          },
        });
      })
    );

    // Update video as successfully processed
    await db.video.update({
      data: {
        transcript,
        processStatus: 'SUCCESS',
      },
      where: {
        id: videoId,
      },
    });
  } catch (error) {
    console.error('Video processing error:', error);
    await db.video.update({
      data: {
        processStatus: 'FAILED',
      },
      where: {
        id: videoId,
      },
    });
  }
}