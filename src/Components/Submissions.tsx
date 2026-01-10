import { useEffect, useState, useMemo } from "react";
import { Download, Search, ChevronUp, ChevronDown } from "lucide-react";

// You'll need to import these from your actual project
import { db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useUser } from "../context/UserContext";
import axios from "axios";

// // Temporary mock imports for demonstration
// const db = null;
// const useUser = () => ({ user: { user_id: "user123", role: "marketing" } });

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

  console.log("user, submissions: ", user, submissions);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [leadFilter, setLeadFilter] = useState("all");
  const [expoLocationsFilter, setExpoLocationsFilter] = useState("all");
  const [sortColumn, setSortColumn] = useState("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [sendLoading, setSendLoading] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch submissions from Firebase
  const fetchSubmissions = async () => {
    if (!user) return;

    setLoading(true);

    try {
      // Uncomment when you connect to Firebase

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

      // Remove this mock data when Firebase is connected
      console.log("data", data);
      // setSubmissions([]);
    } catch (error) {
      console.error("Error fetching submissions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [user]);

  const searchInSubmission = (sub: any, term: string) => {
    const t = term.toLowerCase();
    return Object.values(sub).some((val) => {
      if (!val) return false;
      if (Array.isArray(val)) return val.join(" ").toLowerCase().includes(t);
      if (typeof val === "string") return val.toLowerCase().includes(t);
      if (typeof val === "number") return val.toString().includes(t);
      return false;
    });
  };

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

  const totalPages = Math.ceil(sortedSubmissions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = sortedSubmissions.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, leadFilter, expoLocationsFilter]);

  const uniqueLeads = [...new Set(submissions.map((s) => s.lead_person))];
  const expoLocations = [...new Set(submissions.map((s) => s.expo_location))];

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const siblingCount = 1;
    const start = Math.max(2, currentPage - siblingCount);
    const end = Math.min(totalPages - 1, currentPage + siblingCount);

    pages.push(1);
    if (start > 2) pages.push("...");
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    if (end < totalPages - 1) pages.push("...");
    if (totalPages > 1) pages.push(totalPages);

    return pages;
  };

  // WhatsApp handlers
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
L'empire Builders
+91 97784 11620
+91 97784 11609`;
    } else {
      message = `Hi ${name},
Thank you for visiting our stall at the Malayala Manorama Vanitha Veedu Exhibition! 🏠

We've noted your requirement regarding ${scope}.
Our technical team will connect with you shortly.

Warm regards,
L'empire Builders
+91 97784 11620
+91 97784 11609`;
    }

    window.open(
      `https://wa.me/${number}?text=${encodeURIComponent(message)}`,
      "_blank"
    );
  };

  const handleNewYearSendMessage = (number: string) => {
    if (user?.role !== "marketing") return;

    const desktopUrl = `whatsapp://send?phone=${number}`;
    const webUrl = `https://wa.me/${number}`;

    window.location.href = desktopUrl;

    setTimeout(() => {
      window.open(webUrl, "_blank");
    }, 800);
  };

  const handleSendMessage = async (docId: string) => {
    if (user?.role !== "marketing") return;

    setSendLoading(docId);

    try {
      // Uncomment when ready to use

      await axios.post(
        "https://asia-south1-vanitha-veed.cloudfunctions.net/sendWhatsAppMessage",
        { docId }
      );

      alert("WhatsApp message sent manually");
      await fetchSubmissions(); // Refresh data
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message");
    } finally {
      setSendLoading("");
    }
  };

  const exportToExcel = async () => {
    if (!sortedSubmissions.length) return;

    try {
      // Uncomment when you add XLSX library

      const XLSX = await import("xlsx");

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

      console.log("Export would happen here");
      alert("Export feature - Add XLSX library to enable");
    } catch (error) {
      console.error("Error exporting:", error);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading user...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading submissions...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <div className="max-w-[1600px] mx-auto">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0c555e]">
              Your Submissions
              <span className="ml-3 text-sm font-normal text-gray-500">
                ({sortedSubmissions.length} results)
              </span>
            </h2>

            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="search"
                  placeholder="Search anything..."
                  className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-[#0c555e] focus:border-transparent transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Filters */}
              <select
                className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-[#0c555e] focus:border-transparent bg-white"
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

              <select
                className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-[#0c555e] focus:border-transparent bg-white"
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

              <button
                onClick={exportToExcel}
                className="flex items-center justify-center gap-2 bg-[#0c555e] hover:bg-[#094449] text-white px-4 py-2 rounded-lg shadow-sm transition-colors font-medium"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-[#0c555e] sticky top-0 z-10">
                  <tr>
                    {[
                      {
                        key: "manual_message",
                        label: "Action",
                        width: "w-24",
                        sortable: false,
                      },
                      {
                        key: "sl",
                        label: "SL",
                        width: "w-16",
                        sortable: false,
                      },
                      {
                        key: "code",
                        label: "Code",
                        width: "w-28",
                        sortable: true,
                      },
                      {
                        key: "expo_location",
                        label: "Expo",
                        width: "w-32",
                        sortable: true,
                      },
                      {
                        key: "lead_person",
                        label: "Lead",
                        width: "w-32",
                        sortable: true,
                      },
                      {
                        key: "createdAt",
                        label: "Date",
                        width: "w-28",
                        sortable: true,
                      },
                      {
                        key: "createdAt_time",
                        label: "Time",
                        width: "w-24",
                        sortable: false,
                      },
                      {
                        key: "client_name",
                        label: "Client",
                        width: "w-40",
                        sortable: true,
                      },
                      {
                        key: "scope",
                        label: "Scope",
                        width: "w-36",
                        sortable: true,
                      },
                      {
                        key: "starting_time",
                        label: "Start Time",
                        width: "w-28",
                        sortable: true,
                      },
                      {
                        key: "phone_1",
                        label: "Phone",
                        width: "w-40",
                        sortable: true,
                      },
                      {
                        key: "district",
                        label: "District",
                        width: "w-32",
                        sortable: true,
                      },
                      {
                        key: "location",
                        label: "Location",
                        width: "w-36",
                        sortable: true,
                      },
                      {
                        key: "plot_size",
                        label: "Plot Size",
                        width: "w-32",
                        sortable: false,
                      },
                      {
                        key: "project_size",
                        label: "Project",
                        width: "w-32",
                        sortable: false,
                      },
                      {
                        key: "remarks",
                        label: "Remarks",
                        width: "w-64",
                        sortable: false,
                      },
                      {
                        key: "rooms",
                        label: "Rooms",
                        width: "w-28",
                        sortable: false,
                      },
                      {
                        key: "budget",
                        label: "Budget",
                        width: "w-32",
                        sortable: true,
                      },
                      {
                        key: "special_notes",
                        label: "Notes",
                        width: "w-48",
                        sortable: false,
                      },
                      {
                        key: "voice_recording",
                        label: "Audio",
                        width: "w-48",
                        sortable: false,
                      },
                      {
                        key: "whatsapp_sent",
                        label: "Status",
                        width: "w-28",
                        sortable: true,
                      },
                      ...(user?.role === "marketing"
                        ? [
                            {
                              key: "send",
                              label: "Send",
                              width: "w-24",
                              sortable: false,
                            },
                          ]
                        : []),
                    ].map((col) => (
                      <th
                        key={col.label}
                        className={`${
                          col.width
                        } px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider ${
                          col.sortable
                            ? "cursor-pointer select-none hover:bg-[#094449]"
                            : ""
                        }`}
                        onClick={() => col.sortable && handleSort(col.key)}
                      >
                        <div className="flex items-center gap-2 whitespace-nowrap">
                          {col.label}
                          {col.sortable &&
                            sortColumn === col.key &&
                            (sortDirection === "asc" ? (
                              <ChevronUp className="w-3 h-3" />
                            ) : (
                              <ChevronDown className="w-3 h-3" />
                            ))}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-200">
                  {currentData.map((sub, i) => {
                    const globalIndex = startIndex + i + 1;

                    console.log("voice: ",sub.lead_person, sub.voice_recording);
                    return (
                      <tr
                        key={sub.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        {/* Action */}
                        {user?.role === "marketing" && (
                          <td className="px-4 py-3 whitespace-nowrap">
                            <button
                              onClick={() =>
                                handleNewYearSendMessage(sub.message_number)
                              }
                              className="text-[#0c555e] hover:text-[#094449] font-medium text-sm underline"
                            >
                              Send
                            </button>
                          </td>
                        )}

                        {/* SL No */}
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-medium">
                          {globalIndex}
                        </td>

                        {/* Code */}
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">
                            {sub.code}
                          </span>
                        </td>

                        {/* Expo Location */}
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                          {sub.expo_location}
                        </td>

                        {/* Lead Person */}
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                          {sub.lead_person}
                        </td>

                        {/* Date */}
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                          {sub.createdAt?.toDate?.().toLocaleDateString() ||
                            "N/A"}
                        </td>

                        {/* Time */}
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                          {sub.createdAt?.toDate?.().toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          }) || "N/A"}
                        </td>

                        {/* Client Name */}
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {sub.client_name}
                        </td>

                        {/* Scope */}
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              sub.scope === "Construction"
                                ? "bg-blue-100 text-blue-800"
                                : sub.scope === "Just enquiry"
                                ? "bg-gray-100 text-gray-800"
                                : sub.scope === "Dealers"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {sub.scope}
                          </span>
                        </td>

                        {/* Starting Time */}
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                          {sub.starting_time}
                        </td>

                        {/* Phone */}
                        <td className="px-4 py-3 text-sm text-gray-700">
                          <div className="flex flex-col gap-1">
                            <span className="font-mono text-xs">
                              {sub.phone_1}
                            </span>
                            {sub.phone_2 && (
                              <span className="font-mono text-xs text-gray-500">
                                {sub.phone_2}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* District */}
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                          {sub.district}
                        </td>

                        {/* Location */}
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                          {sub.location}
                        </td>

                        {/* Plot Size */}
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                          {sub.plot_size?.join(", ")}
                        </td>

                        {/* Project Size */}
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                          {sub.project_size?.join(", ")}
                        </td>

                        {/* Remarks */}
                        <td className="px-4 py-3 text-sm text-gray-700">
                          <div className="max-w-xs overflow-hidden text-ellipsis">
                            {sub.remarks}
                          </div>
                        </td>

                        {/* Rooms */}
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                          {sub.rooms?.join(", ")}
                        </td>

                        {/* Budget */}
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          {sub.budget}
                        </td>

                        {/* Special Notes */}
                        <td className="px-4 py-3 text-sm text-gray-700">
                          <div className="flex flex-wrap gap-1">
                            {sub.special_notes?.map((note, idx) => (
                              <span
                                key={idx}
                                className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-xs"
                              >
                                {note}
                              </span>
                            ))}
                          </div>
                        </td>

                        {/* Voice Recording */}
                        <td className="px-4 py-3">
                          {sub.voice_recording ? (
                            <audio
                              controls
                              src={sub.voice_recording}
                              className="h-8"
                            />
                          ) : (
                            <span className="text-gray-400 text-xs bg-gray-50 px-2 py-1 rounded">
                              No Audio
                            </span>
                          )}
                        </td>

                        {/* WhatsApp Status */}
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          {sub.whatsapp_sent ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Delivered
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Pending
                            </span>
                          )}
                        </td>

                        {/* Send Manually */}
                        {user?.role === "marketing" && (
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            {sendLoading === sub.id ? (
                              <span className="text-blue-600 font-medium text-xs">
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
                                className="text-[#0c555e] hover:text-[#094449] font-medium underline text-sm"
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
            </div>
          </div>

          {/* Pagination */}
          <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{startIndex + 1}</span> to{" "}
                <span className="font-medium">
                  {Math.min(
                    startIndex + itemsPerPage,
                    sortedSubmissions.length
                  )}
                </span>{" "}
                of{" "}
                <span className="font-medium">{sortedSubmissions.length}</span>{" "}
                results
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>

                <div className="flex gap-1">
                  {getPageNumbers().map((page, index) =>
                    page === "..." ? (
                      <span
                        key={`dots-${index}`}
                        className="px-3 py-2 text-gray-500"
                      >
                        ...
                      </span>
                    ) : (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page as number)}
                        className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                          currentPage === page
                            ? "bg-[#0c555e] text-white"
                            : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    )
                  )}
                </div>

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Submissions;

// import { useEffect, useState, useMemo } from "react";
// import { db } from "../firebase";
// import { collection, query, where, getDocs } from "firebase/firestore";
// import * as XLSX from "xlsx";
// import { useUser } from "../context/UserContext";
// import { Download, Search } from "lucide-react";
// import axios from "axios";

// // --------------------------------------------
// // Types
// // --------------------------------------------
// interface Submission {
//   id: string;
//   client_name: string;
//   scope: string;
//   starting_time: string;
//   phone_1: string;
//   phone_2: string;
//   message_number: string;
//   district: string;
//   location: string;
//   plot_ownership: string;
//   plot_size: string[];
//   project_size: string[];
//   rooms: string[];
//   budget: string;
//   code: string;
//   expo_location: string;
//   remarks: string;
//   special_notes: string[];
//   createdAt: any;
//   lead_person: string;
//   requirment_id: string;
//   user_id: string[];
//   whatsapp_sent: boolean;
//   voice_recording: string;
//   whatsapp_sent_at: string;
// }

// const Submissions = () => {
//   const { user } = useUser();

//   const [submissions, setSubmissions] = useState<Submission[]>([]);
//   const [loading, setLoading] = useState(true);

//   const [searchTerm, setSearchTerm] = useState("");
//   const [leadFilter, setLeadFilter] = useState("all");
//   const [expoLocationsFilter, setExpoLocationsFilter] = useState("all");

//   const [sortColumn, setSortColumn] = useState("createdAt");
//   const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

//   const [sendLoading, setSendLoading] = useState("");

//   const itemsPerPage = 10;
//   const [currentPage, setCurrentPage] = useState(1);

//   // ------------------------------------------------
//   // Fetch Submissions
//   // ------------------------------------------------
//   const fetchSubmissions = async () => {
//     if (!user) return;

//     setLoading(true);

//     try {
//       let q;
//       if (
//         user.role === "admin" ||
//         user.role === "marketing" ||
//         user.role === "sales"
//       ) {
//         q = query(collection(db, "submissions"));
//       } else {
//         q = query(
//           collection(db, "submissions"),
//           where("user_id", "==", user.user_id)
//         );
//       }

//       const snapshot = await getDocs(q);

//       const data: Submission[] = snapshot.docs.map((doc) => ({
//         id: doc.id,
//         ...doc.data(),
//       })) as Submission[];

//       setSubmissions(data);
//     } catch (error) {
//       console.error("Error fetching submissions:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchSubmissions();
//   }, [user]);

//   // ------------------------------------------------
//   // Universal Search Function
//   // ------------------------------------------------
//   const searchInSubmission = (sub: Submission, term: string) => {
//     const t = term.toLowerCase();

//     return Object.values(sub).some((val) => {
//       if (!val) return false;
//       if (Array.isArray(val)) return val.join(" ").toLowerCase().includes(t);
//       if (typeof val === "string") return val.toLowerCase().includes(t);
//       if (typeof val === "number") return val.toString().includes(t);
//       return false;
//     });
//   };

//   // ------------------------------------------------
//   // Apply Lead Filter + Search
//   // ------------------------------------------------
//   const filteredSubmissions = useMemo(() => {
//     let data = [...submissions];

//     if (leadFilter !== "all") {
//       data = data.filter((sub) => sub.lead_person === leadFilter);
//     }

//     if (expoLocationsFilter !== "all") {
//       data = data.filter((sub) => sub.expo_location === expoLocationsFilter);
//     }

//     if (searchTerm.trim() !== "") {
//       data = data.filter((sub) => searchInSubmission(sub, searchTerm));
//     }

//     return data;
//   }, [submissions, leadFilter, expoLocationsFilter, searchTerm]);

//   // ------------------------------------------------
//   // Sorting
//   // ------------------------------------------------
//   const sortedSubmissions = useMemo(() => {
//     return [...filteredSubmissions].sort((a, b) => {
//       let valA: any = a[sortColumn as keyof Submission];
//       let valB: any = b[sortColumn as keyof Submission];

//       if (sortColumn === "createdAt") {
//         valA = a.createdAt?.toMillis?.() || 0;
//         valB = b.createdAt?.toMillis?.() || 0;
//       }

//       if (typeof valA === "string") valA = valA.toLowerCase();
//       if (typeof valB === "string") valB = valB.toLowerCase();

//       if (valA < valB) return sortDirection === "asc" ? -1 : 1;
//       if (valA > valB) return sortDirection === "asc" ? 1 : -1;
//       return 0;
//     });
//   }, [filteredSubmissions, sortColumn, sortDirection]);

//   const handleSort = (column: string) => {
//     if (sortColumn === column) {
//       setSortDirection(sortDirection === "asc" ? "desc" : "asc");
//     } else {
//       setSortColumn(column);
//       setSortDirection("asc");
//     }
//   };

//   // ------------------------------------------------
//   // Pagination
//   // ------------------------------------------------
//   const totalPages = Math.ceil(sortedSubmissions.length / itemsPerPage);

//   const startIndex = (currentPage - 1) * itemsPerPage;
//   const currentData = sortedSubmissions.slice(
//     startIndex,
//     startIndex + itemsPerPage
//   );

//   useEffect(() => {
//     setCurrentPage(1);
//   }, [searchTerm, leadFilter]);

//   // ------------------------------------------------
//   // Excel Export
//   // ------------------------------------------------
//   const exportToExcel = () => {
//     if (!sortedSubmissions.length) return;

//     const exportData = sortedSubmissions.map((sub, i) => ({
//       "SL No": i + 1,
//       Code: sub.code,
//       "Lead Person": sub.lead_person,
//       Date: sub.createdAt?.toDate?.().toLocaleDateString() || "",
//       Time: sub.createdAt?.toDate?.().toLocaleTimeString() || "",
//       "Client Name": sub.client_name,
//       Scope: sub.scope,
//       "Starting Time": sub.starting_time,
//       "Phone No": [sub.phone_1, sub.phone_2].filter(Boolean).join(" / "),
//       District: sub.district,
//       Location: sub.location,
//       "Plot Size": sub.plot_size?.join(", "),
//       "Project Size": sub.project_size?.join(", "),
//       Remarks: sub.remarks,
//       Rooms: sub.rooms?.join(", "),
//       Budget: sub.budget,
//       "Special Notes": sub.special_notes?.join(", "),
//       "Send Message": sub.whatsapp_sent ? "Delivered" : "Pending",
//     }));

//     const ws = XLSX.utils.json_to_sheet(exportData);
//     const wb = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(wb, ws, "Submissions");
//     XLSX.writeFile(wb, "submissions.xlsx");
//   };

//   // ------------------------------------------------
//   // WhatsApp Message Handlers
//   // ------------------------------------------------
//   const handleSendMessageNoTemplate = (
//     name: string,
//     scope: string,
//     number: string
//   ) => {
//     if (user?.role !== "marketing") return;

//     const lower = scope.toLowerCase();

//     let message = "";

//     if (lower === "just enquiry" || lower === "dealers") {
//       message = `Hi ${name},
// Thank you for visiting our stall at the Malayala Manorama Vanitha Veedu Exhibition! 🏠

// It was a pleasure connecting with you. We appreciate your interest in Lempire Builders.

// Warm regards,
// L’empire Builders
// +91 97784 11620
// +91 97784 11609`;
//     } else {
//       message = `Hi ${name},
// Thank you for visiting our stall at the Malayala Manorama Vanitha Veedu Exhibition! 🏠

// We've noted your requirement regarding ${scope}.
// Our technical team will connect with you shortly.

// Warm regards,
// L’empire Builders
// +91 97784 11620
// +91 97784 11609`;
//     }

//     window.open(
//       `https://wa.me/${number}?text=${encodeURIComponent(message)}`,
//       "_blank"
//     );
//   };

//   //////////////////////
//   //   const handleNewYearSendMessage = (number: string) => {
//   //     if (user?.role !== "marketing") return;

//   //     // const lower = scope.toLowerCase();

//   //     const message = "";

//   //     window.open(
//   //       `https://wa.me/${number}?text=${encodeURIComponent(message)}`,
//   //       "_blank"
//   //     );
//   //   };

//   const handleNewYearSendMessage = (number: string) => {
//     if (user?.role !== "marketing") return;

//     console.log("No. ", number);

//     const desktopUrl = `whatsapp://send?phone=${number}`;

//     const webUrl = `https://wa.me/${number}`;

//     window.location.href = desktopUrl;

//     setTimeout(() => {
//       window.open(webUrl, "_blank");
//     }, 800);
//   };

//   //////////////////////

//   const handleSendMessage = async (docId: string) => {
//     if (user?.role !== "marketing") return;

//     setSendLoading(docId);

//     await axios.post(
//       "https://asia-south1-vanitha-veed.cloudfunctions.net/sendWhatsAppMessage",
//       { docId }
//     );

//     alert("WhatsApp message sent manually");
//     setSendLoading("");
//   };

//   // ------------------------------------------------
//   // Render
//   // ------------------------------------------------
//   if (!user)
//     return <p className="mt-10 text-center text-gray-500">Loading user...</p>;
//   if (loading)
//     return (
//       <p className="mt-10 text-center text-gray-500">Loading submissions...</p>
//     );

//   // Collect unique lead persons
//   const uniqueLeads = [...new Set(submissions.map((s) => s.lead_person))];
//   const expoLocations = [...new Set(submissions.map((s) => s.expo_location))];

//   const getPageNumbers = () => {
//     const pages: (number | string)[] = [];
//     const siblingCount = 2;

//     const start = Math.max(2, currentPage - siblingCount);
//     const end = Math.min(totalPages - 1, currentPage + siblingCount);

//     // First page
//     pages.push(1);

//     // Left ellipsis
//     if (start > 2) {
//       pages.push("...");
//     }

//     // Middle pages
//     for (let i = start; i <= end; i++) {
//       pages.push(i);
//     }

//     // Right ellipsis
//     if (end < totalPages - 1) {
//       pages.push("...");
//     }

//     // Last page
//     if (totalPages > 1) {
//       pages.push(totalPages);
//     }

//     return pages;
//   };

//   return (
//     <div className="py-6 mx-auto">
//       {/* Header Section */}
//       <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
//         <h2 className="text-3xl font-semibold text-[#0c555e]">
//           Your Submissions
//         </h2>

//         <div className="flex flex-wrap gap-3 items-center">
//           {/* Search */}
//           <div className="relative">
//             <Search className="absolute left-3 top-3.5 text-gray-400 w-4 h-4" />
//             <input
//               type="search"
//               placeholder="Search anything..."
//               className="pl-9 pr-3 py-2 border rounded-md shadow-sm w-60 focus:ring-2 focus:ring-[#0c555e]"
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//             />
//           </div>

//           {/* Lead Filter Dropdown */}
//           <select
//             className="border px-3 py-2 rounded-md shadow-sm"
//             value={leadFilter}
//             onChange={(e) => setLeadFilter(e.target.value)}
//           >
//             <option value="all">All Leads</option>
//             {uniqueLeads.map((lead) => (
//               <option key={lead} value={lead}>
//                 {lead}
//               </option>
//             ))}
//           </select>

//           {/* Expo locations Filter Dropdown */}
//           <select
//             className="border px-3 py-2 rounded-md shadow-sm"
//             value={expoLocationsFilter}
//             onChange={(e) => setExpoLocationsFilter(e.target.value)}
//           >
//             <option value="all">All Expo</option>
//             {expoLocations.map((expo) => (
//               <option key={expo} value={expo}>
//                 {expo}
//               </option>
//             ))}
//           </select>

//           {/* Export Button */}
//           <button
//             onClick={exportToExcel}
//             className="flex items-center gap-2 bg-[#0c555e] hover:bg-[#11717b] text-white px-4 py-2 rounded-lg"
//           >
//             <Download className="w-4 h-4" />
//             Export
//           </button>
//         </div>
//       </div>

//       {/* Table */}
//       <div className="bg-white border shadow-lg rounded-md overflow-hidden">
//         <div className="overflow-x-auto">
//           <table className="min-w-full border-collapse">
//             {/* Table Head */}
//             <thead className="bg-[#0c555e] text-white sticky top-0 text-sm">
//               <tr>
//                 {[
//                   { key: "manual_message", label: "Manual Message" },
//                   { key: "sl", label: "SL No" },
//                   { key: "scope", label: "Scope" },
//                   { key: "code", label: "Code" },
//                   { key: "expo_location", label: "Expo Location" },
//                   { key: "lead_person", label: "Lead Person" },
//                   { key: "createdAt", label: "Date" },
//                   { key: "createdAt", label: "Time" },
//                   { key: "client_name", label: "Client Name" },
//                   { key: "starting_time", label: "Starting Time" },
//                   { key: "phone_1", label: "Phone No" },
//                   { key: "district", label: "District" },
//                   { key: "location", label: "Location" },
//                   { key: "plot_size", label: "Plot Size" },
//                   { key: "project_size", label: "Project Size" },
//                   { key: "remarks", label: "Remarks" },
//                   { key: "rooms", label: "Rooms" },
//                   { key: "budget", label: "Budget" },
//                   { key: "special_notes", label: "Special Notes" },
//                   { key: "voice_recording", label: "Voice Recording" },
//                   { key: "whatsapp_sent", label: "Send Message" },
//                   ...(user?.role === "marketing"
//                     ? [{ key: "send", label: "Send Manually" }]
//                     : []),
//                 ].map((col) => (
//                   <th
//                     key={col.label}
//                     className="px-4 py-3 border cursor-pointer select-none"
//                     onClick={() =>
//                       col.key !== "sl" &&
//                       col.key !== "send" &&
//                       handleSort(col.key)
//                     }
//                   >
//                     <div className="flex items-center gap-1">
//                       {col.label}
//                       {sortColumn === col.key && (
//                         <span className="text-xs">
//                           {sortDirection === "asc" ? "▲" : "▼"}
//                         </span>
//                       )}
//                     </div>
//                   </th>
//                 ))}
//               </tr>
//             </thead>

//             {/* Table Body */}
//             <tbody className="text-sm">
//               {currentData.map((sub, i) => {
//                 const globalIndex = startIndex + i + 1;

//                 return (
//                   <tr key={sub.id} className="border-b hover:bg-gray-50">
//                     {user?.role === "marketing" && (
//                       <td className="px-4 py-2 text-nowrap">
//                         <button
//                           onClick={() =>
//                             handleNewYearSendMessage(sub.message_number)
//                           }
//                           className="text-[#0c555e] underline font-semibold hover:text-[#11717b]"
//                         >
//                           Send
//                         </button>
//                       </td>
//                     )}
//                     {/* SL NO */}
//                     <td className="px-4 py-2 text-nowrap">{globalIndex}</td>
//                     <td className="px-4 py-2 text-nowrap">{sub.scope}</td>

//                     <td className="px-4 py-2 text-nowrap">{sub.code}</td>
//                     <td className="px-4 py-2 text-nowrap">
//                       {sub.expo_location}
//                     </td>
//                     <td className="px-4 py-2 text-nowrap">{sub.lead_person}</td>

//                     <td className="px-4 py-2 text-nowrap">
//                       {sub.createdAt?.toDate().toLocaleDateString()}
//                     </td>
//                     <td className="px-4 py-2 text-nowrap">
//                       {sub.createdAt?.toDate().toLocaleTimeString()}
//                     </td>

//                     <td className="px-4 py-2 font-semibold">
//                       {sub.client_name}
//                     </td>
//                     {/* <td className="px-4 py-2 text-nowrap">{sub.scope}</td> */}
//                     <td className="px-4 py-2 text-nowrap">
//                       {sub.starting_time}
//                     </td>
//                     <td className="px-4 py-2 text-nowrap">
//                       {[sub.phone_1, sub.phone_2].filter(Boolean).join(", ")}
//                     </td>
//                     <td className="px-4 py-2 text-nowrap">{sub.district}</td>
//                     <td className="px-4 py-2 text-nowrap">{sub.location}</td>
//                     <td className="px-4 py-2 text-nowrap">
//                       {sub.plot_size?.join(", ")}
//                     </td>
//                     <td className="px-4 py-2 text-nowrap">
//                       {sub.project_size?.join(", ")}
//                     </td>
//                     <td className="px-4 py-2 text-nowrap">{sub.remarks}</td>
//                     <td className="px-4 py-2 text-nowrap">
//                       {sub.rooms?.join(", ")}
//                     </td>
//                     <td className="px-4 py-2 text-nowrap">{sub.budget}</td>
//                     <td className="px-4 py-2 text-nowrap">
//                       {sub.special_notes?.join(", ")}
//                     </td>

//                     <td className="px-4 py-2 text-nowrap">
//                       {sub.voice_recording ? (
//                         <audio
//                           controls
//                           src={sub.voice_recording}
//                           className="w-full"
//                         />
//                       ) : (
//                         <span className="text-gray-600 text-xs bg-gray-100 px-2 py-1 rounded-full">
//                           No Audio
//                         </span>
//                       )}
//                     </td>
//                     {/* Send Message Column */}
//                     <td className="px-4 py-2 text-nowrap">
//                       {sub.whatsapp_sent ? (
//                         <span className="text-green-600 font-semibold">
//                           Delivered
//                         </span>
//                       ) : (
//                         <span className="text-red-600 font-semibold">
//                           Pending
//                         </span>
//                       )}
//                     </td>
//                     {/* Marketing Manual Send */}
//                     {user?.role === "marketing" && (
//                       <td className="px-4 py-2 text-nowrap">
//                         {sendLoading === sub.id ? (
//                           <span className="text-blue-600 font-medium">
//                             Sending...
//                           </span>
//                         ) : (
//                           <button
//                             onClick={() =>
//                               sub.scope === "Just enquiry" ||
//                               sub.scope === "Dealers"
//                                 ? handleSendMessageNoTemplate(
//                                     sub.client_name,
//                                     sub.scope,
//                                     sub.message_number
//                                   )
//                                 : handleSendMessage(sub.id)
//                             }
//                             className="text-[#0c555e] underline font-semibold hover:text-[#11717b]"
//                           >
//                             Send
//                           </button>
//                         )}
//                       </td>
//                     )}
//                   </tr>
//                 );
//               })}
//             </tbody>
//           </table>

//           {/* Pagination */}
//           <div className="flex justify-end items-center gap-2 mt-4 mb-4">
//             <button
//               disabled={currentPage === 1}
//               onClick={() => setCurrentPage((p) => p - 1)}
//               className="px-3 py-1 border rounded disabled:opacity-50"
//             >
//               Prev
//             </button>

//             {getPageNumbers().map((page, index) =>
//               page === "..." ? (
//                 <span key={`dots-${index}`} className="px-2 text-gray-500">
//                   ...
//                 </span>
//               ) : (
//                 <button
//                   key={page}
//                   onClick={() => setCurrentPage(page)}
//                   className={`px-3 py-1 border rounded
//           ${currentPage === page ? "bg-black text-white" : ""}`}
//                 >
//                   {page}
//                 </button>
//               )
//             )}

//             <button
//               disabled={currentPage === totalPages}
//               onClick={() => setCurrentPage((p) => p + 1)}
//               className="px-3 py-1 border rounded disabled:opacity-50"
//             >
//               Next
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Submissions;
