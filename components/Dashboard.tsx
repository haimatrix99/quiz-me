"use client";

import { trpc } from "@/app/_trpc/client";
import EmptyVideo from "./EmptyVideo";
import Heading from "./Heading";
import UploadButton from "./UploadButton";
import VideoThumbnail from "./VideoThumbnail";

const Dashboard = () => {
  const videos = trpc.getVideos.useQuery();

  const getLastSeen = (currentDate: Date, createdDate: Date) => {
    const differenceInMilliseconds =
      currentDate.getTime() - createdDate.getTime();
    const differenceInSeconds = Math.floor(differenceInMilliseconds / 1000);
    const differenceInMinutes = Math.floor(differenceInSeconds / 60);
    const differenceInHours = Math.floor(differenceInMinutes / 60);
    const differenceInDays = Math.floor(differenceInHours / 24);

    if (differenceInSeconds === 0) {
      return "Vừa tạo xong";
    }
    if (differenceInMinutes === 0) {
      return `${differenceInSeconds} giây trước`;
    }
    if (differenceInHours === 0) {
      return `${differenceInMinutes} phút trước`;
    }
    if (differenceInDays === 0) {
      return `${differenceInHours} giờ trước`;
    }
    return `${differenceInDays} ngày trước`;
  };

  return (
    <div className="mt-4">
      <div className="flex justify-between items-center">
        <Heading title="My Videos" />
        <UploadButton />
      </div>
      {videos.data && videos.data.length > 0 ? (
        <div className="mt-10 w-full grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {videos.data.map((video) => (
            <VideoThumbnail
              key={video.id}
              videoId={video.id}
              thumbnailUrl={video.thumbnailUrl!}
              title={video.name}
              viewCount={video.viewCount}
              lastSeen={getLastSeen(new Date(), new Date(video.createdAt))}
            />
          ))}
        </div>
      ) : (
        <EmptyVideo isSubscribed={false} />
      )}
    </div>
  );
};

export default Dashboard;
