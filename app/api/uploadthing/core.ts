import { db } from "@/lib/db";
import { generateThumbnail } from "@/lib/generateThumbnail";
import { currentUser } from "@clerk/nextjs";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UTApi } from "uploadthing/server";

const f = createUploadthing();

export const utapi = new UTApi();

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

  const url = await generateThumbnail(
    `https://uploadthing-prod.s3.us-west-2.amazonaws.com/${file.key}`,
    file.name.split(".")[0]
  );

  const createdVideo = await db.video.create({
    data: {
      key: file.key,
      name: file.name,
      userId: metadata.userId,
      viewCount: 0,
      url: `https://uploadthing-prod.s3.us-west-2.amazonaws.com/${file.key}`,
      thumbnailUrl: url,
      uploadStatus: "PROCESSING",
      processStatus: "PENDING",
    },
  });
  try {
    await db.video.update({
      data: {
        uploadStatus: "SUCCESS",
      },
      where: {
        id: createdVideo.id,
      },
    });
  } catch (err) {
    await db.video.update({
      data: {
        uploadStatus: "FAILED",
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
