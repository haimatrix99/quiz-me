import fs from "fs";
import ffmpeg from "fluent-ffmpeg";

import { storageApi } from "@/lib/supabase-storage";

function ffmpegSync(videoUrl: string, videoName: string) {
  return new Promise((resolve, reject) => {
    ffmpeg(videoUrl)
      .screenshots({
        count: 1,
        folder: ".",
        filename: `${videoName}.png`,
        size: "300x200",
        timestamps: ["00:00:01"],
      })
      .on("end", () => {
        resolve("success");
      })
      .on("error", (err) => {
        return reject(new Error(err));
      });
  });
}

export async function generateThumbnail(videoUrl: string, videoName: string, userId: string) {
  await ffmpegSync(videoUrl, videoName);
  const imageBuffer = fs.readFileSync(`${videoName}.png`);
  
  const response = await storageApi.uploadFiles(
    imageBuffer,
    `thumbnail_${videoName}.png`,
    'thumbnails',
    userId
  );
  
  if (response.data) {
    fs.unlink(`${videoName}.png`, (err) => {
      if (err) console.log(err);
    });
    return { url: response.data.url, key: response.data.key };
  }
  return { url: "", key: "" };
}
