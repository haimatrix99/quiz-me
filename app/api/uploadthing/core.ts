import { currentUser } from "@clerk/nextjs";
import { createUploadthing, type FileRouter } from "uploadthing/next";

import { db } from "@/lib/db";
import { deepgram } from "@/lib/deepgram";
import { generateThumbnail } from "@/lib/generateThumbnail";
import { chain } from "@/lib/openai";
import { Quiz } from "@/lib/types";

const f = createUploadthing();

const middleware = async () => {
  const user = await currentUser();

  if (!user || !user.id) throw new Error("Unauthorized");

  return { userId: user.id };
};

const onUploadComplete = async ({
  metadata,
  file,
}: {
  metadata: Awaited<ReturnType<typeof middleware>>;
  file: {
    key: string;
    name: string;
    url: string;
  };
}) => {
  const isFileExist = await db.video.findFirst({
    where: {
      key: file.key,
    },
  });

  if (isFileExist) return;

  const createdVideo = await db.video.create({
    data: {
      key: file.key,
      name: file.name,
      userId: metadata.userId,
      url: `https://uploadthing-prod.s3.us-west-2.amazonaws.com/${file.key}`,
      uploadStatus: "PROCESSING",
      processStatus: "PENDING",
    },
  });

  try {
    const { url, key } = await generateThumbnail(
      `https://uploadthing-prod.s3.us-west-2.amazonaws.com/${file.key}`,
      file.name.split(".")[0]
    );

    if (url === "" || key === "") {
      throw "Failed when generate thumbnail";
    }

    await db.video.update({
      data: {
        thumbnailKey: key,
        thumbnailUrl: url,
      },
      where: {
        id: createdVideo.id,
      },
    });

    await db.video.update({
      data: {
        uploadStatus: "SUCCESS",
      },
      where: {
        id: createdVideo.id,
      },
    });

    const { result, error } = await deepgram.listen.prerecorded.transcribeUrl(
      {
        url: createdVideo.url,
      },
      {
        smart_format: true,
        model: "nova-2",
      }
    );

    await db.video.update({
      data: {
        processStatus: "PROCESSING",
      },
      where: {
        id: createdVideo.id,
      },
    });

    if (error) {
      await db.video.update({
        data: {
          processStatus: "FAILED",
        },
        where: {
          id: createdVideo.id,
        },
      });
    }

    if (!error) {
      const output = await chain.invoke({
        transcript: result.results.channels[0].alternatives[0].transcript,
      });

      const outputJson: { questions: Quiz[] } = JSON.parse(
        output.content.toString().trim()
      );

      outputJson.questions.map(async (question: Quiz) => {
        await db.quiz.create({
          data: {
            videoId: createdVideo.id,
            question: question.question,
            answerA: question.answers[0].split(". ")[1],
            answerB: question.answers[1].split(". ")[1],
            answerC: question.answers[2].split(". ")[1],
            answerD: question.answers[3].split(". ")[1],
            correctAnswer: question.correct_answer.split(". ")[1],
          },
        });
      });

      await db.video.update({
        data: {
          transcript: result.results.channels[0].alternatives[0].transcript,
          processStatus: "SUCCESS",
        },
        where: {
          id: createdVideo.id,
        },
      });
    }
  } catch (err) {
    await db.video.update({
      data: {
        uploadStatus: "FAILED",
        processStatus: "FAILED",
      },
      where: {
        id: createdVideo.id,
      },
    });
  }
};

export const ourFileRouter = {
  freePlanUploader: f({ video: { maxFileSize: "128MB" } })
    .middleware(middleware)
    .onUploadComplete(onUploadComplete),
  proPlanUploader: f({ video: { maxFileSize: "1024MB" } })
    .middleware(middleware)
    .onUploadComplete(onUploadComplete),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
