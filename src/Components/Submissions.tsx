import { useEffect, useState, useMemo } from "react";
import { db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import * as XLSX from "xlsx";
import { useUser } from "../context/UserContext";
import { Download, Search } from "lucide-react";
import axios from "axios";

// --------------------------------------------
// Types
// --------------------------------------------
interface Submission {
  id: string;
  client_name: string;
  scope: string;
  starting_time: string;
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
  expo_location: string;
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
  const [leadFilter, setLeadFilter] = useState("all");
  const [expoLocationsFilter, setExpoLocationsFilter] = useState("all");

  const [sortColumn, setSortColumn] = useState("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const [sendLoading, setSendLoading] = useState("");

  const itemsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);

  // ------------------------------------------------
  // Fetch Submissions
  // ------------------------------------------------
  const fetchSubmissions = async () => {
    if (!user) return;

    setLoading(true);

    try {
      let q;
      if (
        user.role === "admin" ||
        user.role === "marketing" ||
        user.role === "sales"
      ) {
        q = query(collection(db, "submissions"));
      } else {
        q = query(
          collection(db, "submissions"),
          where("user_id", "==", user.user_id)
        );
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

  // ------------------------------------------------
  // Universal Search Function
  // ------------------------------------------------
  const searchInSubmission = (sub: Submission, term: string) => {
    const t = term.toLowerCase();

    return Object.values(sub).some((val) => {
      if (!val) return false;
      if (Array.isArray(val)) return val.join(" ").toLowerCase().includes(t);
      if (typeof val === "string") return val.toLowerCase().includes(t);
      if (typeof val === "number") return val.toString().includes(t);
      return false;
    });
  };

  // ------------------------------------------------
  // Apply Lead Filter + Search
  // ------------------------------------------------
  const filteredSubmissions = useMemo(() => {
    let data = [...submissions];

    if (leadFilter !== "all") {
      data = data.filter((sub) => sub.lead_person === leadFilter);
    }

    if (expoLocationsFilter !== "all") {
      data = data.filter((sub) => sub.expo_location === expoLocationsFilter);
    }

    if (searchTerm.trim() !== "") {
      data = data.filter((sub) => searchInSubmission(sub, searchTerm));
    }

    return data;
  }, [submissions, leadFilter, expoLocationsFilter, searchTerm]);

  // ------------------------------------------------
  // Sorting
  // ------------------------------------------------
  const sortedSubmissions = useMemo(() => {
    return [...filteredSubmissions].sort((a, b) => {
      let valA: any = a[sortColumn as keyof Submission];
      let valB: any = b[sortColumn as keyof Submission];

      if (sortColumn === "createdAt") {
        valA = a.createdAt?.toMillis?.() || 0;
        valB = b.createdAt?.toMillis?.() || 0;
      }

      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();

      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredSubmissions, sortColumn, sortDirection]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  // ------------------------------------------------
  // Pagination
  // ------------------------------------------------
  const totalPages = Math.ceil(sortedSubmissions.length / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = sortedSubmissions.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, leadFilter]);

  // ------------------------------------------------
  // Excel Export
  // ------------------------------------------------
  const exportToExcel = () => {
    if (!sortedSubmissions.length) return;

    const exportData = sortedSubmissions.map((sub, i) => ({
      "SL No": i + 1,
      Code: sub.code,
      "Lead Person": sub.lead_person,
      Date: sub.createdAt?.toDate?.().toLocaleDateString() || "",
      Time: sub.createdAt?.toDate?.().toLocaleTimeString() || "",
      "Client Name": sub.client_name,
      Scope: sub.scope,
      "Starting Time": sub.starting_time,
      "Phone No": [sub.phone_1, sub.phone_2].filter(Boolean).join(" / "),
      District: sub.district,
      Location: sub.location,
      "Plot Size": sub.plot_size?.join(", "),
      "Project Size": sub.project_size?.join(", "),
      Remarks: sub.remarks,
      Rooms: sub.rooms?.join(", "),
      Budget: sub.budget,
      "Special Notes": sub.special_notes?.join(", "),
      "Send Message": sub.whatsapp_sent ? "Delivered" : "Pending",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Submissions");
    XLSX.writeFile(wb, "submissions.xlsx");
  };

  // ------------------------------------------------
  // WhatsApp Message Handlers
  // ------------------------------------------------
  const handleSendMessageNoTemplate = (
    name: string,
    scope: string,
    number: string
  ) => {
    if (user?.role !== "marketing") return;

    const lower = scope.toLowerCase();

    let message = "";

    if (lower === "just enquiry" || lower === "dealers") {
      message = `Hi ${name},
Thank you for visiting our stall at the Malayala Manorama Vanitha Veedu Exhibition! 🏠

It was a pleasure connecting with you. We appreciate your interest in Lempire Builders.

Warm regards,
L’empire Builders
+91 97784 11620
+91 97784 11609`;
    } else {
      message = `Hi ${name},
Thank you for visiting our stall at the Malayala Manorama Vanitha Veedu Exhibition! 🏠

We've noted your requirement regarding ${scope}.
Our technical team will connect with you shortly.

Warm regards,
L’empire Builders
+91 97784 11620
+91 97784 11609`;
    }

    window.open(
      `https://wa.me/${number}?text=${encodeURIComponent(message)}`,
      "_blank"
    );
  };

  //////////////////////
  //   const handleNewYearSendMessage = (number: string) => {
  //     if (user?.role !== "marketing") return;

  //     // const lower = scope.toLowerCase();

  //     const message = "";

  //     window.open(
  //       `https://wa.me/${number}?text=${encodeURIComponent(message)}`,
  //       "_blank"
  //     );
  //   };

  const handleNewYearSendMessage = (number: string) => {
    if (user?.role !== "marketing") return;

    console.log("No. ", number);

    const desktopUrl = `whatsapp://send?phone=${number}`;

    const webUrl = `https://wa.me/${number}`;

    window.location.href = desktopUrl;

    setTimeout(() => {
      window.open(webUrl, "_blank");
    }, 800);
  };

  //////////////////////

  const handleSendMessage = async (docId: string) => {
    if (user?.role !== "marketing") return;

    setSendLoading(docId);

    await axios.post(
      "https://asia-south1-vanitha-veed.cloudfunctions.net/sendWhatsAppMessage",
      { docId }
    );

    alert("WhatsApp message sent manually");
    setSendLoading("");
  };

  // ------------------------------------------------
  // Render
  // ------------------------------------------------
  if (!user)
    return <p className="mt-10 text-center text-gray-500">Loading user...</p>;
  if (loading)
    return (
      <p className="mt-10 text-center text-gray-500">Loading submissions...</p>
    );

  // Collect unique lead persons
  const uniqueLeads = [...new Set(submissions.map((s) => s.lead_person))];
  const expoLocations = [...new Set(submissions.map((s) => s.expo_location))];

  return (
    <div className="py-6 mx-auto">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-3xl font-semibold text-[#0c555e]">
          Your Submissions
        </h2>

        <div className="flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3.5 text-gray-400 w-4 h-4" />
            <input
              type="search"
              placeholder="Search anything..."
              className="pl-9 pr-3 py-2 border rounded-md shadow-sm w-60 focus:ring-2 focus:ring-[#0c555e]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Lead Filter Dropdown */}
          <select
            className="border px-3 py-2 rounded-md shadow-sm"
            value={leadFilter}
            onChange={(e) => setLeadFilter(e.target.value)}
          >
            <option value="all">All Leads</option>
            {uniqueLeads.map((lead) => (
              <option key={lead} value={lead}>
                {lead}
              </option>
            ))}
          </select>

          {/* Expo locations Filter Dropdown */}
          <select
            className="border px-3 py-2 rounded-md shadow-sm"
            value={expoLocationsFilter}
            onChange={(e) => setExpoLocationsFilter(e.target.value)}
          >
            <option value="all">All Expo</option>
            {expoLocations.map((expo) => (
              <option key={expo} value={expo}>
                {expo}
              </option>
            ))}
          </select>

          {/* Export Button */}
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 bg-[#0c555e] hover:bg-[#11717b] text-white px-4 py-2 rounded-lg"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border shadow-lg rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            {/* Table Head */}
            <thead className="bg-[#0c555e] text-white sticky top-0 text-sm">
              <tr>
                {[
                  { key: "manual_message", label: "Manual Message" },
                  { key: "sl", label: "SL No" },
                  { key: "scope", label: "Scope" },
                  { key: "whatsapp_sent", label: "Send Message" },
                  { key: "code", label: "Code" },
                  { key: "expo_location", label: "Expo Location" },
                  { key: "lead_person", label: "Lead Person" },
                  { key: "createdAt", label: "Date" },
                  { key: "createdAt", label: "Time" },
                  { key: "client_name", label: "Client Name" },
                  { key: "starting_time", label: "Starting Time" },
                  { key: "phone_1", label: "Phone No" },
                  { key: "district", label: "District" },
                  { key: "location", label: "Location" },
                  { key: "plot_size", label: "Plot Size" },
                  { key: "project_size", label: "Project Size" },
                  { key: "remarks", label: "Remarks" },
                  { key: "rooms", label: "Rooms" },
                  { key: "budget", label: "Budget" },
                  { key: "special_notes", label: "Special Notes" },
                  { key: "voice_recording", label: "Voice Recording" },
                  ...(user?.role === "marketing"
                    ? [{ key: "send", label: "Send Manually" }]
                    : []),
                ].map((col) => (
                  <th
                    key={col.label}
                    className="px-4 py-3 border cursor-pointer select-none"
                    onClick={() =>
                      col.key !== "sl" &&
                      col.key !== "send" &&
                      handleSort(col.key)
                    }
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      {sortColumn === col.key && (
                        <span className="text-xs">
                          {sortDirection === "asc" ? "▲" : "▼"}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="text-sm">
              {currentData.map((sub, i) => {
                const globalIndex = startIndex + i + 1;

                return (
                  <tr key={sub.id} className="border-b hover:bg-gray-50">
                    {user?.role === "marketing" && (
                      <td className="px-4 py-2">
                        <button
                          onClick={() =>
                            handleNewYearSendMessage(sub.message_number)
                          }
                          className="text-[#0c555e] underline font-semibold hover:text-[#11717b]"
                        >
                          Send
                        </button>
                      </td>
                    )}
                    {/* SL NO */}
                    <td className="px-4 py-2">{globalIndex}</td>
                    <td className="px-4 py-2">{sub.scope}</td>

                    {/* Send Message Column */}
                    <td className="px-4 py-2">
                      {sub.whatsapp_sent ? (
                        <span className="text-green-600 font-semibold">
                          Delivered
                        </span>
                      ) : (
                        <span className="text-red-600 font-semibold">
                          Pending
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-2">{sub.code}</td>
                    <td className="px-4 py-2">{sub.expo_location}</td>
                    <td className="px-4 py-2">{sub.lead_person}</td>

                    <td className="px-4 py-2">
                      {sub.createdAt?.toDate().toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2">
                      {sub.createdAt?.toDate().toLocaleTimeString()}
                    </td>

                    <td className="px-4 py-2 font-semibold">
                      {sub.client_name}
                    </td>
                    {/* <td className="px-4 py-2">{sub.scope}</td> */}
                    <td className="px-4 py-2">{sub.starting_time}</td>
                    <td className="px-4 py-2">
                      {[sub.phone_1, sub.phone_2].filter(Boolean).join(", ")}
                    </td>
                    <td className="px-4 py-2">{sub.district}</td>
                    <td className="px-4 py-2">{sub.location}</td>
                    <td className="px-4 py-2">{sub.plot_size?.join(", ")}</td>
                    <td className="px-4 py-2">
                      {sub.project_size?.join(", ")}
                    </td>
                    <td className="px-4 py-2">{sub.remarks}</td>
                    <td className="px-4 py-2">{sub.rooms?.join(", ")}</td>
                    <td className="px-4 py-2">{sub.budget}</td>
                    <td className="px-4 py-2">
                      {sub.special_notes?.join(", ")}
                    </td>

                    <td className="px-4 py-2">
                      {sub.voice_recording ? (
                        <audio
                          controls
                          src={sub.voice_recording}
                          className="w-full"
                        />
                      ) : (
                        <span className="text-gray-600 text-xs bg-gray-100 px-2 py-1 rounded-full">
                          No Audio
                        </span>
                      )}
                    </td>

                    {/* Marketing Manual Send */}
                    {user?.role === "marketing" && (
                      <td className="px-4 py-2">
                        {sendLoading === sub.id ? (
                          <span className="text-blue-600 font-medium">
                            Sending...
                          </span>
                        ) : (
                          <button
                            onClick={() =>
                              sub.scope === "Just enquiry" ||
                              sub.scope === "Dealers"
                                ? handleSendMessageNoTemplate(
                                    sub.client_name,
                                    sub.scope,
                                    sub.message_number
                                  )
                                : handleSendMessage(sub.id)
                            }
                            className="text-[#0c555e] underline font-semibold hover:text-[#11717b]"
                          >
                            Send
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination */}
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

// origin
// import { useEffect, useState } from "react";
// import { db } from "../firebase";
// import { collection, query, where, getDocs } from "firebase/firestore";
// import * as XLSX from "xlsx";
// import { useUser } from "../context/UserContext";
// import { Download, Search } from "lucide-react";
// import axios from "axios";

// interface Submission {
//     id: string;
//     client_name: string;
//     scope: string;
//     starting_time: string[];
//     phone_1: string;
//     phone_2: string;
//     message_number: string;
//     district: string;
//     location: string;
//     plot_ownership: string;
//     plot_size: string[];
//     project_size: string[];
//     rooms: string[];
//     budget: string;
//     code: string;
//     remarks: string;
//     special_notes: string[];
//     createdAt: any;
//     lead_person: string;
//     requirment_id: string;
//     user_id: string[];
//     whatsapp_sent: boolean;
//     voice_recording: string;
//     whatsapp_sent_at: string;
// }

// const Submissions = () => {
//     const { user } = useUser();
//     const [submissions, setSubmissions] = useState<Submission[]>([]);
//     const [loading, setLoading] = useState(true);
//     const [searchTerm, setSearchTerm] = useState("");

//     console.log("submissions: ", submissions)

//     const fetchSubmissions = async () => {
//         if (!user) return;

//         setLoading(true);

//         try {
//             let q;
//             if (user.role === "admin" || user.role === "marketing") {
//                 q = query(collection(db, "submissions"));
//             }
//             else {
//                 q = query(collection(db, "submissions"), where("user_id", "==", user.user_id));
//             }

//             const snapshot = await getDocs(q);
//             const data: Submission[] = snapshot.docs.map((doc) => ({
//                 id: doc.id,
//                 ...doc.data(),
//             })) as Submission[];

//             setSubmissions(data);
//         } catch (error) {
//             console.error("Error fetching submissions:", error);
//         } finally {
//             setLoading(false);
//         }
//     };

//     useEffect(() => {
//         fetchSubmissions();
//     }, [user]);

//     const exportToExcel = () => {
//         if (!submissions.length) return;
//         const exportData = submissions.map((sub, i) => ({
//             "SL No": i + 1,
//             Code: sub.code,
//             "Lead Person": sub.lead_person,
//             Date: sub.createdAt?.toDate?.().toLocaleString().split(",")[0] || "",
//             Time: sub.createdAt?.toDate?.().toLocaleString().split(",")[1] || "",
//             "Client Name": sub.client_name,
//             Scope: sub.scope,
//             "Starting Time": Array.isArray(sub.starting_time)
//                 ? sub.starting_time.join(", ")
//                 : sub.starting_time,
//             "Phone No": [sub.phone_1, sub.phone_2].filter(Boolean).join(" / "),
//             District: sub.district,
//             Location: sub.location,
//             "Plot Size": Array.isArray(sub.plot_size) ? sub.plot_size.join(", ") : sub.plot_size,
//             "Project Size": Array.isArray(sub.project_size)
//                 ? sub.project_size.join(", ")
//                 : sub.project_size,
//             Remarks: sub.remarks,
//             Rooms: Array.isArray(sub.rooms) ? sub.rooms.join(", ") : sub.rooms,
//             Budget: sub.budget,
//             "Special Notes": Array.isArray(sub.special_notes)
//                 ? sub.special_notes.join(", ")
//                 : sub.special_notes,
//             "Send Message": sub.whatsapp_sent ? "Delivered" : "Pending",
//         }));

//         const worksheet = XLSX.utils.json_to_sheet(exportData);
//         const workbook = XLSX.utils.book_new();
//         XLSX.utils.book_append_sheet(workbook, worksheet, "Submissions");
//         XLSX.writeFile(workbook, "submissions.xlsx");
//     };

// const handleSendMessageNoTemplate = (clientName: string, scope: string, messageNumber: string) => {
//     if (user?.role !== "marketing") return

//     let message = "";

//     const lowerScope = scope.toLowerCase(); // normalize

//     if (lowerScope === "just enquiry" || lowerScope === "dealers") {
//         message = `Hi ${clientName},
// Thank you for visiting our stall at the Malayala Manorama Vanitha Veedu Exhibition! 🏠

// It was a pleasure connecting with you. We appreciate your time and interest in Lempire Builders.

// Warm regards,
// L’empire Builders
// +91 97784 11620
// +91 97784 11609`;
//     } else {
//         message = `Hi ${clientName},
// Thank you for visiting our stall at the Malayala Manorama Vanitha Veedu Exhibition! 🏠

// We're really glad to have hosted you and appreciate your interest in our work.

// We've noted your requirement regarding ${scope} and our technical team will be connecting with you shortly to discuss your project in detail.

// Warm regards,
// L’empire Builders
// +91 97784 11620
// +91 97784 11609`;
//     }

//     const whatsappLink = `https://wa.me/${messageNumber}?text=${encodeURIComponent(message)}`;
//     window.open(whatsappLink, "_blank");
// };

//     const [sendLoading, setSendLoading] = useState("")
//     const handleSendMessage = async (docId: string) => {
//         if (user?.role !== "marketing") return
//         setSendLoading(docId)
//         await axios.post(
//             "https://asia-south1-vanitha-veed.cloudfunctions.net/sendWhatsAppMessage",
//             { docId }
//         );
//         alert("WhatsApp message sent manually");
//         setSendLoading("")
//     };

//     const filteredSubmissions = submissions.filter((sub) => {
//         const term = searchTerm.toLowerCase();
//         return (
//             sub.client_name.toLowerCase().includes(term) ||
//             sub.lead_person?.toLowerCase().includes(term) ||
//             sub.code?.toLowerCase().includes(term) ||
//             sub.district?.toLowerCase().includes(term) ||
//             sub.phone_1?.includes(term) ||
//             sub.phone_2?.includes(term) ||
//             sub.scope?.toLowerCase().includes(term)
//         );
//     });

//     const [currentPage, setCurrentPage] = useState(1);
//     const itemsPerPage = 10;

//     const startIndex = (currentPage - 1) * itemsPerPage;
//     const currentData = filteredSubmissions.slice(startIndex, startIndex + itemsPerPage);

//     const totalPages = Math.ceil(filteredSubmissions.length / itemsPerPage);

//     useEffect(() => {
//         setCurrentPage(1);
//     }, [searchTerm]);

//     if (!user) return <p className="text-center mt-10 text-gray-500">Loading user...</p>;
//     if (loading) return <p className="text-center mt-10 text-gray-500">Loading submissions...</p>;

//     return (
//         <div className="py-6 mx-auto">
//             <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
//                 <h2 className="text-3xl font-semibold text-[#0c555e]">Your Submissions</h2>

//                 <div className="flex flex-wrap gap-3 items-center">
//                     <div className="relative">
//                         <Search className="absolute left-3 top-3.5 text-gray-400 w-4 h-4" />
//                         <input
//                             type="search"
//                             placeholder="Search client..."
//                             className="pl-9 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-[#0c555e] focus:outline-none w-60"
//                             value={searchTerm}
//                             onChange={(e) => setSearchTerm(e.target.value)}
//                         />
//                     </div>

//                     <button
//                         onClick={exportToExcel}
//                         className="flex items-center gap-2 bg-[#0c555e] hover:bg-[#11717b] text-white px-4 py-2 rounded-lg shadow-md transition-all"
//                     >
//                         <Download className="w-4 h-4" />
//                         Export
//                     </button>
//                 </div>
//             </div>

//             {/* Table Section */}
//             <div className="bg-[#f0e9e9] shadow-lg rounded-md overflow-hidden border border-gray-200">
//                 <div className="overflow-x-auto">
//                     <table className="min-w-full border-collapse">
//                         <thead className="bg-[#0c555e] text-white sticky top-0">
//                             <tr>
//                                 {[
//                                     "SL No",
//                                     "Send Message",
//                                     "Code",
//                                     "Lead person",
//                                     "Date",
//                                     "Time",
//                                     "Client Name",
//                                     "Scope",
//                                     "Starting Time",
//                                     "Phone No.",
//                                     "District",
//                                     "Location",
//                                     "Plot",
//                                     "Project Size",
//                                     "Remarks",
//                                     "Rooms",
//                                     "Budget",
//                                     "Special Notes",
//                                     "Voice recording",
//                                     "Send manually"
//                                 ].filter((item) => item !== "Send manually").map((head) => (
//                                     <th key={head} className="px-4 py-3 border text-nowrap text-left font-medium">
//                                         {head}
//                                     </th>
//                                 ))}
//                             </tr>
//                         </thead>
//                         <tbody>
//                             {/* {currentData?.map((sub, i) => ( */}
//                             {[...currentData]
//                                 .sort((a, b) => a.createdAt.toMillis() - b.createdAt.toMillis()) // oldest first
//                                 .reverse() // newest first
//                                 .map((sub, i) => (
//                                     <tr
//                                         key={sub.id}
//                                         className="border-b hover:bg-gray-50 transition-all text-sm even:bg-gray-50"
//                                     >
//                                         <td className="px-4 py-2">{i + 1}</td>
//                                         <td className="px-4 py-2 text-start text-nowrap">
//                                             {!sub.message_number ? <>
//                                                 <span className="text-[#0c555e] cursor-pointer hover:text-[#11717b] transition-all font-semibold underline text-sm">
//                                                     Nill
//                                                 </span>
//                                             </> :
//                                                 <>
//                                                     {sub.whatsapp_sent ? (
//                                                         <div title={`Delivered message to ${sub.message_number}`} >
//                                                             {/* <div title={`Delivered message to ${sub.message_number} on ${sub.whatsapp_sent_at.toDate().toLocaleString()}`} > */}

//                                                             <span className="text-[#0c555e] cursor-pointer hover:text-[#11717b] transition-all font-semibold underline text-sm">
//                                                                 Delivered
//                                                             </span>
//                                                         </div>
//                                                     ) : (
//                                                         <div title={`Sent message to ${sub.message_number}`} >
//                                                             {
//                                                                 sendLoading === sub.id ?
//                                                                     <button className="text-[#0c555e] cursor-pointer hover:text-[#11717b] transition-all font-semibold underline text-sm">
//                                                                         Sending
//                                                                     </button> :
//                                                                     <button onClick={() => {
//                                                                         if (sub.scope === "Just enguiry" || sub.scope === "Dealers") {
//                                                                             handleSendMessageNoTemplate(sub.client_name, sub.scope, sub.message_number);
//                                                                         } else {
//                                                                             handleSendMessage(sub.id);
//                                                                         }
//                                                                     }}
//                                                                         className="text-[#0c555e] cursor-pointer hover:text-[#11717b] transition-all font-semibold underline text-sm">
//                                                                         Send
//                                                                     </button>
//                                                             }
//                                                         </div>
//                                                     )}
//                                                 </>}
//                                         </td>
//                                         <td className="px-4 py-2">{sub.code}</td>
//                                         <td className="px-4 py-2">{sub.lead_person}</td>
//                                         <td className="px-4 py-2">
//                                             {sub?.createdAt?.toDate().toLocaleString().split(",")[0]}
//                                         </td>
//                                         <td className="px-4 py-2">
//                                             {sub?.createdAt?.toDate().toLocaleString().split(",")[1]}
//                                         </td>
//                                         <td className="px-4 py-2 font-medium text-gray-800">{sub?.client_name}</td>
//                                         <td className="px-4 py-2">{sub?.scope}</td>
//                                         <td className="px-4 py-2">{sub?.starting_time}</td>
//                                         <td className="px-4 py-2">{[sub?.phone_1, sub?.phone_2]?.filter(Boolean)?.join(",")}</td>
//                                         <td className="px-4 py-2">{sub?.district}</td>
//                                         <td className="px-4 py-2">{sub?.location}</td>
//                                         <td className="px-4 py-2">{sub?.plot_size?.join(", ")}</td>
//                                         <td className="px-4 py-2">{sub?.project_size?.join(", ")}</td>
//                                         <td className="px-4 py-2" style={{ minWidth: "250px" }} >{sub?.remarks}</td>
//                                         <td className="px-4 py-2">{sub?.rooms?.join(", ")}</td>
//                                         <td className="px-4 py-2">{sub?.budget}</td>
//                                         <td className="px-4 py-2">{sub?.special_notes?.join(", ")}</td>
//                                         <td className="px-4 py-2">{sub?.voice_recording ? <audio controls src={sub?.voice_recording} className="mt-2 w-full" /> : <span className="text-green-700 font-semibold bg-green-100 px-2 py-1 rounded-full text-xs">
//                                             No Voices
//                                         </span>}</td>

//                                         {user?.role === "marketing" &&
//                                             <td className="px-4 py-2">

//                                                 <button onClick={() => {
//                                                     handleSendMessageNoTemplate(sub.client_name, sub.scope, sub.message_number);
//                                                 }}
//                                                     className="text-[#0c555e] cursor-pointer hover:text-[#11717b] transition-all font-semibold underline text-sm">
//                                                     Send
//                                                 </button>
//                                             </td>
//                                         }
//                                     </tr>
//                                 ))}
//                         </tbody>
//                     </table>
//                     <div className="flex justify-end items-center gap-3 mt-4 mb-4">
//                         <button
//                             disabled={currentPage === 1}
//                             onClick={() => setCurrentPage((p) => p - 1)}
//                             className="px-3 py-1 border rounded disabled:opacity-50"
//                         >
//                             Prev
//                         </button>

//                         <span className="text-sm">
//                             Page {currentPage} of {totalPages}
//                         </span>

//                         <button
//                             disabled={currentPage === totalPages}
//                             onClick={() => setCurrentPage((p) => p + 1)}
//                             className="px-3 py-1 border rounded disabled:opacity-50"
//                         >
//                             Next
//                         </button>
//                     </div>

//                 </div>
//             </div>

//             <div style={{ display: "flex", gap: "10px", justifyContent: "center", padding: "20px 0", alignItems: "center" }} >
//                 <p style={{ fontSize: "12px" }} >Powered by</p>
//                 <div>
//                     <svg width="93" height="25" viewBox="0 0 123 25" fill="none" xmlns="http://www.w3.org/2000/svg">
//                         <path d="M26.0539 13.399C26.9809 13.3986 27.8698 13.0302 28.5253 12.3747C29.1807 11.7192 29.5492 10.8303 29.5496 9.90335V8.73761H31.8811V9.90335C31.8936 10.6682 31.7492 11.4275 31.4567 12.1344C31.1642 12.8412 30.7299 13.4806 30.1806 14.013C29.9854 14.2085 29.7777 14.3913 29.5589 14.5601C29.7757 14.7274 29.9833 14.9064 30.1806 15.0963C30.7305 15.633 31.1647 16.2766 31.4566 16.9873C31.7485 17.6981 31.8919 18.461 31.8779 19.2293V20.3934H29.5465V19.2293C29.5473 18.302 29.1798 17.4124 28.5249 16.756C27.87 16.0996 26.9812 15.7302 26.0539 15.7289H22.5629V20.3919H20.2314V4.08398H22.5629V13.399H26.0539Z" fill="black" />
//                         <path d="M33.0845 6.41351V4.08203H35.4159V6.41351H33.0845ZM35.4159 8.74498V20.3899H33.0845V8.74188L35.4159 8.74498Z" fill="black" />
//                         <path d="M39.9327 15.8664C40.6831 16.6068 41.5106 17.2649 42.4009 17.8295C43.291 17.2669 44.1184 16.6109 44.8692 15.8726C45.1996 15.5531 45.461 15.1692 45.6372 14.7447C45.8134 14.3201 45.9006 13.8639 45.8935 13.4043V8.74139H48.2249V13.4043C48.2364 14.1711 48.0906 14.932 47.7965 15.6401C47.5025 16.3483 47.0664 16.9887 46.5152 17.5217C45.3148 18.7033 43.9232 19.6734 42.3994 20.391C40.8758 19.6723 39.4848 18.7011 38.2851 17.5186C37.7339 16.9856 37.2978 16.3452 37.0037 15.637C36.7097 14.9289 36.5639 14.1679 36.5753 13.4012V8.73828H38.9068V13.4012C38.9004 13.8604 38.9881 14.316 39.1645 14.74C39.3409 15.164 39.6024 15.5473 39.9327 15.8664Z" fill="black" />
//                         <path d="M58.7375 19.2279C57.6859 20.0177 56.3984 20.4292 55.0837 20.3956C53.769 20.3621 52.5042 19.8856 51.4943 19.0433C50.4843 18.201 49.7884 17.0422 49.5194 15.7549C49.2504 14.4676 49.424 13.1272 50.0122 11.9509C50.6003 10.7747 51.5685 9.83149 52.7597 9.27432C53.951 8.71714 55.2955 8.57862 56.5753 8.88119C57.8551 9.18377 58.9953 9.90972 59.8109 10.9414C60.6265 11.973 61.0698 13.2499 61.0689 14.565V20.3874H58.7375V19.2279ZM55.2433 11.0693C54.4341 11.0686 53.6497 11.3485 53.0237 11.8614C52.3978 12.3743 51.9691 13.0884 51.8107 13.882C51.6523 14.6756 51.774 15.4995 52.1551 16.2134C52.5362 16.9273 53.153 17.4869 53.9005 17.7969C54.648 18.1069 55.4799 18.1481 56.2544 17.9135C57.0288 17.6788 57.6979 17.1828 58.1477 16.5101C58.5974 15.8373 58.7999 15.0294 58.7207 14.2241C58.6414 13.4187 58.2854 12.6658 57.7132 12.0936C57.3933 11.7632 57.0091 11.5019 56.5843 11.3258C56.1595 11.1496 55.7031 11.0623 55.2433 11.0693Z" fill="black" />
//                         <path d="M64.6005 14.5666V20.3891H62.269V14.5666C62.2695 13.0225 62.883 11.5418 63.9749 10.45C65.0667 9.35813 66.5474 8.74455 68.0915 8.74414V11.0756C67.1662 11.0773 66.2792 11.4456 65.6248 12.0999C64.9705 12.7543 64.6022 13.6413 64.6005 14.5666Z" fill="black" />
//                         <path d="M79.2252 10.4467C80.1751 11.3995 80.7653 12.6521 80.8953 13.9911C81.0254 15.3302 80.6871 16.673 79.9383 17.7907C79.1894 18.9083 78.0762 19.7319 76.7883 20.1209C75.5004 20.51 74.1175 20.4406 72.875 19.9245C71.6326 19.4083 70.6075 18.4775 69.9744 17.2904C69.3412 16.1033 69.1392 14.7334 69.4027 13.4141C69.6662 12.0948 70.3789 10.9076 71.4194 10.0548C72.46 9.20195 73.764 8.73624 75.1094 8.73695C75.8759 8.72551 76.6365 8.87133 77.3444 9.1654C78.0524 9.45947 78.6925 9.89555 79.2252 10.4467ZM75.1094 11.0684C74.2993 11.0671 73.5137 11.3467 72.8868 11.8598C72.2598 12.3728 71.8302 13.0875 71.6712 13.8818C71.5122 14.6762 71.6337 15.5011 72.0149 16.2159C72.3962 16.9308 73.0136 17.4912 73.7618 17.8017C74.5101 18.1123 75.3429 18.1536 76.1182 17.9188C76.8935 17.6839 77.5634 17.1874 78.0136 16.5138C78.4638 15.8403 78.6664 15.0315 78.5869 14.2253C78.5074 13.419 78.1507 12.6654 77.5776 12.0927C77.2579 11.7627 76.8739 11.5017 76.4494 11.3258C76.0249 11.1499 75.5688 11.0628 75.1094 11.07V11.0684Z" fill="black" />
//                         <path d="M84.4599 20.3857H82.1284V4.08398H84.4599V20.3857Z" fill="black" />
//                         <path d="M94.9754 19.2272C93.9243 20.0161 92.6375 20.4271 91.3237 20.3933C90.0098 20.3595 88.7459 19.8831 87.7367 19.0412C86.7275 18.1993 86.0322 17.0412 85.7634 15.7547C85.4947 14.4682 85.6682 13.1286 86.256 11.9531C86.8438 10.7776 87.8113 9.835 89.0017 9.27809C90.1922 8.72119 91.5358 8.58262 92.8149 8.88484C94.0939 9.18705 95.2334 9.91234 96.0488 10.9432C96.8641 11.974 97.3074 13.2499 97.3068 14.5642V20.3867H94.9754V19.2272ZM91.4813 11.0639C90.6711 11.0625 89.8856 11.3422 89.2586 11.8552C88.6317 12.3683 88.2021 13.0829 88.0431 13.8773C87.8841 14.6717 88.0056 15.4966 88.3868 16.2114C88.7681 16.9262 89.3854 17.4867 90.1337 17.7972C90.882 18.1077 91.7147 18.1491 92.4901 17.9142C93.2654 17.6794 93.9353 17.1828 94.3855 16.5093C94.8357 15.8358 95.0383 15.0269 94.9588 14.2207C94.8793 13.4145 94.5226 12.6608 93.9495 12.0882C93.6294 11.7589 93.2453 11.4985 92.8208 11.3232C92.3963 11.1478 91.9405 11.0612 91.4813 11.0685V11.0639Z" fill="black" />
//                         <path d="M98.502 4.08398H100.833V9.89402C101.885 9.10504 103.171 8.69412 104.485 8.72788C105.799 8.76163 107.063 9.23807 108.072 10.08C109.081 10.9219 109.777 12.08 110.045 13.3665C110.314 14.653 110.141 15.9925 109.553 17.1681C108.965 18.3436 107.998 19.2862 106.807 19.8431C105.617 20.4 104.273 20.5386 102.994 20.2363C101.715 19.9341 100.575 19.2088 99.7601 18.178C98.9447 17.1472 98.5014 15.8713 98.502 14.557V4.08398ZM101.856 12.0949C101.286 12.6661 100.932 13.4171 100.854 14.2201C100.775 15.0231 100.978 15.8284 101.427 16.4988C101.876 17.1693 102.543 17.6634 103.315 17.897C104.088 18.1306 104.917 18.0893 105.662 17.78C106.407 17.4708 107.022 16.9128 107.402 16.201C107.782 15.4893 107.904 14.6678 107.746 13.8766C107.588 13.0853 107.161 12.3733 106.537 11.8616C105.913 11.35 105.131 11.0705 104.324 11.0706C103.865 11.0639 103.409 11.1514 102.984 11.3275C102.56 11.5037 102.176 11.7648 101.856 12.0949Z" fill="black" />
//                         <path d="M114.84 8.74023H122.992V11.0717H114.84C114.531 11.0717 114.234 11.1945 114.015 11.4131C113.797 11.6318 113.674 11.9283 113.674 12.2374C113.674 12.5466 113.797 12.8431 114.015 13.0617C114.234 13.2804 114.531 13.4032 114.84 13.4032H119.503C120.43 13.4032 121.32 13.7716 121.976 14.4275C122.631 15.0834 123 15.9729 123 16.9004C123 17.8279 122.631 18.7175 121.976 19.3733C121.32 20.0292 120.43 20.3976 119.503 20.3976H111.347V18.0661H119.498C119.807 18.0661 120.104 17.9433 120.322 17.7247C120.541 17.5061 120.664 17.2096 120.664 16.9004C120.664 16.5912 120.541 16.2947 120.322 16.0761C120.104 15.8575 119.807 15.7347 119.498 15.7347H114.835C113.908 15.7347 113.018 15.3662 112.362 14.7104C111.706 14.0545 111.338 13.165 111.338 12.2374C111.338 11.3099 111.706 10.4204 112.362 9.76454C113.018 9.10869 113.908 8.74023 114.835 8.74023H114.84Z" fill="black" />
//                         <path d="M4.63497 0L8.64511 4.03034L0.492718 12.1548L8.71817 20.3553L4.60389 24.4681C3.3107 23.2246 1.96155 21.947 0.646594 20.6289C0.167864 20.1455 0 19.4772 0 18.7948C0 14.4292 0 10.0632 0 5.69657C0 5.02977 0.155432 4.36919 0.621727 3.89978C1.93202 2.56773 3.30137 1.28697 4.63497 0Z" fill="#C51F2C" />
//                         <path d="M8.81738 12.2125L12.7389 8.2832C13.5363 9.01684 14.4487 9.68209 15.145 10.537C16.017 11.5908 15.8942 13.1902 14.9787 14.2036C14.3088 14.9434 13.5612 15.6134 12.8726 16.2895L8.81738 12.2125Z" fill="#C51F2C" />
//                     </svg>
//                 </div>
//             </div>
//         </div >
//     );
// };

// export default Submissions;
