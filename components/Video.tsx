import Link from "next/link";
import { Slash } from "lucide-react";

import Heading from "./Heading";

const Video = ({ videoName }: { videoName: string }) => {
  return (
    <div className="mt-4">
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="underline underline-offset-2">
          <Heading title="My Videos" />
        </Link>
        <Slash />
        <Heading title={videoName} />
      </div>
    </div>
  );
};

export default Video;
