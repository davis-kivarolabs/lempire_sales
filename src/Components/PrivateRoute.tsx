// src/components/PrivateRoute.tsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useUser } from "../context/UserContext"; // use context

interface PrivateRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export default function PrivateRoute({ children, allowedRoles }: PrivateRouteProps) {
  const { user } = useUser(); // reactive state from context
  const [loading, setLoading] = React.useState(true);

  console.log("user: 01", user)

  React.useEffect(() => {
    // simulate small loading delay to let context load
    const t = setTimeout(() => setLoading(false), 100);
    return () => clearTimeout(t);
  }, []);

  if (loading) return <div>Loading...</div>;

  if (!user) return <Navigate to="/login" replace />;

  // Role restriction (optional)
  if (allowedRoles && !allowedRoles.includes(user.role || "")) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}