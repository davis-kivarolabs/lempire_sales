import { useEffect, useState, useMemo, useRef } from "react";
import { Download, Search, ChevronUp, ChevronDown } from "lucide-react";

// You'll need to import these from your actual project
import { db, storage } from "../firebase";
import { collection, query, where, getDocs, serverTimestamp, doc, updateDoc, arrayUnion } from "firebase/firestore";
import { useUser } from "../context/UserContext";
import axios from "axios";
import VoiceRecorder, { type VoiceRecorderHandle } from "./VoiceRecorder";
import type { VoiceItem } from "../pages/RequirmentsForm";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
// import { useAudioConverter } from "./useAudioConverter";

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
  updatedAt: any;
  lead_person: string;
  requirment_id: string;
  user_id: string[];
  whatsapp_sent: boolean;
  voice_recording: string;
  voice_recordings: string[];
  whatsapp_sent_at: string;
  
  recent_remarks?: string;
  // recent_recordings?: {
  //   url: string;
  //   createdAt: any;
  // }[];
  recent_recordings?: string[];
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


  // const { convertWebmToMp3, loading:convertLoading, progress } = useAudioConverter();

  // const handleConvert = async (webmBlob: Blob) => {
  //   console.log("success start",webmBlob);
  //   const mp3Blob = await convertWebmToMp3(webmBlob);

  //   // upload mp3Blob to Firebase
  //   console.log("success ",mp3Blob);
  // };


  //////////// more details start ////////////
 
  const [openRecentProgress, setOpenRecentProgress] = useState<Submission>()
  const [recentVoices, setRecentVoices] = useState<VoiceItem[]>([]);


