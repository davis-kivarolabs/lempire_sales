// src/components/Register.tsx
import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { saveUserProfile } from "../firebase";
import { isValidEmail, isStrongPassword, isValidPhone } from "../utils/validators";
import sha256 from "crypto-js/sha256";

export default function Register() {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [pw, setPw] = useState("");
    const [pw2, setPw2] = useState("");
    const [phone, setPhone] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const hashedPw = sha256(pw).toString();

    async function handleRegister(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setSuccess(false);

        // Simple validation
        if (!username.trim()) return setError("Username is required.");
        // if (!isValidEmail(email)) return setError("Enter a valid email.");
        if (!isStrongPassword(pw)) return setError("Password must be at least 8 chars, with uppercase and numbers.");
        if (pw !== pw2) return setError("Passwords do not match.");
        if (phone && !isValidPhone(phone)) return setError("Enter a valid phone number.");

        setLoading(true);
        try {
            const userId = uuidv4();
            await saveUserProfile({
                user_id: userId,
                username,
                email,
                phone: phone || undefined,
                password: hashedPw,
                status: "activated",
                role: "sales",
            });
            setSuccess(true);
            // Clear form
            setUsername("");
            setEmail("");
            setPw("");
            setPw2("");
            setPhone("");
        } catch (err: any) {
            setError("Failed to save user: " + err.message);
            console.log("Failed to save user: ", err)
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="auth-card">
            <h2>Create an account</h2>
            <form onSubmit={handleRegister}>
                <div className="field">
                    <label className="label">Username</label>
                    <input
                        className={`input ${username && username.trim().length < 3 ? "invalid" : ""}`}
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    <div className="helper">At least 3 characters</div>
                </div>

                <div className="field">
                    <label className="label">Your Email</label>
                    <input
                        className={`input ${email && !isValidEmail(email) ? "invalid" : ""}`}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>

                <div className="field">
                    <label className="label">Password</label>
                    <input
                        type="password"
                        className={`input ${pw && !isStrongPassword(pw) ? "invalid" : ""}`}
                        value={pw}
                        onChange={(e) => setPw(e.target.value)}
                    />
                    <div className="helper">min 8 chars, uppercase, lowercase and a digit</div>
                </div>

                <div className="field">
                    <label className="label">Confirm Password</label>
                    <input
                        type="password"
                        className={`input ${pw2 && pw !== pw2 ? "invalid" : ""}`}
                        value={pw2}
                        onChange={(e) => setPw2(e.target.value)}
                    />
                </div>

                <div className="field">
                    <label className="label">Phone (optional)</label>
                    <input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className={`input ${phone && !isValidPhone(phone) ? "invalid" : ""}`}
                        placeholder="e.g. 971501234567"
                    />
                </div>

                {error && <div className="error">{error}</div>}
                {success && <div className="success">User saved successfully!</div>}

                <div className="actions">
                    <button className="btn" type="submit" disabled={loading}>
                        {loading ? "Saving..." : "Register"}
                    </button>
                </div>
            </form>
        </div>
    );
}


// // src/components/Register.tsx
// import React, { useState } from "react";
// import { v4 as uuidv4 } from "uuid";
// import { createUserWithEmailAndPassword, auth, sendEmailVerification, saveUserProfile } from "../firebase";
// import { isValidEmail, isStrongPassword, isValidPhone } from "../utils/validators";

// export default function Register() {
//     const [username, setUsername] = useState("");
//     const [email, setEmail] = useState("");
//     const [pw, setPw] = useState("");
//     const [pw2, setPw2] = useState("");
//     const [phone, setPhone] = useState("");
//     const [error, setError] = useState<string | null>(null);
//     const [loading, setLoading] = useState(false);
//     const [sentVerification, setSentVerification] = useState(false);

//     async function handleRegister(e: React.FormEvent) {
//         e.preventDefault();
//         setError(null);

//         if (!username.trim()) return setError("Username is required.");
//         if (!isValidEmail(email)) return setError("Enter a valid email.");
//         if (!isStrongPassword(pw)) return setError("Password must be at least 8 chars, with uppercase and numbers.");
//         if (pw !== pw2) return setError("Passwords do not match.");
//         if (phone && !isValidPhone(phone)) return setError("Enter a valid phone number.");

//         setLoading(true);
//         try {
//             const userCred = await createUserWithEmailAndPassword(auth, email, pw);

//             // Generate UUID for user_id
//             const userId = uuidv4();

//             await saveUserProfile(userCred.user.uid, {
//                 user_id: userId,
//                 username,
//                 email,
//                 phone: phone || undefined,
//                 status: "activated",
//                 role: "sales",
//             });

//             // Send email verification
//             await sendEmailVerification(userCred.user);
//             setSentVerification(true);
//         } catch (err: any) {
//             setError(err.message || "Failed to register.");
//         } finally {
//             setLoading(false);
//         }
//     }

//     return (
//         <div className="auth-card">
//             <h2>Create an account</h2>
//             <form onSubmit={handleRegister}>
//                 <div className="field">
//                     <label className="label">Username</label>
//                     <input
//                         className={`input ${username && username.trim().length < 3 ? "invalid" : ""}`}
//                         value={username}
//                         onChange={e => setUsername(e.target.value)}
//                     />
//                     <div className="helper">At least 3 characters</div>
//                 </div>

//                 <div className="field">
//                     <label className="label">Your Email</label>
//                     <input
//                         className={`input ${email && !isValidEmail(email) ? "invalid" : ""}`}
//                         value={email}
//                         onChange={e => setEmail(e.target.value)}
//                     />
//                 </div>

//                 <div className="field">
//                     <label className="label">Password</label>
//                     <input
//                         type="password"
//                         className={`input ${pw && !isStrongPassword(pw) ? "invalid" : ""}`}
//                         value={pw}
//                         onChange={e => setPw(e.target.value)}
//                     />
//                     <div className="helper">min 8 chars, uppercase, lowercase and a digit</div>
//                 </div>

//                 <div className="field">
//                     <label className="label">Confirm Password</label>
//                     <input
//                         type="password"
//                         className={`input ${pw2 && pw !== pw2 ? "invalid" : ""}`}
//                         value={pw2}
//                         onChange={e => setPw2(e.target.value)}
//                     />
//                 </div>

//                 <div className="field">
//                     <label className="label">Phone (optional)</label>
//                     <input
//                         value={phone}
//                         onChange={e => setPhone(e.target.value)}
//                         className={`input ${phone && !isValidPhone(phone) ? "invalid" : ""}`}
//                         placeholder="e.g. 971501234567"
//                     />
//                     <div className="helper">We store this for your profile and future phone OTP (if enabled)</div>
//                 </div>

//                 {error && <div className="error">{error}</div>}
//                 {sentVerification && (
//                     <div className="helper">
//                         Verification sent — check your email and click the verification link.
//                     </div>
//                 )}

//                 <div className="actions">
//                     <button className="btn" type="submit" disabled={loading}>
//                         {loading ? "Creating..." : "Continue"}
//                     </button>
//                 </div>
//             </form>
//         </div>
//     );
// }