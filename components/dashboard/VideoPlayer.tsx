"use client";

import { PauseCircle, RotateCw } from "lucide-react";
import { useEffect, useState } from "react";
import ReactPlayer from "react-player/lazy";
import VideoPlaceholder from "./VideoPlaceholder";
import VideoNav from "./VideoNav";

const VideoPlayer = ({ videoUrl }: { videoUrl: string }) => {
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [ended, setEnded] = useState(false);

  useEffect(() => {
    const keyDownHandler = (event: any) => {
      if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        setPlaying(!playing);
      }
    };

    document.addEventListener("keydown", keyDownHandler);

    return () => {
      document.removeEventListener("keydown", keyDownHandler);
    };
  }, [playing]);

  const onEnded = () => {
    setEnded(true);
  };
  return (
    <div className="border rounded-lg p-2 h-full w-full">
      <div
        onClick={() => setPlaying(!playing)}
        className="relative w-full h-full"
      >
        {!playing && !ended && (
          <PauseCircle className="w-10 h-10 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        )}
        {ended && (
          <RotateCw className="w-10 h-10 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        )}
        <ReactPlayer
          url={videoUrl}
          width="100%"
          height="50%"
          playing={playing}
          playbackRate={playbackRate}
          muted={muted}
          fallback={<VideoPlaceholder />}
          onEnded={onEnded}
        />
      </div>
      <VideoNav
        muted={muted}
        playbackRate={playbackRate}
        onChangePlaybackRate={setPlaybackRate}
        onClickMute={() => setMuted(!muted)}
        onClickPlay={() => {setPlaying(true); setEnded(false)}}
        onClickPause={() => setPlaying(false)}
      />
    </div>
  );
};

export default VideoPlayer;
