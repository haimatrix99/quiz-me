"use client";

import Link from "next/link";
import { Slash } from "lucide-react";

import Heading from "./Heading";
import Quiz from "./Quiz";

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
      <div className="flex justify-between items-center mt-4">
        <video autoPlay loop className="w-[500px] h-[500px]">
          <source src={videoUrl} />
        </video>
        <Quiz />
      </div>
    </div>
  );
};

export default Video;
