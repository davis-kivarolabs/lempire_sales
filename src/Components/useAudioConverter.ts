import { useState, useRef } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";

export function useAudioConverter() {
  const ffmpegRef = useRef(new FFmpeg());
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  console.log("sucess 1", ffmpegRef, loading, progress)

  const loadFFmpeg = async () => {
    if (!ffmpegRef.current.loaded) {
      await ffmpegRef.current.load({
        coreURL: "https://unpkg.com/@ffmpeg/core@0.12.6/dist/ffmpeg-core.js",
      });
    }
  };

  const convertWebmToMp3 = async (webmBlob: Blob): Promise<Blob> => {
    setLoading(true);
    setProgress(0);

    await loadFFmpeg();

    ffmpegRef.current.on("progress", ({ progress }) => {
      setProgress(Math.round(progress * 100));
    });

    await ffmpegRef.current.writeFile("input.webm", await fetchFile(webmBlob));

    await ffmpegRef.current.exec([
      "-i",
      "input.webm",
      "-vn",
      "-ar",
      "44100",
      "-ac",
      "2",
      "-b:a",
      "128k",
      "output.mp3",
    ]);

    // const data = await ffmpegRef.current.readFile("output.mp3");

    setLoading(false);

    return new Blob([""], { type: "audio/mpeg" });
  };

  return {
    convertWebmToMp3,
    loading,
    progress,
  };
}
// import { useState, useRef } from "react";
// import { FFmpeg } from "@ffmpeg/ffmpeg";
// import { fetchFile } from "@ffmpeg/util";

// export function useAudioConverter() {
//   const ffmpegRef = useRef(new FFmpeg());
//   const [loading, setLoading] = useState(false);
//   const [progress, setProgress] = useState(0);

//   console.log("sucess 1", ffmpegRef, loading, progress)

//   const loadFFmpeg = async () => {
//     if (!ffmpegRef.current.loaded) {
//       await ffmpegRef.current.load({
//         coreURL: "https://unpkg.com/@ffmpeg/core@0.12.6/dist/ffmpeg-core.js",
//       });
//     }
//   };

//   const convertWebmToMp3 = async (webmBlob: Blob): Promise<Blob> => {
//     setLoading(true);
//     setProgress(0);

//     await loadFFmpeg();

//     ffmpegRef.current.on("progress", ({ progress }) => {
//       setProgress(Math.round(progress * 100));
//     });

//     await ffmpegRef.current.writeFile("input.webm", await fetchFile(webmBlob));

//     await ffmpegRef.current.exec([
//       "-i",
//       "input.webm",
//       "-vn",
//       "-ar",
//       "44100",
//       "-ac",
//       "2",
//       "-b:a",
//       "128k",
//       "output.mp3",
//     ]);

//     const data = await ffmpegRef.current.readFile("output.mp3");

//     setLoading(false);

//     return new Blob([data.buffer], { type: "audio/mpeg" });
//   };

//   return {
//     convertWebmToMp3,
//     loading,
//     progress,
//   };
// }
