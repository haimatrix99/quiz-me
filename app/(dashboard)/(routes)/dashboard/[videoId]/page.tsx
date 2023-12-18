import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs";
import { notFound, redirect } from "next/navigation";

import Video from "@/components/Video";

interface PageProps {
  params: {
    videoId: string;
  };
}

const Page = async ({ params }: PageProps) => {
  const { videoId } = params;

  const user = await currentUser();
  if (!user || !user.id) redirect(`/auth-callback?origin=dashboard/${videoId}`);

  const video = await db.video.findFirst({
    where: {
      id: videoId,
      userId: user.id,
    },
  });

  if (!video) notFound();

  await db.video.update({
    data: {
      viewCount: video.viewCount + 1,
    },
    where: {
      id: video.id,
    },
  });

  return (
    <Video videoId={video.id} videoUrl={video.url} videoName={video.name} />
  );
};

export default Page;