const [updateLoading, setUpdateLoading] = useState(false);
const updateRecentProgress = async ( submissionId: string, remarks: string, voices: { blob: Blob; id: string }[], userId: string ) => {
  setUpdateLoading(true);
  console.log("abcd", submissionId, remarks, voices, userId)

  try {
    const uploadedVoiceURLs: string[] = [];

    // upload voices
    for (const voice of voices) {
      const ext = voice.blob.type.includes("mp4") ? "mp4" : "mp3";

      const fileRef = ref(
        storage,
        `submission_voices/${submissionId}/${userId}-${Date.now()}-${voice.id}.${ext}`
      );

      await uploadBytes(fileRef, voice.blob);
      const url = await getDownloadURL(fileRef);

      uploadedVoiceURLs.push(url);
    }

    // update firestore (APPEND, not overwrite)
    const submissionRef = doc(db, "submissions", submissionId);

    await updateDoc(submissionRef, {
      recent_remarks: remarks,
      recent_recordings: arrayUnion(...uploadedVoiceURLs),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Failed to update recent progress:", error);
  } finally {
    setUpdateLoading(false);
    setFormData(prev => ({
    ...prev,
    recent_remarks: ""
    }));
    setIsRemarksEdit(false)
  }
};

  useEffect(() => {
    if(user && !updateLoading){
      fetchSubmissions();
    }
  }, [user, updateLoading]);

  const handleUpdateRecentProgress = async () => {
    if (!openRecentProgress?.id) return;
      if(!formData.recent_remarks && recentVoices.length < 1) return;

    await updateRecentProgress(
      openRecentProgress.id,
      formData.recent_remarks,
      recentVoices,
      user?.user_id || ""
    );

    setRecentVoices([]);
    setOpenRecentProgress(undefined);
  };


  // const [openRecentProgress, setOpenRecentProgress] = useState<Submission>()
  // const [voices, setVoices] = useState<VoiceItem[]>([]);
  
  const recorderRef = useRef<VoiceRecorderHandle | null>(null);

  const [formData, setFormData] = useState({
    recent_remarks: ""
  });


  const clearRecentRemarks = () => {
  setFormData((prev) => ({
      ...prev,
      recent_remarks: "",
    }));
  };


  const handleInputChange = (key: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };
  const [isRemarksEdit, setIsRemarksEdit] = useState(false)
  //////////// more details end //////////////
  
  // if (!user) {
  //   return (
  //     <div className="flex items-center justify-center min-h-screen">
  //       <div className="text-gray-500">Loading user...</div>
  //     </div>
  //   );
  // }

  // if (loading) {
  //   return (
  //     <div className="flex items-center justify-center min-h-screen">
  //       <div className="text-gray-500">Loading submissions...</div>
  //     </div>
  //   );
  // }


  return (
    // <div className="min-h-screen p-4 sm:p-6">
    <div className="min-h-screen">
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
              <select className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-[#0c555e] focus:border-transparent bg-white" value={leadFilter} onChange={(e) => setLeadFilter(e.target.value)} >
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
                      // {
                      //   key: "manual_message",
                      //   label: "Action",
                      //   width: "w-24",
                      //   sortable: false,
                      // },
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
                      {
                        key: "view_more",
                        label: "View more",
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
                  {currentData?.map((sub, i) => {
                    const globalIndex = startIndex + i + 1;
                    
                    const voices = Array.isArray(sub.voice_recordings)
                    ? sub.voice_recordings
                    : sub.voice_recording
                          ? [sub.voice_recording]
                          : [];
                  
                    const savedRecentVoices = Array.isArray(sub.recent_recordings)
                    ? sub.recent_recordings
                    : sub.recent_recordings
                          ? [sub.recent_recordings]
                          : [];

                    console.log("sub: ", submissions.find((item)=>item.id===openRecentProgress?.id), savedRecentVoices);
                    return (
                      <>
                      {/* ////////////// recent progress start ////////////////// */}
                      {openRecentProgress?.id === sub?.id && (
                          <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
                            <div className="relative w-[92%] md:w-[600px] bg-white rounded-2xl shadow-xl flex flex-col max-h-[85dvh]" >

                              {/* ---------- Header ---------- */}
                              <div className="flex items-center justify-between px-6 py-4 border-b">
                                <div>
                                  <h2 className="text-lg font-semibold">Recent Progress</h2>
                                  <p className="text-xs text-gray-500">
                                    {openRecentProgress?.client_name}
                                  </p>
                                  <p className="text-xs text-gray-500" >
                                    Last updated:{" "}
                                    {openRecentProgress?.updatedAt &&
                                      openRecentProgress.updatedAt
                                        .toDate()
                                        .toLocaleDateString("en-US", {
                                          year: "numeric",
                                          month: "long",
                                          day: "numeric",
                                        })}
                                  </p>
                                </div>

                                <button
                                  onClick={() => {
                                    setOpenRecentProgress(undefined)
                                    setIsRemarksEdit(false)
                                    clearRecentRemarks()
                                  }}
                                  className="text-gray-400 hover:text-black text-xl"
                                >
                                  ✕
                                </button>
                              </div>

                              {/* ---------- Body ---------- */}
                              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">

                                {/* Remarks */}
                                 {(sub.recent_remarks && !isRemarksEdit) ? null : <div className="space-y-1">
                                  <label className="text-sm font-medium text-gray-700">Remarks</label>
                                  
                                  <div className="flex gap-2" >
                                    <input
                                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                                      placeholder="Enter remarks"
                                      value={formData.recent_remarks}
                                      onChange={(e) => handleInputChange("recent_remarks", e.target.value) } />
                                    <button className="px-2 border-[1px] rounded-[8px] cursor-pointer" onClick={()=>{
                                      setIsRemarksEdit(false);
                                       clearRecentRemarks()
                                      // setOpenRecentProgress(undefined);
                                    }} >Cancel</button>
                                  </div>
                                
                                </div>}
                                {isRemarksEdit && <div className="flex gap-2" >
                                  <p>{sub.recent_remarks}</p> <button className="px-1 text-[12px] text-[blue] cursor-pointer" onClick={()=>{setIsRemarksEdit(true)
                                    handleInputChange("recent_remarks", sub.recent_remarks || "")
                                  }} >Edit</button>
                                </div>}

                                {/* Local Recordings */}
                                {recentVoices.length > 0 && (
                                  <div className="space-y-2" >
                                    <h4 className="text-sm font-semibold text-gray-700">New Recordings</h4>

                                    {recentVoices.map((voice) => (
                                      <div
                                        key={voice.id}
                                        className="flex items-center gap-3 bg-gray-100 rounded-lg p-3"
                                      >
                                        <audio controls src={voice.localUrl} className="flex-1" />

                                        <button
                                          onClick={() =>
                                            setRecentVoices((prev) =>
                                              prev.filter((v) => v.id !== voice.id)
                                            )
                                          }
                                          className="text-red-500 text-xs hover:underline" >
                                          Delete
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Saved Recordings */}
                                <div className="space-y-2">
                                  <h4 className="text-sm font-semibold text-gray-700">Saved Recordings</h4>

                                  {savedRecentVoices.length > 0 ? (
                                    <div className="space-y-2">
                                      {savedRecentVoices.map((url, i) => (
                                        <audio
                                          key={i}
                                          controls
                                          src={url}
                                          className="w-full"
                                        />
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-xs text-gray-400">No audio available</p>
                                  )}
                                </div>

                                {/* Recorder */}
                                <div>
                                  <VoiceRecorder
                                    ref={recorderRef}
                                    onRecordingComplete={(blob, localUrl) => {
                                      setRecentVoices((prev) => [
                                        ...prev,
                                        {
                                          id: crypto.randomUUID(),
                                          blob,
                                          localUrl,
                                        },
                                      ]);
                                    }}
                                  />
                                </div>
                              </div>

                              {/* ---------- Footer ---------- */}
                              <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end gap-3">
                                <button
                                  // disabled={!formData.recent_remarks || recentVoices.length < 1}
                                  onClick={() => {
                                    setOpenRecentProgress(undefined)
                                    setRecentVoices([])
                                    setIsRemarksEdit(false)
                                    clearRecentRemarks()
                                  }} className="px-4 py-2 text-sm rounded-lg border hover:bg-gray-100" >Cancel</button>

                                {/* <button disabled={!formData.recent_remarks || recentVoices.length > 0} onClick={handleUpdateRecentProgress} className="px-4 py-2 text-sm rounded-lg bg-black text-white hover:bg-gray-900" > */}
                                <button onClick={handleUpdateRecentProgress} className="px-4 py-2 text-sm rounded-lg bg-black text-white hover:bg-gray-900" >
                                  {updateLoading ? "Updating" : "Update Progress"}
                                </button>
                              </div>
                            </div>
                          </div>
                      )}
                      {/* ////////////// recent progress end //////////////////// */}
                     {loading ? 
                     <div className="flex items-center justify-center min-h-screen">
                      <div className="text-gray-500">Loading submissions...</div>
                     </div>
                     : <tr key={sub.id} className="hover:bg-gray-50 transition-colors" >

                        {/* Action */}
                        {user?.role === "marketing" && (
                          <td className="px-4 py-3 whitespace-nowrap">
                            <button
                              onClick={() =>
                                handleNewYearSendMessage(sub.message_number)
                              }
                              className="text-[#0c555e] hover:text-[#094449] font-medium text-sm underline">Send</button>
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
                       {voices.length > 0 ? (
                          voices.map((url, i) => (
                            // <audio key={i} controls src={url} className="h-8 w-full" />
                             <audio
                             key={i}
                              controls
                              src={url}
                              className="h-8"
                            />
                          ))
                        ) : (
                          <span className="text-gray-400 text-xs">No Audio</span>
                        )}
                          {/* {sub.voice_recording ? (
                            <audio
                              controls
                              src={sub.voice_recording}
                              // src={sub.voice_recording}
                              className="h-8"
                            />
                          ) : (
                            <span className="text-gray-400 text-xs bg-gray-50 px-2 py-1 rounded">
                              No Audio
                            </span>
                          )} */}
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
                     
                        {/* View more */}
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                            <span className="inline-flex items-center px-2 cursor-pointer" onClick={ ()=> setOpenRecentProgress(sub) } >
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M2.89899 12.7346C2.80091 12.5052 2.75 12.2542 2.75 12C2.75 11.7458 2.80091 11.4948 2.89899 11.2654C3.70725 9.34502 4.99868 7.72989 6.61515 6.61781C8.23161 5.50574 10.1029 4.945 12 5.00426C13.8971 4.945 15.7684 5.50574 17.3849 6.61781C19.0013 7.72989 20.2928 9.34502 21.101 11.2654C21.1991 11.4948 21.25 11.7458 21.25 12C21.25 12.2542 21.1991 12.5052 21.101 12.7346C20.2928 14.655 19.0013 16.2701 17.3849 17.3822C15.7684 18.4943 13.8971 19.055 12 18.9957C10.1029 19.055 8.23161 18.4943 6.61515 17.3822C4.99868 16.2701 3.70725 14.655 2.89899 12.7346Z" stroke={`${ (sub.recent_remarks || sub?.recent_recordings?.length && sub?.recent_recordings?.length > 0) ? "blue" : "currentColor" }`} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M12 15.5C13.933 15.5 15.5 13.933 15.5 12C15.5 10.067 13.933 8.5 12 8.5C10.067 8.5 8.5 10.067 8.5 12C8.5 13.933 10.067 15.5 12 15.5Z" stroke={`${ (sub.recent_remarks || sub?.recent_recordings?.length && sub?.recent_recordings?.length > 0) ? "blue" : "currentColor" }`} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </span>
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
                      }
                      </>
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
                <button disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}
                  className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" >Previous</button>

                <div className="flex gap-1">
                  {getPageNumbers().map((page, index) =>
                    page === "..." ? (
                      <span key={`dots-${index}`} className="px-3 py-2 text-gray-500" >...</span>
                    ) : (
                      <button key={page} onClick={() => setCurrentPage(page as number)} className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
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

// {/* ////////////// recent progress start ////////////////// */}
// {openRecentProgress?.id === sub?.id && (
//   <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
//     <div className="relative w-[92%] md:w-[600px] bg-white rounded-2xl shadow-xl flex flex-col max-h-[85dvh]">

//       {/* ---------- Header ---------- */}
//       <div className="flex items-center justify-between px-6 py-4 border-b">
//         <div>
//           <h2 className="text-lg font-semibold">Recent Progress</h2>
//           <p className="text-xs text-gray-500">
//             {openRecentProgress?.client_name}
//           </p>
//         </div>

//         <button
//           onClick={() => setOpenRecentProgress(null)}
//           className="text-gray-400 hover:text-black text-xl"
//         >
//           ✕
//         </button>
//       </div>

//       {/* ---------- Body ---------- */}
//       <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">

//         {/* Remarks */}
//         <div className="space-y-1">
//           <label className="text-sm font-medium text-gray-700">
//             Remarks
//           </label>
//           <input
//             className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
//             placeholder="Enter remarks"
//             value={formData.recent_remarks}
//             onChange={(e) =>
//               handleInputChange("recent_remarks", e.target.value)
//             }
//           />
//         </div>

//         {/* Local Recordings */}
//         {recentVoices.length > 0 && (
//           <div className="space-y-2">
//             <h4 className="text-sm font-semibold text-gray-700">
//               New Recordings
//             </h4>

//             {recentVoices.map((voice) => (
//               <div
//                 key={voice.id}
//                 className="flex items-center gap-3 bg-gray-100 rounded-lg p-3"
//               >
//                 <audio controls src={voice.localUrl} className="flex-1" />

//                 <button
//                   onClick={() =>
//                     setRecentVoices((prev) =>
//                       prev.filter((v) => v.id !== voice.id)
//                     )
//                   }
//                   className="text-red-500 text-xs hover:underline"
//                 >
//                   Delete
//                 </button>
//               </div>
//             ))}
//           </div>
//         )}

//         {/* Saved Recordings */}
//         <div className="space-y-2">
//           <h4 className="text-sm font-semibold text-gray-700">
//             Saved Recordings
//           </h4>

//           {recentVoicess.length > 0 ? (
//             <div className="space-y-2">
//               {recentVoicess.map((url, i) => (
//                 <audio
//                   key={i}
//                   controls
//                   src={url}
//                   className="w-full"
//                 />
//               ))}
//             </div>
//           ) : (
//             <p className="text-xs text-gray-400">No audio available</p>
//           )}
//         </div>

//         {/* Recorder */}
//         <div>
//           <VoiceRecorder
//             ref={recorderRef}
//             onRecordingComplete={(blob, localUrl) => {
//               setRecentVoices((prev) => [
//                 ...prev,
//                 {
//                   id: crypto.randomUUID(),
//                   blob,
//                   localUrl,
//                 },
//               ]);
//             }}
//           />
//         </div>
//       </div>

//       {/* ---------- Footer ---------- */}
//       <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end gap-3">
//         <button
//           onClick={() => setOpenRecentProgress(null)}
//           className="px-4 py-2 text-sm rounded-lg border hover:bg-gray-100"
//         >
//           Cancel
//         </button>

//         <button
//           onClick={handleUpdateRecentProgress}
//           className="px-4 py-2 text-sm rounded-lg bg-black text-white hover:bg-gray-900"
//         >
//           Update Progress
//         </button>
//       </div>
//     </div>
//   </div>
// )}
// {/* ////////////// recent progress end ////////////////// */}