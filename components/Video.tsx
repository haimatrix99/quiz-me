"use client";

import Link from "next/link";
import { Slash } from "lucide-react";

import Heading from "./Heading";
import Quiz from "./Quiz";
import VideoPlayer from "./VideoPlayer";

const Video = ({
  videoId,
  videoUrl,
  videoName,
}: {
  videoId: string;
  videoUrl: string;
  videoName: string;
}) => {
  return (
    <div className="mt-4 w-full">
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="underline underline-offset-2">
          <Heading title="My Videos" />
        </Link>
        <Slash />
        <Heading title={videoName} />
      </div>
      <div className="flex flex-col md:flex-row justify-between mt-4 gap-4">
        <VideoPlayer videoUrl={videoUrl} />
        <Quiz videoId={videoId} />
      </div>
    </div>
  );
};

export default Video;
