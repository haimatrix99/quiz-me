"use client";

import { Volume2, VolumeX, Play, Pause } from "lucide-react";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

const VideoNav = ({
  muted,
  playbackRate,
  onClickPause,
  onChangePlaybackRate,
  onClickPlay,
  onClickMute,
}: {
  muted: boolean;
  playbackRate: number;
  onChangePlaybackRate: (rate: number) => void;
  onClickPause: () => void;
  onClickPlay: () => void;
  onClickMute: () => void;
}) => {
  return (
    <div className="flex justify-between items-center my-1">
      <div className="flex items-center">
        <Button variant="ghost" onClick={onClickPause}>
          <Pause />
        </Button>
        <Button variant="ghost" onClick={onClickPlay}>
          <Play />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="focus-visible:ring-transparent text-[16px]"
            >
              {playbackRate}x
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuCheckboxItem
              checked={`${playbackRate}x` === "0.5x"}
              onClick={() => onChangePlaybackRate(0.5)}
            >
              0.5x
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={`${playbackRate}x` === "0.75x"}
              onClick={() => onChangePlaybackRate(0.75)}
            >
              0.75x
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={`${playbackRate}x` === "1x"}
              onClick={() => onChangePlaybackRate(1)}
            >
              1x
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={`${playbackRate}x` === "1.25x"}
              onClick={() => onChangePlaybackRate(1.25)}
            >
              1.25x
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={`${playbackRate}x` === "1.5x"}
              onClick={() => onChangePlaybackRate(1.5)}
            >
              1.5x
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={`${playbackRate}x` === "1.75x"}
              onClick={() => onChangePlaybackRate(1.75)}
            >
              1.75x
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={`${playbackRate}x` === "2x"}
              onClick={() => onChangePlaybackRate(2)}
            >
              2x
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Button variant="ghost" onClick={onClickMute}>
        {!muted ? <Volume2 /> : <VolumeX />}
      </Button>
    </div>
  );
};

export default VideoNav;
