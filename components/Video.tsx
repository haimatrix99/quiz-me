"use client";

import Link from "next/link";
import { Slash } from "lucide-react";

import Heading from "./Heading";
import Quiz from "./Quiz";
import ReactPlayer from "react-player/lazy";

const Video = ({
  videoUrl,
  videoName,
}: {
  videoUrl: string;
  videoName: string;
}) => {

  return (
    <div className="mt-4 w-full h-full">
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="underline underline-offset-2">
          <Heading title="My Videos" />
        </Link>
        <Slash />
        <Heading title={videoName} />
      </div>
      <div className="flex flex-col md:flex-row justify-between items-center mt-4 gap-4">
        <ReactPlayer
          url={videoUrl}
          playing={true}
          loop={true}
          width="100%"
          height="50%"
        />
        <Quiz />
      </div>
    </div>
  );
};

export default Video;
