import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs";
import { createUploadthing, type FileRouter } from "uploadthing/next";

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
      viewCount: 0,
      url: `https://uploadthing-prod.s3.us-west-2.amazonaws.com/${file.key}`,
      thumbnailUrl: `https://uploadthing-prod.s3.us-west-2.amazonaws.com/thumbnails/${file.key}`,
      uploadStatus: "PROCESSING",
      processStatus: "PENDING",
    },
  });
};

export const ourFileRouter = {
  freePlanUploader: f({ video: { maxFileSize: "4MB" } })
    .middleware(middleware)
    .onUploadComplete(onUploadComplete),
  proPlanUploader: f({ video: { maxFileSize: "16MB" } })
    .middleware(middleware)
    .onUploadComplete(onUploadComplete),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
