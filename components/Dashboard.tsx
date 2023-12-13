"use client";

import EmptyVideo from "./EmptyVideo";
import Heading from "./Heading";
import UploadButton from "./UploadButton";
import VideoThumbnail from "./VideoThumbnail";
import { trpc } from "@/app/_trpc/client";

const Dashboard = () => {
  const videos = trpc.getVideos.useQuery();

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
              thumbnailUrl={video.thumbnailUrl}
              title={video.name}
              viewCount={video.viewCount}
              lastSeen="2"
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
