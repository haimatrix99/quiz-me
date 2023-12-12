import Video from "@/components/Video";
import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";

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

  // if (!video) notFound();

  return <Video videoName={videoId} />;
};

export default Page;
