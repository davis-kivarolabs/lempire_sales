// src/components/ForgotPassword.tsx
import React, { useState } from "react";
import { db } from "../firebase";
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [useOtp, setUseOtp] = useState(false);

  // Generate a random 6-digit OTP
  function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Handle password reset via OTP method
  async function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    try {
      // Find user by email
      const q = query(collection(db, "users"), where("email", "==", email));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setMessage("No user found with that email.");
        return;
      }

      const userDoc = snapshot.docs[0];
      const userRef = doc(db, "users", userDoc.id);

      // Generate OTP and save to user record
      const otp = generateOtp();
      const expiry = new Date(Date.now() + 10 * 60 * 1000); // valid for 10 minutes

      await updateDoc(userRef, {
        resetOtp: otp,
        otpExpiry: expiry.toISOString(),
      });

      // TODO: 🔔 Replace this with your backend email sending API call
      // await fetch("/api/send-otp", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ email, otp }),
      // });

      console.log("OTP generated:", otp); // for testing
      setUseOtp(true);
      setMessage("OTP sent to your email. Enter it below to reset your password.");
    } catch (err: any) {
      console.error(err);
      setMessage(err.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-card">
      <h2>Reset Password</h2>

      <form onSubmit={handleRequestOtp}>
        <div className="field">
          <label className="label">Your Email</label>
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        {message && <div className="helper">{message}</div>}

        <div className="actions">
          <button className="btn" type="submit" disabled={loading}>
            {loading ? "Processing..." : "Send OTP to Email"}
          </button>
        </div>
      </form>

      {useOtp && (
        <div style={{ marginTop: 12 }}>
          <a
            className="small-link"
            href={`/verify-otp?email=${encodeURIComponent(email)}`}
          >
            Enter OTP Now
          </a>
        </div>
      )}
    </div>
  );
}


// // src/components/ForgotPassword.tsx
// import React, { useState } from "react";
// import { sendPasswordResetEmail, auth } from "../firebase";

// export default function ForgotPassword() {
//   const [email, setEmail] = useState("");
//   const [message, setMessage] = useState<string | null>(null);
//   const [loading, setLoading] = useState(false);
//   const [useOtp, setUseOtp] = useState(false);

//   async function handleResetLink(e: React.FormEvent) {
//     e.preventDefault();
//     setMessage(null);
//     setLoading(true);
//     try {
//       await sendPasswordResetEmail(auth, email);
//       setMessage("Password reset email sent. Check your inbox.");
//     } catch (err: any) {
//       setMessage(err.message || "Failed to send reset email.");
//     } finally {
//       setLoading(false);
//     }
//   }

//   async function handleRequestOtp(e: React.FormEvent) {
//     e.preventDefault();
//     setMessage(null);
//     setLoading(true);
//     try {
//       // call your backend to generate & send OTP
//       // example: POST /send-otp { email }
//       const res = await fetch("/api/send-otp", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ email })
//       });
//       if (!res.ok) throw new Error("Failed to request OTP");
//       setUseOtp(true);
//       setMessage("OTP sent to your email. Enter it below to verify & reset password.");
//     } catch (err: any) {
//       setMessage(err.message || "Failed to request OTP");
//     } finally {
//       setLoading(false);
//     }
//   }

//   return (
//     <div className="auth-card">
//       <h2>Reset password</h2>
//       <form onSubmit={handleResetLink}>
//         <div className="field">
//           <label className="label">Your Email</label>
//           <input className="input" value={email} onChange={e=>setEmail(e.target.value)} />
//         </div>
//         {message && <div className="helper">{message}</div>}
//         <div className="actions">
//           <button className="btn" type="submit">Send reset link</button>
//         </div>
//       </form>

//       <hr style={{margin:"18px 0"}} />

//       <h3>Or use Email OTP</h3>
//       <p className="helper">We will send a one-time code to your email.</p>
//       <form onSubmit={handleRequestOtp}>
//         <div className="actions">
//           <button className="btn secondary" type="submit" disabled={loading}>{loading ? "Requesting..." : "Send OTP to email"}</button>
//         </div>
//       </form>

//       {useOtp && <div style={{marginTop:12}}>
//         <a className="small-link" href={`/verify-otp?email=${encodeURIComponent(email)}`}>Enter OTP now</a>
//       </div>}
//     </div>
//   );
// }
