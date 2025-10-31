// // src/components/PrivateRoute.tsx
// import React from "react";
// import { Navigate } from "react-router-dom";

// interface PrivateRouteProps {
//   children: React.ReactNode;
//   allowedRoles?: string[]; // optional role restriction
// }

// export default function PrivateRoute({ children, allowedRoles }: PrivateRouteProps) {
//   const [loading, setLoading] = React.useState(true);
//   const [isAuth, setIsAuth] = React.useState(false);
//   const [userRole, setUserRole] = React.useState<string | null>(null);

//   React.useEffect(() => {
//     const userData = localStorage.getItem("user");

//     if (userData) {
//       const user = JSON.parse(userData);
//       setUserRole(user.role || null);
//       setIsAuth(true);
//     } else {
//       setIsAuth(false);
//     }

//     setLoading(false);
//   }, []);

//   if (loading) return <div>Loading...</div>;

//   if (!isAuth) return <Navigate to="/login" replace />;

//   // Optional role check
//   if (allowedRoles && !allowedRoles.includes(userRole || "")) {
//     return <Navigate to="/unauthorized" replace />;
//   }

//   return <>{children}</>;
// }

// src/components/PrivateRoute.tsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useUser } from "../context/UserContext"; // ✅ use context

interface PrivateRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export default function PrivateRoute({ children, allowedRoles }: PrivateRouteProps) {
  const { user } = useUser(); // reactive state from context
  const [loading, setLoading] = React.useState(true);

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



// // src/components/PrivateRoute.tsx
// import React from "react";
// import { Navigate } from "react-router-dom";
// import { onAuthStateChanged, auth } from "../firebase";

// interface PrivateRouteProps {
//   children: React.ReactNode;
// }

// export default function PrivateRoute({ children }: PrivateRouteProps) {
//   const [loading, setLoading] = React.useState(true);
//   const [isAuth, setIsAuth] = React.useState(false);

//   React.useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, (user) => {
//       if (user && user.emailVerified) {
//         setIsAuth(true);
//       } else {
//         setIsAuth(false);
//       }
//       setLoading(false);
//     });

//     return () => unsubscribe();
//   }, []);

//   if (loading) return <div>Loading...</div>; // optional loading state

//   if (!isAuth) return <Navigate to="/login" replace />;

//   return <>{children}</>;
// }
