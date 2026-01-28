// // src/components/ChangePassword.tsx
// import React, { useState } from "react";
// import { doc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
// import sha256 from "crypto-js/sha256";
// import { db } from "../firebase";
// import { useUser } from "../context/UserContext";

// export default function ChangePassword() {
//   const { user, setUser } = useUser();
//   const [currentPw, setCurrentPw] = useState("");
//   const [newPw, setNewPw] = useState("");
//   const [confirmPw, setConfirmPw] = useState("");
//   const [error, setError] = useState<string | null>(null);
//   const [success, setSuccess] = useState(false);
//   const [loading, setLoading] = useState(false);

//   async function handleChangePassword(e: React.FormEvent) {
//     e.preventDefault();
//     setError(null);
//     setSuccess(false);

//     if (newPw !== confirmPw) {
//       setError("Passwords do not match");
//       return;
//     }

//     setLoading(true);

//     try {
//       const currentHashed = sha256(currentPw).toString();
//       const newHashed = sha256(newPw).toString();

//       // Verify current password
//       const q = query(
//         collection(db, "users"),
//         // where("login_id", "==", user.login_id),
//         where("password", "==", currentHashed)
//       );

//       const snap = await getDocs(q);
//       if (snap.empty) {
//         setError("Current password is incorrect");
//         return;
//       }

//       const userDoc = snap.docs[0];
//       await updateDoc(doc(db, "users", userDoc.id), {
//         password: newHashed,
//       });

//       const updatedUser = { ...user, password: newHashed };
//       setUser(updatedUser);
//       localStorage.setItem("user", JSON.stringify(updatedUser));

//       setSuccess(true);
//       setCurrentPw("");
//       setNewPw("");
//       setConfirmPw("");
//     } catch {
//       setError("Failed to change password");
//     } finally {
//       setLoading(false);
//     }
//   }

//   return (
//     <div className="auth-card">
//       <h2>Change Password</h2>

//       <form onSubmit={handleChangePassword}>
//         <input
//           type="text"
//         //   type="password"
//           placeholder="Current password"
//           value={currentPw}
//           onChange={(e) => setCurrentPw(e.target.value)}
//           required
//         />

//         <input
//           type="text"
//         //   type="password"
//           placeholder="New password"
//           value={newPw}
//           onChange={(e) => setNewPw(e.target.value)}
//           required
//         />

//         <input
//           type="text"
//         //   type="password"
//           placeholder="Confirm new password"
//           value={confirmPw}
//           onChange={(e) => setConfirmPw(e.target.value)}
//           required
//         />

//         {error && <div className="error">{error}</div>}
//         {success && <div className="success">Password updated successfully</div>}

//         <button type="submit" disabled={loading}>
//           {loading ? "Updating..." : "Update Password"}
//         </button>
//       </form>
//     </div>
//   );
// }
