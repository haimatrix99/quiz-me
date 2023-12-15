import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Loader2, Trash } from "lucide-react";

import { trpc } from "@/app/_trpc/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface VideoThumbnailProps {
  videoId: string;
  thumbnailUrl: string;
  title: string;
  viewCount: number;
  lastSeen: string;
}

const VideoThumbnail = ({
  videoId,
  thumbnailUrl,
  title,
  viewCount,
  lastSeen,
}: VideoThumbnailProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const utils = trpc.useContext();
  const { mutate: deleteVideo } = trpc.deleteVideo.useMutation({
    onMutate: () => {
      setIsLoading(true);
    },
    onSuccess: () => {
      setIsLoading(false);
      utils.getVideos.invalidate();
    },
    retry: true,
    retryDelay: 500,
  });

  return (
    <div className="relative my-2 flex flex-col items-center gap-2">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <div className="cursor-pointer p-2 absolute -top-3 -right-1 md:-top-3 md:-right-3 rounded-full border-2 border-slate-300 bg-white">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash className="h-4 w-4" />
            )}
          </div>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              account and remove your data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                deleteVideo({ id: videoId });
              }}
            >
              Yes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Link href={`/dashboard/${videoId}`}>
        <Image
          src={thumbnailUrl}
          width={300}
          height={200}
          alt=""
          priority={true}
          quality={90}
          className="border border-gray-300 shadow-sm"
        />
        <div className="mt-2 w-full flex flex-col justify-start items-start">
          <div className="text-[14px] font-semibold">{title}</div>
          <div className="text-[13px] text-muted-foreground">
            {viewCount} lượt xem ● {lastSeen}
          </div>
        </div>
      </Link>
    </div>
  );
};

export default VideoThumbnail;
