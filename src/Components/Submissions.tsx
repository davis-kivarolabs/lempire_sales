import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import * as XLSX from "xlsx";
import { useUser } from "../context/UserContext";
import { Download, Search } from "lucide-react";

interface Submission {
    id: string;
    client_name: string;
    scope: string;
    starting_time: string[];
    phone_1: string;
    phone_2: string;
    message_number: string;
    district: string;
    location: string;
    plot_ownership: string;
    plot_size: string[];
    project_size: string[];
    rooms: string[];
    budget: string;
    code: string;
    remarks: string;
    special_notes: string[];
    createdAt: any;
    lead_person: string;
    requirment_id: string;
    user_id: string[];
    whatsapp_sent: boolean;
    voice_recording: string;
    whatsapp_sent_at: string;
}

const Submissions = () => {
    const { user } = useUser();
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    console.log("submissions: ", submissions)

    const fetchSubmissions = async () => {
        if (!user) return;

        setLoading(true);

        try {
            let q;
            if (user.role === "admin" || user.role === "marketing") {
                q = query(collection(db, "submissions"));
            }
            else {
                q = query(collection(db, "submissions"), where("user_id", "==", user.user_id));
            }

            const snapshot = await getDocs(q);
            const data: Submission[] = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Submission[];

            setSubmissions(data);
        } catch (error) {
            console.error("Error fetching submissions:", error);
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        fetchSubmissions();
    }, [user]);

    const exportToExcel = () => {
        if (!submissions.length) return;
        const exportData = submissions.map((sub, i) => ({
            "SL No": i + 1,
            Code: sub.code,
            "Lead Person": sub.lead_person,
            Date: sub.createdAt?.toDate?.().toLocaleString().split(",")[0] || "",
            Time: sub.createdAt?.toDate?.().toLocaleString().split(",")[1] || "",
            "Client Name": sub.client_name,
            Scope: sub.scope,
            // Scope: Array.isArray(sub.scope) ? sub.scope.join(", ") : sub.scope,
            "Starting Time": Array.isArray(sub.starting_time)
                ? sub.starting_time.join(", ")
                : sub.starting_time,
            "Phone No": [sub.phone_1, sub.phone_2].filter(Boolean).join(" / "),
            District: sub.district,
            Location: sub.location,
            "Plot Size": Array.isArray(sub.plot_size) ? sub.plot_size.join(", ") : sub.plot_size,
            "Project Size": Array.isArray(sub.project_size)
                ? sub.project_size.join(", ")
                : sub.project_size,
            Remarks: sub.remarks,
            Rooms: Array.isArray(sub.rooms) ? sub.rooms.join(", ") : sub.rooms,
            Budget: sub.budget,
            "Special Notes": Array.isArray(sub.special_notes)
                ? sub.special_notes.join(", ")
                : sub.special_notes,
            "Send Message": sub.whatsapp_sent ? "Delivered" : "Pending",
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Submissions");
        XLSX.writeFile(workbook, "submissions.xlsx");
    };

    const handleSendMessage = (clientName: string, scope: string, messageNumber: string) => {
        const message = `Hello ${clientName} 👋,\n\nThank you for visiting L’empire Builders at the VANITHA VEEDU EXPO 2025! 🏡\n\nWe’ve noted down the requirements for ${scope}. Our representative will reach out soon.\n\nNeed assistance? Call us anytime at 📞 +91 97784 11620.\n\nThank you\nL’empire Builders`;
        const whatsappLink = `https://wa.me/${messageNumber}?text=${encodeURIComponent(message)}`;
        window.open(whatsappLink, "_blank");
    };

    const filteredSubmissions = submissions.filter((sub) => {
        const term = searchTerm.toLowerCase();
        return (
            sub.client_name.toLowerCase().includes(term) ||
            sub.lead_person?.toLowerCase().includes(term) ||
            sub.code?.toLowerCase().includes(term) ||
            sub.district?.toLowerCase().includes(term) ||
            sub.phone_1?.includes(term) ||
            sub.phone_2?.includes(term)
        );
    });


    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentData = filteredSubmissions.slice(startIndex, startIndex + itemsPerPage);

    const totalPages = Math.ceil(filteredSubmissions.length / itemsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);


    if (!user) return <p className="text-center mt-10 text-gray-500">Loading user...</p>;
    if (loading) return <p className="text-center mt-10 text-gray-500">Loading submissions...</p>;

    return (
        // <div className="p-6 max-w-7xl mx-auto">
        <div className="py-6 mx-auto">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <h2 className="text-3xl font-semibold text-[#0c555e]">Your Submissions</h2>

                <div className="flex flex-wrap gap-3 items-center">
                    <div className="relative">
                        <Search className="absolute left-3 top-3.5 text-gray-400 w-4 h-4" />
                        <input
                            type="search"
                            placeholder="Search client..."
                            className="pl-9 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-[#0c555e] focus:outline-none w-60"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <button
                        onClick={exportToExcel}
                        className="flex items-center gap-2 bg-[#0c555e] hover:bg-[#11717b] text-white px-4 py-2 rounded-lg shadow-md transition-all"
                    >
                        <Download className="w-4 h-4" />
                        Export
                    </button>
                </div>
            </div>

            {/* Table Section */}
            <div className="bg-[#f0e9e9] shadow-lg rounded-md overflow-hidden border border-gray-200">
                <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse">
                        <thead className="bg-[#0c555e] text-white sticky top-0">
                            <tr>
                                {[
                                    "SL No",
                                    "Send Message",
                                    "Code",
                                    "Lead person",
                                    "Date",
                                    "Time",
                                    "Client Name",
                                    "Scope",
                                    "Starting Time",
                                    "Phone No.",
                                    "District",
                                    "Location",
                                    "Plot",
                                    "Project Size",
                                    "Remarks",
                                    "Rooms",
                                    "Budget",
                                    "Special Notes",
                                    "voice_recording",
                                ].map((head) => (
                                    <th key={head} className="px-4 py-3 border text-nowrap text-left font-medium">
                                        {head}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {currentData?.map((sub, i) => (
                                <tr
                                    key={sub.id}
                                    className="border-b hover:bg-gray-50 transition-all text-sm even:bg-gray-50"
                                >
                                    <td className="px-4 py-2">{i + 1}</td>
                                    <td className="px-4 py-2 text-start text-nowrap">
                                        {!sub.message_number ? <>
                                            <span className="text-[#0c555e] cursor-pointer hover:text-[#11717b] transition-all font-semibold underline text-sm">
                                                Nill
                                            </span>
                                        </> :
                                            <>
                                                {sub.whatsapp_sent ? (
                                                    <div title={`Delivered message to ${sub.message_number}`} >
                                                        {/* <div title={`Delivered message to ${sub.message_number} on ${sub.whatsapp_sent_at.toDate().toLocaleString()}`} > */}

                                                        <span
                                                            // className="text-green-700 font-semibold bg-green-100 px-2 py-1 rounded-full text-xs"
                                                            className="text-[#0c555e] cursor-pointer hover:text-[#11717b] transition-all font-semibold underline text-sm"
                                                        >
                                                            Delivered
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <div title={`Sent message to ${sub.message_number}`} >
                                                        <button
                                                            onClick={() =>
                                                                handleSendMessage(sub.client_name, sub.scope, sub.message_number)
                                                            }
                                                            className="text-[#0c555e] cursor-pointer hover:text-[#11717b] transition-all font-semibold underline text-sm"
                                                        >
                                                            Send
                                                        </button>
                                                    </div>
                                                )}
                                            </>}
                                    </td>
                                    <td className="px-4 py-2">{sub.code}</td>
                                    <td className="px-4 py-2">{sub.lead_person}</td>
                                    <td className="px-4 py-2">
                                        {sub?.createdAt?.toDate().toLocaleString().split(",")[0]}
                                    </td>
                                    <td className="px-4 py-2">
                                        {sub?.createdAt?.toDate().toLocaleString().split(",")[1]}
                                    </td>
                                    <td className="px-4 py-2 font-medium text-gray-800">{sub?.client_name}</td>
                                    <td className="px-4 py-2">{sub?.scope}</td>
                                    {/* <td className="px-4 py-2">{sub?.scope?.join(", ")}</td> */}
                                    <td className="px-4 py-2">{sub?.starting_time}</td>
                                    <td className="px-4 py-2">{[sub?.phone_1, sub?.phone_2]?.filter(Boolean)?.join(",")}</td>
                                    <td className="px-4 py-2">{sub?.district}</td>
                                    <td className="px-4 py-2">{sub?.location}</td>
                                    <td className="px-4 py-2">{sub?.plot_size?.join(", ")}</td>
                                    <td className="px-4 py-2">{sub?.project_size?.join(", ")}</td>
                                    <td className="px-4 py-2" style={{ minWidth: "250px" }} >{sub?.remarks}</td>
                                    <td className="px-4 py-2">{sub?.rooms?.join(", ")}</td>
                                    <td className="px-4 py-2">{sub?.budget}</td>
                                    <td className="px-4 py-2">{sub?.special_notes?.join(", ")}</td>
                                    <td className="px-4 py-2">{sub?.voice_recording ? <audio controls src={sub?.voice_recording} className="mt-2 w-full" /> : <span className="text-green-700 font-semibold bg-green-100 px-2 py-1 rounded-full text-xs">
                                        No Voices
                                    </span>}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="flex justify-end items-center gap-3 mt-4 mb-4">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage((p) => p - 1)}
                            className="px-3 py-1 border rounded disabled:opacity-50"
                        >
                            Prev
                        </button>

                        <span className="text-sm">
                            Page {currentPage} of {totalPages}
                        </span>

                        <button
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage((p) => p + 1)}
                            className="px-3 py-1 border rounded disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Submissions;

// Lempire@A