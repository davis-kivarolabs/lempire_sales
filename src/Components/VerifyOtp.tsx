// src/components/VerifyOtp.tsx
import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";
import sha256 from "crypto-js/sha256";

export default function VerifyOtp() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";
  const [otp, setOtp] = useState("");
  const [newPw, setNewPw] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const navigate = useNavigate();

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    try {
      const q = query(collection(db, "users"), where("email", "==", email));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setMsg("No account found for this email.");
        return;
      }

      const userDoc = snapshot.docs[0];
      const userRef = doc(db, "users", userDoc.id);
      const data = userDoc.data();

      // Check OTP validity
      if (data.resetOtp !== otp) {
        setMsg("Invalid OTP.");
        return;
      }

      const now = new Date();
      const expiry = new Date(data.otpExpiry);
      if (now > expiry) {
        setMsg("OTP expired. Please request a new one.");
        return;
      }

      // Hash new password
      const hashedPw = sha256(newPw).toString();

      // Update password and clear OTP fields
      await updateDoc(userRef, {
        password: hashedPw,
        resetOtp: null,
        otpExpiry: null,
      });

      setMsg("Password updated successfully! Redirecting...");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err: any) {
      console.error(err);
      setMsg("Error verifying OTP. Try again.");
    }
  }

  return (
    <div className="auth-card">
      <h2>Verify OTP</h2>
      <form onSubmit={handleVerify}>
        <div className="field">
          <label className="label">Enter OTP</label>
          <input
            className="input"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
          />
        </div>

        <div className="field">
          <label className="label">New Password</label>
          <input
            type="password"
            className="input"
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            required
          />
        </div>

        {msg && <div className="helper">{msg}</div>}

        <div className="actions">
          <button className="btn" type="submit">
            Reset Password
          </button>
        </div>
      </form>
    </div>
  );
}



// // src/components/VerifyOtp.tsx
// import React, { useState } from "react";
// import { useSearchParams } from "react-router-dom";

// export default function VerifyOtp() {
//   const [params] = useSearchParams();
//   const email = params.get("email") || "";
//   const [otp, setOtp] = useState("");
//   const [newPw, setNewPw] = useState("");
//   const [confirm, setConfirm] = useState("");
//   const [msg, setMsg] = useState<string | null>(null);
//   const [loading, setLoading] = useState(false);

//   async function handleVerify(e: React.FormEvent) {
//     e.preventDefault();
//     setMsg(null);
//     if (newPw !== confirm) return setMsg("Passwords do not match.");
//     setLoading(true);
//     try {
//       const res = await fetch("/api/verify-otp", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ email, otp, newPassword: newPw })
//       });
//       const json = await res.json();
//       if (!res.ok) throw new Error(json?.message || "Invalid OTP");
//       setMsg("Password updated — you can now log in.");
//     } catch (err: any) {
//       setMsg(err.message || "Failed to verify OTP");
//     } finally { setLoading(false); }
//   }

//   return (
//     <div className="auth-card">
//       <h2>Verify OTP</h2>
//       <form onSubmit={handleVerify}>
//         <div className="field">
//           <label className="label">Email</label>
//           <input className="input" value={email} disabled />
//         </div>
//         <div className="field">
//           <label className="label">OTP</label>
//           <input className="input" value={otp} onChange={e => setOtp(e.target.value)} />
//         </div>
//         <div className="field">
//           <label className="label">New Password</label>
//           <input type="password" className="input" value={newPw} onChange={e => setNewPw(e.target.value)} />
//         </div>
//         <div className="field">
//           <label className="label">Confirm Password</label>
//           <input type="password" className="input" value={confirm} onChange={e => setConfirm(e.target.value)} />
//         </div>

//         {msg && <div className="helper">{msg}</div>}
//         <div className="actions">
//           <button className="btn" type="submit" disabled={loading}>{loading ? "Verifying..." : "Verify & Reset"}</button>
//         </div>
//       </form>
//     </div>
//   );
// }
