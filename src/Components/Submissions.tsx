import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import * as XLSX from "xlsx";
import { useUser } from "../context/UserContext";
import { Download, Search } from "lucide-react";

interface Submission {
    id: string;
    client_name: string;
    scope: string[];
    starting_time: string[];
    phone_1: string;
    phone_2: string;
    message_number: string;
    district: any;
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
    lead_person: any;
    requirment_id: string;
    user_id: string[];
    isSendMessage: string[];
}

const Submissions = () => {
    const { user } = useUser();
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // const fetchSubmissions = async () => {
    //     if (!user) return;
    //     setLoading(true);
    //     const q = query(collection(db, "submissions"), where("user_id", "==", user.user_id));
    //     const snapshot = await getDocs(q);
    //     const data: Submission[] = snapshot.docs.map((doc) => ({
    //         id: doc.id,
    //         ...doc.data(),
    //     })) as Submission[];
    //     setSubmissions(data);
    //     setLoading(false);
    // };

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
            Scope: Array.isArray(sub.scope) ? sub.scope.join(", ") : sub.scope,
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
            "Send Message": sub.isSendMessage ? "Delivered" : "Pending",
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Submissions");
        XLSX.writeFile(workbook, "submissions.xlsx");
    };

    const handleSendMessage = (clientName: string, scope: string[], messageNumber: string) => {
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
                                    "Send Message",
                                ].map((head) => (
                                    <th key={head} className="px-4 py-3 border text-nowrap text-left font-medium">
                                        {head}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSubmissions.map((sub, i) => (
                                <tr
                                    key={sub.id}
                                    className="border-b hover:bg-gray-50 transition-all text-sm even:bg-gray-50"
                                >
                                    <td className="px-4 py-2">{i + 1}</td>
                                    <td className="px-4 py-2">{sub.code}</td>
                                    <td className="px-4 py-2">{sub.lead_person}</td>
                                    <td className="px-4 py-2">
                                        {sub.createdAt.toDate().toLocaleString().split(",")[0]}
                                    </td>
                                    <td className="px-4 py-2">
                                        {sub.createdAt.toDate().toLocaleString().split(",")[1]}
                                    </td>
                                    <td className="px-4 py-2 font-medium text-gray-800">{sub.client_name}</td>
                                    <td className="px-4 py-2">{sub.scope.join(", ")}</td>
                                    <td className="px-4 py-2">{sub.starting_time}</td>
                                    <td className="px-4 py-2">{[sub.phone_1, sub.phone_2]?.filter(Boolean)?.join(" / ")}</td>
                                    <td className="px-4 py-2">{sub.district}</td>
                                    <td className="px-4 py-2">{sub.location}</td>
                                    <td className="px-4 py-2">{sub.plot_size.join(", ")}</td>
                                    <td className="px-4 py-2">{sub.project_size.join(", ")}</td>
                                    <td className="px-4 py-2">{sub.remarks}</td>
                                    <td className="px-4 py-2">{sub.rooms.join(", ")}</td>
                                    <td className="px-4 py-2">{sub.budget}</td>
                                    <td className="px-4 py-2">{sub.special_notes.join(", ")}</td>
                                    <td className="px-4 py-2 text-center">
                                        {!sub.message_number ? <>
                                            <span className="text-green-700 font-semibold bg-green-100 px-2 py-1 rounded-full text-xs">
                                                Nill
                                            </span>
                                        </> :
                                            <>
                                                {sub.isSendMessage ? (
                                                    <span className="text-green-700 font-semibold bg-green-100 px-2 py-1 rounded-full text-xs">
                                                        Delivered
                                                    </span>
                                                ) : (
                                                    <button
                                                        onClick={() =>
                                                            handleSendMessage(sub.client_name, sub.scope, sub.message_number)
                                                        }
                                                        className="text-[#0c555e] hover:text-[#11717b] transition-all font-semibold underline text-sm"
                                                    >
                                                        Send
                                                    </button>
                                                )}
                                            </>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Submissions;


// import { useEffect, useState } from "react";
// import { db } from "../firebase";
// import { collection, query, where, getDocs } from "firebase/firestore";
// import * as XLSX from "xlsx";
// import { useUser } from "../context/UserContext";

// interface Submission {
//     id: string;
//     client_name: string;
//     scope: string[];
//     starting_time: string[];
//     phone_1: string;
//     phone_2: string;
//     message_number: string;
//     district: any;
//     location: string;
//     plot_ownership: string;
//     plot_size: string[];
//     project_size: string[];
//     rooms: string[];
//     budget: string;
//     code: string;
//     remarks: string;
//     special_notes: string[];
//     // color: string[];

//     createdAt: any;
//     lead_person: any;
//     requirment_id: string;
//     user_id: string[];
//     isSendMessage: string[];
//     // [key: string]: any;
// }

// const Submissions = () => {
//     const user = useUser();
//     const [submissions, setSubmissions] = useState<Submission[]>([]);
//     const [loading, setLoading] = useState(true);

//     console.log("submissions: ", submissions);

//     const fetchSubmissions = async () => {
//         if (!user) return;
//         setLoading(true);
//         const q = query(
//             collection(db, "submissions"),
//             where("user_id", "==", user.user_id)
//         );
//         const snapshot = await getDocs(q);
//         const data: Submission[] = snapshot.docs.map((doc) => ({
//             id: doc.id,
//             ...doc.data(),
//         })) as Submission[];
//         setSubmissions(data);
//         setLoading(false);
//     };

//     useEffect(() => {
//         fetchSubmissions();
//     }, [user]);

//     const exportToExcel = () => {
//         if (!submissions.length) return;

//         // Map only the displayed columns
//         const exportData = submissions.map((sub, i) => ({
//             "SL No": i + 1,
//             "Code": sub.code,
//             "Lead Person": sub.lead_person,
//             "Date": sub.createdAt?.toDate?.().toLocaleString().split(",")[0] || "",
//             "Time": sub.createdAt?.toDate?.().toLocaleString().split(",")[1] || "",
//             "Client Name": sub.client_name,
//             "Scope": Array.isArray(sub.scope) ? sub.scope.join(", ") : sub.scope,
//             "Starting Time": Array.isArray(sub.starting_time) ? sub.starting_time.join(", ") : sub.starting_time,
//             "Phone No": [sub.phone_1, sub.phone_2].filter(Boolean).join(" / "),
//             "District": sub.district,
//             "Location": sub.location,
//             "Plot Size": Array.isArray(sub.plot_size) ? sub.plot_size.join(", ") : sub.plot_size,
//             "Project Size": Array.isArray(sub.project_size) ? sub.project_size.join(", ") : sub.project_size,
//             "Remarks": sub.remarks,
//             "Rooms": Array.isArray(sub.rooms) ? sub.rooms.join(", ") : sub.rooms,
//             "Budget": sub.budget,
//             "Special Notes": Array.isArray(sub.special_notes) ? sub.special_notes.join(", ") : sub.special_notes,
//             "Send Message": sub.isSendMessage ? "Delivered" : "Pending",
//         }));

//         const worksheet = XLSX.utils.json_to_sheet(exportData);
//         const workbook = XLSX.utils.book_new();
//         XLSX.utils.book_append_sheet(workbook, worksheet, "Submissions");

//         XLSX.writeFile(workbook, "submissions.xlsx");
//     };

//     const handleSendMessage = (clientName: string, scope: string[], messageNumber: string) => {
//         const message = `Hello ${clientName},\n\nThank you for visiting L’empire Builders at the VANITHA VEEDU EXPO 2025! 🏡\n\nWe’ve noted down the requirements for ${scope}. Our representative will reach out soon.\n\nNeed assistance? Call us anytime at 📞 +91 97784 11620.\n\nThank you\nL’empire Builders`;
//         const whatsappLink = `https://wa.me/${messageNumber}?text=${encodeURIComponent(message)}`;
//         window.open(whatsappLink, "_blank");
//     };

//     if (!user) return <p>Loading user...</p>;
//     if (loading) return <p>Loading submissions...</p>;

//     return (
//         <div className="p-4 max-w-6xl mx-auto">
//             <h2 className="text-2xl font-semibold">Your Submissions</h2>
//             <div className="grid justify-between items-end mb-4">
//                 <div className="flex gap-[5px]" >
//                     <button
//                         className="bg-[#0c555e] text-white px-4 py-2 rounded text-nowrap hover:bg-[#106874] cursor-pointer"
//                         onClick={exportToExcel}
//                     >
//                         Export to Excel
//                     </button>

//                 </div>
//                 <div className="search_bar" style={{ border: "1px solid black", height: "100%", borderRadius: "6px" }} >
//                     <input type="search" placeholder="Search here" style={{ outline: "0", height: "50px", padding: "6px", borderRadius: "6px" }} />
//                 </div>
//             </div>

//             <div className="overflow-x-auto">
//                 <table className="min-w-full border border-gray-300 rounded">
//                     <thead className="bg-gray-100">
//                         <tr>
//                             <th className="px-4 py-2 border text-nowrap">SL No</th>
//                             <th className="px-4 py-2 border text-nowrap">Code</th>
//                             <th className="px-4 py-2 border text-nowrap">Lead person</th>
//                             <th className="px-4 py-2 border text-nowrap">Date</th>
//                             <th className="px-4 py-2 border text-nowrap">Time</th>
//                             <th className="px-4 py-2 border text-nowrap">Name of client</th>
//                             <th className="px-4 py-2 border text-nowrap">Scope</th>
//                             <th className="px-4 py-2 border text-nowrap">Starting time</th>
//                             <th className="px-4 py-2 border text-nowrap">Phone No.</th>
//                             <th className="px-4 py-2 border text-nowrap">District</th>
//                             <th className="px-4 py-2 border text-nowrap">Location</th>
//                             <th className="px-4 py-2 border text-nowrap">Plot</th>
//                             <th className="px-4 py-2 border text-nowrap">Project size</th>
//                             <th className="px-4 py-2 border text-nowrap">Remarks</th>
//                             <th className="px-4 py-2 border text-nowrap">Rooms</th>
//                             <th className="px-4 py-2 border text-nowrap">Budget</th>
//                             <th className="px-4 py-2 border text-nowrap">Special notes</th>
//                             {/* <th className="px-4 py-2 border text-nowrap">Colour</th> */}
//                             <th className="px-4 py-2 border text-nowrap">Send Message</th>
//                         </tr>
//                     </thead>
//                     <tbody>
//                         {submissions.map((sub, i) => (
//                             <tr key={sub.id} className="hover:bg-gray-50">
//                                 <td className="px-4 py-2 border text-nowrap">{i + 1}</td>
//                                 <td className="px-4 py-2 border text-nowrap">{sub.code}</td>
//                                 <td className="px-4 py-2 border text-nowrap">{sub.lead_person}</td>
//                                 <td className="px-4 py-2 border text-nowrap">{
//                                     sub.createdAt.toDate().toLocaleString().split(",")[0]
//                                 }</td>
//                                 <td className="px-4 py-2 border text-nowrap">{
//                                     sub.createdAt.toDate().toLocaleString().split(",")[1]
//                                 }</td>
//                                 <td className="px-4 py-2 border text-nowrap">{sub.client_name}</td>
//                                 <td className="px-4 py-2 border text-nowrap">{sub.scope}</td>
//                                 <td className="px-4 py-2 border text-nowrap">{sub.starting_time}</td>
//                                 <td className="px-4 py-2 border text-nowrap">{sub.phone_1} {sub.phone_1 && sub.phone_2 ? "/" : ""} {sub.phone_2}</td>
//                                 <td className="px-4 py-2 border text-nowrap">{sub.district}</td>
//                                 <td className="px-4 py-2 border text-nowrap">{sub.location}</td>
//                                 <td className="px-4 py-2 border text-nowrap">{sub.plot_size}</td>
//                                 <td className="px-4 py-2 border text-nowrap">{sub.project_size.map((item, i) => <span key={i} >{item}, </span>)}</td>
//                                 <td className="px-4 py-2 border text-nowrap">{sub.remarks}</td>
//                                 <td className="px-4 py-2 border text-nowrap">{sub.rooms}</td>
//                                 <td className="px-4 py-2 border text-nowrap">{sub.budget}</td>
//                                 <td className="px-4 py-2 border text-nowrap">{sub.special_notes}</td>
//                                 {/* <td className="px-4 py-2 border text-nowrap">{sub.color}</td> */}
//                                 <td className="px-4 py-2 border text-nowrap">
//                                     {sub.isSendMessage ? (
//                                         "Delivered"
//                                     ) : (
//                                         <button
//                                             onClick={() => handleSendMessage(sub.client_name, sub.scope.map((item) => item), sub.message_number)}
//                                             className="text-green-600 underline"
//                                         >
//                                             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
//                                                 <path d="M6.39234 10.8835L3.18925 6.28081C2.96536 5.88278 2.87317 5.42415 2.92575 4.97053C2.97833 4.5169 3.17304 4.09154 3.48204 3.75532C3.79104 3.41909 4.19848 3.18921 4.64614 3.09859C5.09367 3.00797 5.55849 3.06123 5.97397 3.25077L19.9987 9.94573C20.3725 10.1197 20.6889 10.3967 20.9106 10.7444C21.1322 11.0921 21.25 11.4958 21.25 11.908C21.25 12.3204 21.1322 12.7241 20.9106 13.0717C20.6889 13.4193 20.3725 13.6965 19.9987 13.8703L5.77193 20.7673C5.36546 20.9427 4.91492 20.9893 4.48107 20.9006C4.04722 20.812 3.65107 20.5924 3.34603 20.2717C3.04087 19.9508 2.84147 19.5441 2.77473 19.1064C2.70798 18.6687 2.77713 18.221 2.97281 17.8238L6.39233 13.0624C6.59245 12.7342 6.69833 12.3573 6.69833 11.973C6.69833 11.5886 6.59245 11.2117 6.39234 10.8835Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
//                                                 <path d="M13.4047 12.0523L6.68092 12.0523" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
//                                             </svg>
//                                         </button>
//                                     )}
//                                 </td>

//                             </tr>
//                         ))}
//                     </tbody>
//                 </table>
//             </div>
//         </div >
//     );
// };

// export default Submissions;