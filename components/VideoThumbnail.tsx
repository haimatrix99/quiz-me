import Image from "next/image";
import Link from "next/link";

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
  return (
    <div className="my-2 flex flex-col items-center gap-2">
      <Link href={`/dashboard/${videoId}`}>
        <Image
          src={thumbnailUrl}
          width={300}
          height={200}
          alt=""
          priority={true}
          quality={90}
        />
        <div className="mt-2 w-full flex flex-col justify-start items-start">
          <div className="text-normal font-semibold">{title}</div>
          <div className="text-sm text-muted-foreground">
            {viewCount} lượt xem ● {lastSeen} ngày trước
          </div>
        </div>
      </Link>
    </div>
  );
};

export default VideoThumbnail;
