// src/components/Dashboard.tsx
import { signOut, auth } from "../firebase";

export default function Dashboard() {
    async function handleLogout() {
        await signOut(auth);
        window.location.href = "/login";
    }

    return (
        <div className="auth-card">
            <h2>Dashboard</h2>
            <p>Logged in successfully.</p>
            <button className="btn secondary" onClick={handleLogout}>Logout</button>
        </div>
    );
}
