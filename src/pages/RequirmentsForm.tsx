// src/components/RequirmentsForm.tsx
import { useEffect, useState } from "react";
import CreatableSelect from "react-select/creatable";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import {
    // colourOptions,
    districts,
    plotSize,
    projectSize,
    rooms,
    scopeOptions,
    specialNotes,
    startingTime,
} from "../data";
import { useUser } from "../context/UserContext";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import "./pages.scss";
import VoiceRecorder from "../Components/VoiceRecorder";
// import VoiceRecorder from "../Components/VoiceRecorder";

const RequirmentsForm = () => {
    const { user } = useUser();

    const [formData, setFormData] = useState({
        client_name: "",
        scope: [] as string[],
        starting_time: "",
        phone_1: "",
        phone_2: "",
        message_number: "",
        district: "",
        location: "",
        // plot_ownership: "",
        plot_size: [] as string[],
        project_size: [] as string[],
        rooms: [] as string[],
        budget: "",
        remarks: "",
        special_notes: [] as string[],
        // color: [] as string[],
    });

    // Track selected plot radio to allow unselect
    const [selectedPlot, setSelectedPlot] = useState<string | null>(null);

    const handleSelectChange = (key: string, value: any) => {
        setFormData((prev) => ({
            ...prev,
            [key]: value.map((v: any) => v.value),
        }));
    };

    const handleInputChange = (key: string, value: string) => {
        // If message_number is manually edited, unselect phone pick
        if (key === "message_number") {
            setFormData((prev) => ({
                ...prev,
                [key]: value,
            }));
        } else {
            setFormData((prev) => ({
                ...prev,
                [key]: value,
            }));
        }
    };

    const generateCode = () => {
        const date = new Date().getTime().toString().slice(-3);
        const rand = Math.floor(10 + Math.random() * 90);
        return date + rand;
    };

    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Inside RequirmentsForm component (bottom part)
    const [voiceUrl, setVoiceUrl] = useState<string | null>(null);

    const handleSubmit = async () => {
        if (!user || user.role === "marketing") return;

        setErrorMessage(null);
        setSuccessMessage(null);

        const { client_name, special_notes, scope, phone_1, message_number } = formData;

        if (!client_name.trim()) return setErrorMessage("Please enter the client name.");
        if (!Array.isArray(scope) || scope.length === 0)
            return setErrorMessage("Please select at least one scope.");
        if (!phone_1.trim() && !message_number.trim())
            return setErrorMessage("Please enter at least one contact number.");
        if (!Array.isArray(special_notes) || special_notes.length === 0)
            return setErrorMessage("Please add at least one special note.");

        try {
            const submission = {
                requirment_id: "",
                user_id: user.user_id,
                code: generateCode(),
                lead_person: user.username,
                plot_ownership: selectedPlot,
                voice_recording: voiceUrl || "",
                ...formData,
                createdAt: serverTimestamp(),
            };

            await addDoc(collection(db, "submissions"), submission);
            setSuccessMessage("Submitted successfully!");
            setErrorMessage(null);
            setFormData({
                client_name: "",
                special_notes: [],
                scope: [],
                starting_time: "",
                phone_1: "",
                phone_2: "",
                message_number: "",
                district: "",
                location: "",
                plot_size: [],
                project_size: [],
                rooms: [],
                budget: "",
                remarks: "",
            });
            setSelectedPlot(null);
            setVoiceUrl(null);
        } catch (err) {
            console.error("Error saving submission:", err);
            setErrorMessage("Error saving submission. Please try again.");
        }
    };


    // const handleSubmit = async () => {
    //     if (!user || user.role === "marketing") return;

    //     setErrorMessage(null);
    //     setSuccessMessage(null);

    //     const { client_name, special_notes, scope, phone_1, message_number } = formData;


    //     if (!client_name.trim()) {
    //         setErrorMessage("Please enter the client name.");
    //         return;
    //     }

    //     if (!Array.isArray(scope) || scope.length === 0) {
    //         setErrorMessage("Please select at least one scope.");
    //         return;
    //     }

    //     if (!phone_1.trim() && !message_number.trim()) {
    //         setErrorMessage("Please enter at least one contact number.");
    //         return;
    //     }

    //     if (!Array.isArray(special_notes) || special_notes.length === 0) {
    //         setErrorMessage("Please add at least one special note.");
    //         return;
    //     }

    //     try {
    //         const submission = {
    //             requirment_id: "",
    //             user_id: user.user_id,
    //             code: generateCode(),
    //             lead_person: user.username,
    //             plot_ownership: selectedPlot,
    //             ...formData,
    //             createdAt: serverTimestamp(),
    //         };

    //         await addDoc(collection(db, "submissions"), submission);

    //         setSuccessMessage("Submitted successfully!");
    //         setErrorMessage(null);

    //         // Reset form
    //         setFormData({
    //             client_name: "",
    //             special_notes: [],
    //             scope: [],
    //             starting_time: "",
    //             phone_1: "",
    //             phone_2: "",
    //             message_number: "",
    //             district: "",
    //             location: "",
    //             plot_size: [],
    //             project_size: [],
    //             rooms: [],
    //             budget: "",
    //             remarks: "",
    //         });
    //         setSelectedPlot(null);
    //     } catch (err) {
    //         console.error("Error saving submission:", err);
    //         setErrorMessage("Error saving submission. Please try again.");
    //     }
    // };

    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => setSuccessMessage(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [successMessage]);


    if (!user) return <p>Loading user...</p>;

    return (
        <div className="requirments_form" >
            {/* <VoiceRecorder /> */}

            {/* Name of the client */}
            <div className="field">
                <label>Name of the client</label>
                <input
                    className="input_field"
                    placeholder="Enter client name"
                    value={formData.client_name}
                    onChange={(e) => handleInputChange("client_name", e.target.value)}
                />
            </div>

            {/* Scope */}
            <div className="field">
                <label>Scope</label>
                <CreatableSelect
                    classNamePrefix="mySelect"

                    isMulti
                    options={scopeOptions}
                    onChange={(val) => handleSelectChange("scope", val)}
                />
            </div>

            {/* Starting Time */}
            <div className="field">
                <label>Starting time</label>
                <CreatableSelect
                    classNamePrefix="mySelect"

                    options={startingTime}
                    onChange={(val) =>
                        handleInputChange("starting_time", (val as any)?.value || "")
                    }
                />
            </div>

            {/* Phone 1 */}
            <div className="field">
                <label>Phone 1 ( +91 )</label>
                <div className="input_field" style={{ padding: 0, width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", }} >
                    <div style={{ flex: 1 }}>
                        <PhoneInput country={"in"}
                            onlyCountries={["in"]}
                            disableDropdown={true}
                            value={formData.phone_1} onChange={(value) => handleInputChange("phone_1", value)} inputStyle={{ width: "100%", height: "54px", borderRadius: "8px", border: "none", backgroundColor: "#f8f9fa", fontSize: "16px", }} buttonStyle={{ border: "none", background: "transparent" }} containerStyle={{ width: "100%", height: "100%" }} />
                    </div>

                    {formData.phone_1 && (
                        <svg className="use_whatsapp" onClick={() => handleInputChange("message_number", formData.phone_1)} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"
                            style={{
                                cursor: "pointer",
                                marginLeft: "10px",
                                flexShrink: 0,
                            }}>
                            <path d="M13.794 2.64211C18.4738 3.54213 21.6541 7.59589 21.4944 12.4154C21.3471 16.8586 17.7516 20.7326 13.2237 21.2879C11.377 21.5144 9.60007 21.2244 7.90605 20.428C7.66372 20.3141 7.32659 20.2837 7.06513 20.3463C5.70967 20.6713 4.3647 21.0396 3.01554 21.3908C2.86769 21.4292 2.71639 21.4546 2.49994 21.5C2.90494 20.0176 3.2833 18.5957 3.687 17.1809C3.78951 16.8216 3.76123 16.5357 3.59593 16.1846C2.02128 12.8397 2.15842 9.55847 4.30357 6.52539C6.45517 3.48319 9.49066 2.18524 13.2242 2.5641C13.4 2.58194 13.575 2.607 13.794 2.64211ZM19.7077 13.6464C19.9763 12.5498 20.0073 11.4386 19.746 10.3479C18.958 7.05999 16.9122 4.92897 13.5864 4.25547C10.3227 3.59454 7.58328 4.6955 5.65032 7.3928C3.71351 10.0955 3.67173 12.9931 5.26967 15.8962C5.47512 16.2694 5.5303 16.5754 5.4053 16.9745C5.17734 17.7024 4.99961 18.4458 4.77698 19.2716C5.70162 19.032 6.51288 18.8013 7.33537 18.6217C7.56778 18.571 7.87291 18.5975 8.07733 18.71C12.7725 21.2951 18.3536 18.9105 19.7077 13.6464Z" fill={formData.phone_1 === formData.message_number ? "green" : "currentColor"} />
                            <path d="M9.74474 8.15751C9.92352 8.58485 10.0448 8.9983 10.2547 9.36088C10.5546 9.87907 10.4636 10.314 10.0498 10.6789C9.60462 11.0714 9.67141 11.404 9.99003 11.8535C10.7246 12.8898 11.6476 13.6672 12.813 14.1762C13.1332 14.316 13.3755 14.34 13.5839 14.0191C13.6695 13.8873 13.7893 13.7781 13.8886 13.6546C14.4722 12.9285 14.2887 12.9353 15.2132 13.3365C15.5042 13.4628 15.7945 13.5983 16.064 13.7637C16.3331 13.9289 16.7431 14.0994 16.7961 14.3338C16.9136 14.8538 16.748 15.3824 16.3145 15.7682C15.5147 16.4798 14.5934 16.5979 13.5887 16.3205C11.4151 15.7203 9.74304 14.4156 8.46205 12.6104C8.00962 11.9728 7.60569 11.2663 7.35233 10.5321C7.04391 9.63836 7.26143 8.77578 7.89825 8.01877C8.27281 7.57351 8.72855 7.47407 9.22289 7.59284C9.42189 7.64065 9.56064 7.93744 9.74474 8.15751Z" fill={formData.phone_1 === formData.message_number ? "green" : "currentColor"} />
                        </svg>
                    )}
                </div>
            </div>

            {/* Phone 2 */}
            <div className="field" >
                <label>Phone 2 ( All )</label>
                <div className="input_field" style={{ padding: 0, width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "space-between" }} >
                    <div style={{ flex: 1 }}>
                        <PhoneInput country={"in"} value={formData.phone_2} onChange={(value) => handleInputChange("phone_2", value)} inputStyle={{ width: "100%", height: "54px", borderRadius: "8px", border: "none", backgroundColor: "#f8f9fa", fontSize: "16px", }}
                            buttonStyle={{ border: "none", background: "transparent" }}
                            containerStyle={{ width: "100%", height: "100%" }} />
                    </div>

                    {formData.phone_2 && (
                        <svg className="use_whatsapp" onClick={() => handleInputChange("message_number", formData.phone_2)} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"
                            style={{
                                cursor: "pointer",
                                marginLeft: "10px",
                                flexShrink: 0,
                            }}>
                            <path d="M13.794 2.64211C18.4738 3.54213 21.6541 7.59589 21.4944 12.4154C21.3471 16.8586 17.7516 20.7326 13.2237 21.2879C11.377 21.5144 9.60007 21.2244 7.90605 20.428C7.66372 20.3141 7.32659 20.2837 7.06513 20.3463C5.70967 20.6713 4.3647 21.0396 3.01554 21.3908C2.86769 21.4292 2.71639 21.4546 2.49994 21.5C2.90494 20.0176 3.2833 18.5957 3.687 17.1809C3.78951 16.8216 3.76123 16.5357 3.59593 16.1846C2.02128 12.8397 2.15842 9.55847 4.30357 6.52539C6.45517 3.48319 9.49066 2.18524 13.2242 2.5641C13.4 2.58194 13.575 2.607 13.794 2.64211ZM19.7077 13.6464C19.9763 12.5498 20.0073 11.4386 19.746 10.3479C18.958 7.05999 16.9122 4.92897 13.5864 4.25547C10.3227 3.59454 7.58328 4.6955 5.65032 7.3928C3.71351 10.0955 3.67173 12.9931 5.26967 15.8962C5.47512 16.2694 5.5303 16.5754 5.4053 16.9745C5.17734 17.7024 4.99961 18.4458 4.77698 19.2716C5.70162 19.032 6.51288 18.8013 7.33537 18.6217C7.56778 18.571 7.87291 18.5975 8.07733 18.71C12.7725 21.2951 18.3536 18.9105 19.7077 13.6464Z" fill={formData.phone_2 === formData.message_number ? "green" : "currentColor"} />
                            <path d="M9.74474 8.15751C9.92352 8.58485 10.0448 8.9983 10.2547 9.36088C10.5546 9.87907 10.4636 10.314 10.0498 10.6789C9.60462 11.0714 9.67141 11.404 9.99003 11.8535C10.7246 12.8898 11.6476 13.6672 12.813 14.1762C13.1332 14.316 13.3755 14.34 13.5839 14.0191C13.6695 13.8873 13.7893 13.7781 13.8886 13.6546C14.4722 12.9285 14.2887 12.9353 15.2132 13.3365C15.5042 13.4628 15.7945 13.5983 16.064 13.7637C16.3331 13.9289 16.7431 14.0994 16.7961 14.3338C16.9136 14.8538 16.748 15.3824 16.3145 15.7682C15.5147 16.4798 14.5934 16.5979 13.5887 16.3205C11.4151 15.7203 9.74304 14.4156 8.46205 12.6104C8.00962 11.9728 7.60569 11.2663 7.35233 10.5321C7.04391 9.63836 7.26143 8.77578 7.89825 8.01877C8.27281 7.57351 8.72855 7.47407 9.22289 7.59284C9.42189 7.64065 9.56064 7.93744 9.74474 8.15751Z" fill={formData.phone_2 === formData.message_number ? "green" : "currentColor"} />
                        </svg>
                    )}
                </div>
            </div>

            {/* WhatsApp Number */}
            <div className="field" >
                <label>WhatsApp Number</label>
                <div className="input_field" style={{ padding: 0, width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "space-between" }} >
                    <div style={{ flex: 1 }}>
                        <PhoneInput country={"in"} value={formData.message_number} onChange={(value) => handleInputChange("message_number", value)} inputStyle={{
                            width: "100%", height: "54px", borderRadius: "8px", border: "none", backgroundColor: "#f8f9fa", fontSize: "16px",
                        }}
                            buttonStyle={{ border: "none", background: "transparent" }}
                            containerStyle={{ width: "100%", height: "100%" }} />
                    </div>
                </div>
            </div>

            {/* District */}
            <div className="field">
                <label>District</label>
                <CreatableSelect
                    classNamePrefix="mySelect"

                    options={districts}
                    onChange={(val) =>
                        handleInputChange("district", (val as any)?.value || "")
                    }
                />
            </div>

            {/* Location */}
            <div className="field">
                <label>Your Location</label>
                <input
                    className="input_field"
                    placeholder="Enter location"
                    value={formData.location}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                />
            </div>

            {/* Plot Ownership */}
            <div className="field">
                <label>Plot Ownership</label>
                <div className="plot_size_radios">
                    {["Own a plot", "Looking for a plot"].map((val) => (
                        <div
                            key={val}
                            className={`plot_option ${selectedPlot === val ? "active" : ""}`}
                            onClick={() =>
                                setSelectedPlot(selectedPlot === val ? null : val)
                            }
                            style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
                        >
                            <input
                                type="radio"
                                name="plot"
                                checked={selectedPlot === val}
                                readOnly
                            />
                            <label>{val}</label>
                        </div>
                    ))}
                </div>

            </div>

            {/* Plot Size */}
            <div className="field">
                <label>Plot Size</label>
                <CreatableSelect
                    classNamePrefix="mySelect"

                    isMulti
                    options={plotSize}
                    onChange={(val) => handleSelectChange("plot_size", val)}
                />
            </div>

            {/* Project Size */}
            <div className="field">
                <label>Project Size</label>
                <CreatableSelect
                    classNamePrefix="mySelect"

                    isMulti
                    options={projectSize}
                    onChange={(val) => handleSelectChange("project_size", val)}
                />
            </div>

            {/* Rooms */}
            <div className="field">
                <label>Rooms</label>
                <CreatableSelect
                    classNamePrefix="mySelect"

                    isMulti
                    options={rooms}
                    onChange={(val) => handleSelectChange("rooms", val)}
                />
            </div>

            {/* Budget */}
            <div className="field">
                <label>Budget</label>
                <input
                    className="input_field"
                    placeholder="Enter Budget"
                    value={formData.budget}
                    onChange={(e) => handleInputChange("budget", e.target.value)}
                />
            </div>

            {/* Remarks */}
            <div className="field">
                <label>Remarks</label>
                <input
                    className="input_field"
                    placeholder="Enter Remarks"
                    value={formData.remarks}
                    onChange={(e) => handleInputChange("remarks", e.target.value)}
                />
            </div>

            {/* Special Notes */}
            <div className="field">
                <label>Special Notes</label>
                <CreatableSelect
                    classNamePrefix="mySelect"

                    isMulti
                    options={specialNotes}
                    onChange={(val) => handleSelectChange("special_notes", val)}
                />
            </div>

            <VoiceRecorder onUploadComplete={(url) => setVoiceUrl(url)} />

            {errorMessage && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-md mb-4">
                    {errorMessage}
                </div>
            )}

            {successMessage && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded-md mb-4">
                    {successMessage}
                </div>
            )}

            <button onClick={handleSubmit} className={`btn ${user.role === "marketing" ? "disabled" : ""}`}>
                Submit
            </button>
        </div>
    );
};

export default RequirmentsForm;