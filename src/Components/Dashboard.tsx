// src/components/Dashboard.tsx
// import { signOut, auth } from "../firebase";

import { useUser } from "../context/UserContext";

export default function Dashboard() {
    const { logout } = useUser();

    async function handleLogout() {
        logout();
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
