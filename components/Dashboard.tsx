"use client";

import EmptyVideo from "./EmptyVideo";
import Heading from "./Heading";
import UploadButton from "./UploadButton";
import VideoThumbnail from "./VideoThumbnail";

const Dashboard = () => {
  return (
    <div className="mt-4">
      <div className="flex justify-between items-center">
        <Heading title="My Videos" />
        <UploadButton />
      </div>
      {/* <EmptyVideo /> */}
      <div className="mt-10 w-full grid grid-cols-2 md:grid-cols-4 gap-4">
        <VideoThumbnail
          videoId="1"
          thumbnailUrl="https://placehold.in/300x200/dark"
          title="Test"
          viewCount={10}
          lastSeen="2"
        />
      </div>
    </div>
  );
};

export default Dashboard;
