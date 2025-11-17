import { useState, useRef, useImperativeHandle, forwardRef } from "react";
import { Mic, Square } from "lucide-react";

interface VoiceRecorderProps {
    onRecordingComplete?: (blob: Blob) => void;
}

export interface VoiceRecorderHandle {
    stopRecordingManually: () => void;
}

const VoiceRecorder = forwardRef<VoiceRecorderHandle, VoiceRecorderProps>(
    ({ onRecordingComplete }, ref) => {
        const [isRecording, setIsRecording] = useState(false);
        const [status, setStatus] = useState<string | null>(null);
        const [audioURL, setAudioURL] = useState<string | null>(null);

        const mediaRecorderRef = useRef<MediaRecorder | null>(null);
        const audioChunks = useRef<Blob[]>([]);

        useImperativeHandle(ref, () => ({
            stopRecordingManually() {
                if (mediaRecorderRef.current && isRecording) {
                    mediaRecorderRef.current.stop();
                    setIsRecording(false);
                    setStatus("Processing...");
                }
            },
        }));

        const handleStartRecording = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const mediaRecorder = new MediaRecorder(stream);

                mediaRecorderRef.current = mediaRecorder;
                audioChunks.current = [];

                mediaRecorder.ondataavailable = (event) => {
                    audioChunks.current.push(event.data);
                };

                mediaRecorder.onstop = () => {
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
                setStatus("Processing...");
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
    }
);

export default VoiceRecorder;


// // src/Components/VoiceRecorder.tsx
// import React, { useState, useRef } from "react";
// import { Mic, Square } from "lucide-react";

// interface VoiceRecorderProps {
//     onRecordingComplete?: (blob: Blob) => void;
// }

// const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onRecordingComplete }) => {
//     const [isRecording, setIsRecording] = useState(false);
//     const [status, setStatus] = useState<string | null>(null);
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

//             mediaRecorder.onstop = async () => {
//                 const audioBlob = new Blob(audioChunks.current, { type: "audio/webm" });
//                 const localUrl = URL.createObjectURL(audioBlob);
//                 setAudioURL(localUrl);
//                 setStatus("Recording complete");
//                 onRecordingComplete?.(audioBlob);
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
//                 className={`p-4 rounded-full text-white transition ${isRecording ? "bg-red-600 animate-pulse" : "bg-[#0c555e] hover:bg-[#11717b]"
//                     }`}
//                 title={isRecording ? "Stop Recording" : "Start Recording"}
//             >
//                 {isRecording ? <Square size={22} /> : <Mic size={22} />}
//             </button>

//             {status && (
//                 <p
//                     className={`text-sm ${status.includes("denied") ? "text-red-500" : "text-gray-700"
//                         }`}
//                 >
//                     {status}
//                 </p>
//             )}

//             {audioURL && <audio controls src={audioURL} className="mt-2 w-full" />}
//         </div>
//     );
// };

// export default VoiceRecorder;