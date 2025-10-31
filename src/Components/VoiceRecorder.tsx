// src/Components/VoiceRecorder.tsx
import React, { useState, useRef } from "react";
import { Mic, Square } from "lucide-react";

interface VoiceRecorderProps {
    onRecordingComplete?: (blob: Blob) => void;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onRecordingComplete }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [status, setStatus] = useState<string | null>(null);
    const [audioURL, setAudioURL] = useState<string | null>(null);
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
                setStatus("Recording complete");
                onRecordingComplete?.(audioBlob);
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
        <div className="flex flex-col items-center gap-3 rounded-lg mb-4 w-fit">
            <button
                onClick={isRecording ? handleStopRecording : handleStartRecording}
                className={`p-4 rounded-full text-white transition ${isRecording ? "bg-red-600 animate-pulse" : "bg-[#0c555e] hover:bg-[#11717b]"
                    }`}
                title={isRecording ? "Stop Recording" : "Start Recording"}
            >
                {isRecording ? <Square size={22} /> : <Mic size={22} />}
            </button>

            {status && (
                <p
                    className={`text-sm ${status.includes("denied") ? "text-red-500" : "text-gray-700"
                        }`}
                >
                    {status}
                </p>
            )}

            {audioURL && <audio controls src={audioURL} className="mt-2 w-full" />}
        </div>
    );
};

export default VoiceRecorder;


// // src/Components/VoiceRecorder.tsx
// import React, { useState, useRef } from "react";
// import { Mic, Square } from "lucide-react";
// import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
// import { storage } from "../firebase";
// import { useUser } from "../context/UserContext";

// interface VoiceRecorderProps {
//     onUploadComplete?: (url: string) => void;
// }

// const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onUploadComplete }) => {
//     const { user } = useUser();
//     const [isRecording, setIsRecording] = useState(false);
//     const [audioURL, setAudioURL] = useState<string | null>(null);
//     const [uploading, setUploading] = useState(false);
//     const [status, setStatus] = useState<string | null>(null);
//     const [downloadURL, setDownloadURL] = useState<string | null>(null);

//     console.log(audioURL);

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

//             mediaRecorder.onstop = async () => {
//                 const audioBlob = new Blob(audioChunks.current, { type: "audio/webm" });
//                 const localUrl = URL.createObjectURL(audioBlob);
//                 setAudioURL(localUrl);

//                 if (!user) {
//                     setStatus("User not logged in.");
//                     return;
//                 }

//                 setUploading(true);
//                 setStatus("Uploading to Firebase...");

//                 try {
//                     // clean filename (avoid special chars)
//                     const fileName = `recordings/${user.user_id}-${Date.now()}.webm`;
//                     const fileRef = ref(storage, fileName);

//                     // Upload file directly using Firebase SDK (CORS-safe)
//                     await uploadBytes(fileRef, audioBlob);

//                     // Get downloadable URL
//                     const url = await getDownloadURL(fileRef);
//                     setDownloadURL(url);
//                     setStatus("Uploaded successfully!");

//                     // Pass URL to parent
//                     onUploadComplete?.(url);
//                 } catch (error: any) {
//                     console.error("Upload failed:", error);
//                     setStatus("Upload failed. Please try again.");
//                 } finally {
//                     setUploading(false);
//                 }
//             };

//             mediaRecorder.start();
//             setIsRecording(true);
//             setStatus("Recording...");
//         } catch (error) {
//             console.error("Microphone access denied:", error);
//             setStatus("Please allow microphone access.");
//         }
//     };

//     const handleStopRecording = () => {
//         if (mediaRecorderRef.current && isRecording) {
//             mediaRecorderRef.current.stop();
//             setIsRecording(false);
//         }
//     };

//     return (
//         <div className="flex flex-col items-center gap-3 rounded-lg mb-4 w-fit">
//             <button
//                 onClick={isRecording ? handleStopRecording : handleStartRecording}
//                 disabled={uploading}
//                 className={`p-4 rounded-full text-white transition ${isRecording
//                     ? "bg-red-600 animate-pulse"
//                     : "bg-[#0c555e] hover:bg-[#11717b]"
//                     } ${uploading ? "opacity-60 cursor-not-allowed" : ""}`}
//                 title={isRecording ? "Stop Recording" : "Start Recording"}
//             >
//                 {isRecording ? <Square size={22} /> : <Mic size={22} />}
//             </button>

//             {status && (
//                 <p
//                     className={`text-sm ${status.includes("failed") ? "text-red-500" : "text-gray-700"
//                         }`}
//                 >
//                     {status}
//                 </p>
//             )}

//             {downloadURL && (
//                 <audio controls src={downloadURL} className="mt-2 w-full" />
//             )}
//         </div>
//     );
// };

// export default VoiceRecorder;