import { Loader2 } from "lucide-react";

const VideoPlaceholder = () => {
  return (
    <div className="w-full h-1/2 flex justify-center items-center">
      <Loader2 className="w-8 h-8 animate-spin" />
    </div>
  );
};

export default VideoPlaceholder;
