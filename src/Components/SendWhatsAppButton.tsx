import axios from "axios";

export default function SendWhatsAppButton({ docId }: { docId: string }) {
    const handleSend = async () => {
        await axios.post(
            "https://asia-south1-vanitha-veed.cloudfunctions.net/sendWhatsAppMessage",
            { docId }
        );
        alert("WhatsApp message sent manually");
    };

    return (
        <button
            onClick={handleSend}
            style={{
                padding: "8px 16px",
                background: "#1A73E8",
                color: "#fff",
                borderRadius: 6,
                border: "none",
                cursor: "pointer",
            }}
        >
            Send WhatsApp Now
        </button>
    );
}
