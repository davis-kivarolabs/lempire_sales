// src/components/RequirmentsForm.tsx
import { useEffect, useRef, useState } from "react";
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
import { db, storage } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import "./pages.scss";
import VoiceRecorder, { type VoiceRecorderHandle } from "../Components/VoiceRecorder";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
// import VoiceRecorder from "../Components/VoiceRecorder";

const RequirmentsForm = () => {
    const { user } = useUser();

    const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null);
    const [voiceUrl, setVoiceUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);

    console.log(voiceUrl)

    const [formData, setFormData] = useState({
        client_name: "",
        scope: "",
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


    const handleSubmit = async () => {
        // if (!user || user.role === "marketing" || uploading || submitLoading) return;
        if (!user || uploading || submitLoading) return;
        setErrorMessage(null);
        setSuccessMessage(null);

        if (recorderRef.current) {
            recorderRef.current.stopRecordingManually();
        }


        const { client_name, special_notes, scope, phone_1, message_number } = formData;

        if (!client_name.trim()) return setErrorMessage("Please enter the client name.");
        if (!scope.trim())
            // if (!Array.isArray(scope) || scope.length === 0)
            return setErrorMessage("Please select at least one scope.");
        if (!phone_1.trim() && !message_number.trim())
            return setErrorMessage("Please enter at least one contact number.");
        if (!Array.isArray(special_notes) || special_notes.length === 0)
            return setErrorMessage("Please add at least one special note.");

        let uploadedVoiceURL = "";

        setSubmitLoading(true)
        try {
            if (voiceBlob && user) {
                setUploading(true);
                const fileName = `recordings/${user.user_id}-${Date.now()}.webm`;
                const fileRef = ref(storage, fileName);
                await uploadBytes(fileRef, voiceBlob);
                uploadedVoiceURL = await getDownloadURL(fileRef);
                setVoiceUrl(uploadedVoiceURL);
                setUploading(false);
            }

            const submission = {
                requirment_id: "",
                user_id: user.user_id,
                code: generateCode(),
                lead_person: user.username,
                plot_ownership: selectedPlot,
                voice_recording: uploadedVoiceURL || "",
                ...formData,
                createdAt: serverTimestamp(),
            };

            await addDoc(collection(db, "submissions"), submission);
            setSuccessMessage("Submitted successfully!");
            setFormData({
                client_name: "",
                special_notes: [],
                scope: "",
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
            setVoiceBlob(null);
            setVoiceUrl(null);
            setSubmitLoading(false)
        } catch (err) {
            console.error("Error saving submission:", err);
            setErrorMessage("Error saving submission. Please try again.");
            setUploading(false);
            setSubmitLoading(false)
        }
    };

    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => setSuccessMessage(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [successMessage]);

    const recorderRef = useRef<VoiceRecorderHandle | null>(null);

    if (!user) return <p>Loading user...</p>;

    return (
        <>
            <div className="requirments_form" >

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

                        // isMulti
                        options={scopeOptions}
                        value={scopeOptions.find((opt) => opt.value === formData.scope) || null}
                        onChange={(val) => handleInputChange("scope", (val as any)?.value || "")}
                    />
                </div>

                {/* Starting Time */}
                <div className="field">
                    <label>Starting time</label>
                    <CreatableSelect
                        classNamePrefix="mySelect"

                        options={startingTime}
                        value={startingTime.find((opt) => opt.value === formData.starting_time) || null}
                        onChange={(val) => handleInputChange("starting_time", (val as any)?.value || "")}
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
                        value={formData.plot_size.map((r) => ({ label: r, value: r }))}
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
                        value={formData.project_size.map((r) => ({ label: r, value: r }))}
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
                        value={formData.rooms.map((r) => ({ label: r, value: r }))}
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
                        value={formData.special_notes.map((r) => ({ label: r, value: r }))}
                        onChange={(val) => handleSelectChange("special_notes", val)}
                    />
                </div>

                <VoiceRecorder
                    ref={recorderRef}
                    onRecordingComplete={(blob) => setVoiceBlob(blob)}
                />
                {/* <VoiceRecorder onRecordingComplete={(blob) => setVoiceBlob(blob)} /> */}

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

                <button onClick={handleSubmit} className={`btn ${(uploading || submitLoading) ? "disabled" : ""}`}>
                    {(uploading || submitLoading) ? "Submiting" : "Submit"}
                </button>

            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "center", padding: "20px 0", alignItems: "center" }} >
                <p style={{ fontSize: "12px" }} >Powered by</p>
                <div>
                    <svg width="93" height="25" viewBox="0 0 123 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M26.0539 13.399C26.9809 13.3986 27.8698 13.0302 28.5253 12.3747C29.1807 11.7192 29.5492 10.8303 29.5496 9.90335V8.73761H31.8811V9.90335C31.8936 10.6682 31.7492 11.4275 31.4567 12.1344C31.1642 12.8412 30.7299 13.4806 30.1806 14.013C29.9854 14.2085 29.7777 14.3913 29.5589 14.5601C29.7757 14.7274 29.9833 14.9064 30.1806 15.0963C30.7305 15.633 31.1647 16.2766 31.4566 16.9873C31.7485 17.6981 31.8919 18.461 31.8779 19.2293V20.3934H29.5465V19.2293C29.5473 18.302 29.1798 17.4124 28.5249 16.756C27.87 16.0996 26.9812 15.7302 26.0539 15.7289H22.5629V20.3919H20.2314V4.08398H22.5629V13.399H26.0539Z" fill="black" />
                        <path d="M33.0845 6.41351V4.08203H35.4159V6.41351H33.0845ZM35.4159 8.74498V20.3899H33.0845V8.74188L35.4159 8.74498Z" fill="black" />
                        <path d="M39.9327 15.8664C40.6831 16.6068 41.5106 17.2649 42.4009 17.8295C43.291 17.2669 44.1184 16.6109 44.8692 15.8726C45.1996 15.5531 45.461 15.1692 45.6372 14.7447C45.8134 14.3201 45.9006 13.8639 45.8935 13.4043V8.74139H48.2249V13.4043C48.2364 14.1711 48.0906 14.932 47.7965 15.6401C47.5025 16.3483 47.0664 16.9887 46.5152 17.5217C45.3148 18.7033 43.9232 19.6734 42.3994 20.391C40.8758 19.6723 39.4848 18.7011 38.2851 17.5186C37.7339 16.9856 37.2978 16.3452 37.0037 15.637C36.7097 14.9289 36.5639 14.1679 36.5753 13.4012V8.73828H38.9068V13.4012C38.9004 13.8604 38.9881 14.316 39.1645 14.74C39.3409 15.164 39.6024 15.5473 39.9327 15.8664Z" fill="black" />
                        <path d="M58.7375 19.2279C57.6859 20.0177 56.3984 20.4292 55.0837 20.3956C53.769 20.3621 52.5042 19.8856 51.4943 19.0433C50.4843 18.201 49.7884 17.0422 49.5194 15.7549C49.2504 14.4676 49.424 13.1272 50.0122 11.9509C50.6003 10.7747 51.5685 9.83149 52.7597 9.27432C53.951 8.71714 55.2955 8.57862 56.5753 8.88119C57.8551 9.18377 58.9953 9.90972 59.8109 10.9414C60.6265 11.973 61.0698 13.2499 61.0689 14.565V20.3874H58.7375V19.2279ZM55.2433 11.0693C54.4341 11.0686 53.6497 11.3485 53.0237 11.8614C52.3978 12.3743 51.9691 13.0884 51.8107 13.882C51.6523 14.6756 51.774 15.4995 52.1551 16.2134C52.5362 16.9273 53.153 17.4869 53.9005 17.7969C54.648 18.1069 55.4799 18.1481 56.2544 17.9135C57.0288 17.6788 57.6979 17.1828 58.1477 16.5101C58.5974 15.8373 58.7999 15.0294 58.7207 14.2241C58.6414 13.4187 58.2854 12.6658 57.7132 12.0936C57.3933 11.7632 57.0091 11.5019 56.5843 11.3258C56.1595 11.1496 55.7031 11.0623 55.2433 11.0693Z" fill="black" />
                        <path d="M64.6005 14.5666V20.3891H62.269V14.5666C62.2695 13.0225 62.883 11.5418 63.9749 10.45C65.0667 9.35813 66.5474 8.74455 68.0915 8.74414V11.0756C67.1662 11.0773 66.2792 11.4456 65.6248 12.0999C64.9705 12.7543 64.6022 13.6413 64.6005 14.5666Z" fill="black" />
                        <path d="M79.2252 10.4467C80.1751 11.3995 80.7653 12.6521 80.8953 13.9911C81.0254 15.3302 80.6871 16.673 79.9383 17.7907C79.1894 18.9083 78.0762 19.7319 76.7883 20.1209C75.5004 20.51 74.1175 20.4406 72.875 19.9245C71.6326 19.4083 70.6075 18.4775 69.9744 17.2904C69.3412 16.1033 69.1392 14.7334 69.4027 13.4141C69.6662 12.0948 70.3789 10.9076 71.4194 10.0548C72.46 9.20195 73.764 8.73624 75.1094 8.73695C75.8759 8.72551 76.6365 8.87133 77.3444 9.1654C78.0524 9.45947 78.6925 9.89555 79.2252 10.4467ZM75.1094 11.0684C74.2993 11.0671 73.5137 11.3467 72.8868 11.8598C72.2598 12.3728 71.8302 13.0875 71.6712 13.8818C71.5122 14.6762 71.6337 15.5011 72.0149 16.2159C72.3962 16.9308 73.0136 17.4912 73.7618 17.8017C74.5101 18.1123 75.3429 18.1536 76.1182 17.9188C76.8935 17.6839 77.5634 17.1874 78.0136 16.5138C78.4638 15.8403 78.6664 15.0315 78.5869 14.2253C78.5074 13.419 78.1507 12.6654 77.5776 12.0927C77.2579 11.7627 76.8739 11.5017 76.4494 11.3258C76.0249 11.1499 75.5688 11.0628 75.1094 11.07V11.0684Z" fill="black" />
                        <path d="M84.4599 20.3857H82.1284V4.08398H84.4599V20.3857Z" fill="black" />
                        <path d="M94.9754 19.2272C93.9243 20.0161 92.6375 20.4271 91.3237 20.3933C90.0098 20.3595 88.7459 19.8831 87.7367 19.0412C86.7275 18.1993 86.0322 17.0412 85.7634 15.7547C85.4947 14.4682 85.6682 13.1286 86.256 11.9531C86.8438 10.7776 87.8113 9.835 89.0017 9.27809C90.1922 8.72119 91.5358 8.58262 92.8149 8.88484C94.0939 9.18705 95.2334 9.91234 96.0488 10.9432C96.8641 11.974 97.3074 13.2499 97.3068 14.5642V20.3867H94.9754V19.2272ZM91.4813 11.0639C90.6711 11.0625 89.8856 11.3422 89.2586 11.8552C88.6317 12.3683 88.2021 13.0829 88.0431 13.8773C87.8841 14.6717 88.0056 15.4966 88.3868 16.2114C88.7681 16.9262 89.3854 17.4867 90.1337 17.7972C90.882 18.1077 91.7147 18.1491 92.4901 17.9142C93.2654 17.6794 93.9353 17.1828 94.3855 16.5093C94.8357 15.8358 95.0383 15.0269 94.9588 14.2207C94.8793 13.4145 94.5226 12.6608 93.9495 12.0882C93.6294 11.7589 93.2453 11.4985 92.8208 11.3232C92.3963 11.1478 91.9405 11.0612 91.4813 11.0685V11.0639Z" fill="black" />
                        <path d="M98.502 4.08398H100.833V9.89402C101.885 9.10504 103.171 8.69412 104.485 8.72788C105.799 8.76163 107.063 9.23807 108.072 10.08C109.081 10.9219 109.777 12.08 110.045 13.3665C110.314 14.653 110.141 15.9925 109.553 17.1681C108.965 18.3436 107.998 19.2862 106.807 19.8431C105.617 20.4 104.273 20.5386 102.994 20.2363C101.715 19.9341 100.575 19.2088 99.7601 18.178C98.9447 17.1472 98.5014 15.8713 98.502 14.557V4.08398ZM101.856 12.0949C101.286 12.6661 100.932 13.4171 100.854 14.2201C100.775 15.0231 100.978 15.8284 101.427 16.4988C101.876 17.1693 102.543 17.6634 103.315 17.897C104.088 18.1306 104.917 18.0893 105.662 17.78C106.407 17.4708 107.022 16.9128 107.402 16.201C107.782 15.4893 107.904 14.6678 107.746 13.8766C107.588 13.0853 107.161 12.3733 106.537 11.8616C105.913 11.35 105.131 11.0705 104.324 11.0706C103.865 11.0639 103.409 11.1514 102.984 11.3275C102.56 11.5037 102.176 11.7648 101.856 12.0949Z" fill="black" />
                        <path d="M114.84 8.74023H122.992V11.0717H114.84C114.531 11.0717 114.234 11.1945 114.015 11.4131C113.797 11.6318 113.674 11.9283 113.674 12.2374C113.674 12.5466 113.797 12.8431 114.015 13.0617C114.234 13.2804 114.531 13.4032 114.84 13.4032H119.503C120.43 13.4032 121.32 13.7716 121.976 14.4275C122.631 15.0834 123 15.9729 123 16.9004C123 17.8279 122.631 18.7175 121.976 19.3733C121.32 20.0292 120.43 20.3976 119.503 20.3976H111.347V18.0661H119.498C119.807 18.0661 120.104 17.9433 120.322 17.7247C120.541 17.5061 120.664 17.2096 120.664 16.9004C120.664 16.5912 120.541 16.2947 120.322 16.0761C120.104 15.8575 119.807 15.7347 119.498 15.7347H114.835C113.908 15.7347 113.018 15.3662 112.362 14.7104C111.706 14.0545 111.338 13.165 111.338 12.2374C111.338 11.3099 111.706 10.4204 112.362 9.76454C113.018 9.10869 113.908 8.74023 114.835 8.74023H114.84Z" fill="black" />
                        <path d="M4.63497 0L8.64511 4.03034L0.492718 12.1548L8.71817 20.3553L4.60389 24.4681C3.3107 23.2246 1.96155 21.947 0.646594 20.6289C0.167864 20.1455 0 19.4772 0 18.7948C0 14.4292 0 10.0632 0 5.69657C0 5.02977 0.155432 4.36919 0.621727 3.89978C1.93202 2.56773 3.30137 1.28697 4.63497 0Z" fill="#C51F2C" />
                        <path d="M8.81738 12.2125L12.7389 8.2832C13.5363 9.01684 14.4487 9.68209 15.145 10.537C16.017 11.5908 15.8942 13.1902 14.9787 14.2036C14.3088 14.9434 13.5612 15.6134 12.8726 16.2895L8.81738 12.2125Z" fill="#C51F2C" />
                    </svg>
                </div>
            </div>
        </>
    );
};

export default RequirmentsForm;