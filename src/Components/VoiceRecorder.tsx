// src/Components/VoiceRecorder.tsx
import React, { useState, useRef } from "react";
import { Mic, Square } from "lucide-react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase";
import { useUser } from "../context/UserContext";

interface VoiceRecorderProps {
    onUploadComplete?: (url: string) => void;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onUploadComplete }) => {
    const { user } = useUser();
    const [isRecording, setIsRecording] = useState(false);
    const [audioURL, setAudioURL] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [status, setStatus] = useState<string | null>(null);
    const [downloadURL, setDownloadURL] = useState<string | null>(null);

    console.log(downloadURL, status, audioURL)

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunks = useRef<Blob[]>([]);

    const handleStartRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunks.current = [];

            mediaRecorder.ondataavailable = (event) => {
                audioChunks.current.push(event.data);
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunks.current, { type: "audio/webm" });
                const localUrl = URL.createObjectURL(audioBlob);
                setAudioURL(localUrl);

                if (!user) return;

                setUploading(true);
                setStatus("Uploading to Firebase...");

                try {
                    const fileRef = ref(storage, `recordings/${user.user_id}-${Date.now()}.webm`);
                    await uploadBytes(fileRef, audioBlob);
                    const url = await getDownloadURL(fileRef);

                    setDownloadURL(url);
                    setStatus("Uploaded successfully!");

                    // Send URL to parent form
                    if (onUploadComplete) onUploadComplete(url);
                } catch (error) {
                    console.error("Upload failed:", error);
                    setStatus("Upload failed. Try again.");
                } finally {
                    setUploading(false);
                }
            };

            mediaRecorder.start();
            setIsRecording(true);
            setStatus("Recording...");
        } catch (error) {
            console.error("Microphone access denied:", error);
            setStatus("Please allow microphone access.");
        }
    };

    const handleStopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    return (
        <div className="flex flex-col items-center gap-4 rounded-lg mb-4 w-fit">
            <button
                onClick={isRecording ? handleStopRecording : handleStartRecording}
                disabled={uploading}
                className={`p-4 rounded-full text-white transition ${isRecording
                    ? "bg-red-600 animate-pulse"
                    : "bg-[#0c555e] hover:bg-[#11717b]"
                    } ${uploading ? "opacity-60 cursor-not-allowed" : ""}`}
                title={isRecording ? "Stop Recording" : "Start Recording"}
            >
                {isRecording ? <Square size={22} /> : <Mic size={22} />}
            </button>
        </div>
    );
};

export default VoiceRecorder;


// import React, { useState, useEffect, useRef } from "react";
// import { Mic, Square } from "lucide-react";

// const VoiceRecorder = () => {
//     const [isRecording, setIsRecording] = useState(false);
//     const [audioURL, setAudioURL] = useState<string | null>(null);
//     const mediaRecorderRef = useRef<MediaRecorder | null>(null);
//     const audioChunks = useRef<Blob[]>([]);

//     const handleStartRecording = async () => {
//         try {
//             const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//             const mediaRecorder = new MediaRecorder(stream);
//             mediaRecorderRef.current = mediaRecorder;
//             audioChunks.current = [];

//             mediaRecorder.ondataavailable = (event) => {
//                 audioChunks.current.push(event.data);
//             };

//             mediaRecorder.onstop = () => {
//                 const audioBlob = new Blob(audioChunks.current, { type: "audio/webm" });
//                 const audioUrl = URL.createObjectURL(audioBlob);
//                 setAudioURL(audioUrl);
//             };

//             mediaRecorder.start();
//             setIsRecording(true);
//         } catch (error) {
//             console.error("Microphone access denied:", error);
//             alert("Please allow microphone access to record.");
//         }
//     };

//     const handleStopRecording = () => {
//         if (mediaRecorderRef.current && isRecording) {
//             mediaRecorderRef.current.stop();
//             setIsRecording(false);
//         }
//     };

//     const handleDownload = () => {
//         if (!audioURL) return;
//         const a = document.createElement("a");
//         a.href = audioURL;
//         a.download = "recording.webm";
//         a.click();
//     };

//     return (
//         <div className="flex flex-col items-center gap-4">
//             {/* Record Button */}
//             <button
//                 onClick={isRecording ? handleStopRecording : handleStartRecording}
//                 className={`p-4 rounded-full transition text-white shadow-md ${isRecording ? "bg-red-600 animate-pulse" : "bg-[#0c555e] hover:bg-[#11717b]"
//                     }`}
//                 title={isRecording ? "Stop Recording" : "Start Recording"}
//             >
//                 {isRecording ? <Square size={22} /> : <Mic size={22} />}
//             </button>

//             {/* Audio Player */}
//             {audioURL && (
//                 <div className="flex flex-col items-center gap-2">
//                     {/* <audio controls src={audioURL} className="w-64" /> */}
//                     {/* <button
//                         onClick={handleDownload}
//                         className="text-[#0c555e] underline hover:text-[#11717b] transition text-sm"
//                     >
//                         Download Recording
//                     </button> */}
//                 </div>
//             )}
//         </div>
//     );
// };

// export default VoiceRecorder;
