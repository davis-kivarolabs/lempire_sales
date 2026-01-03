import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./styles/main.scss";
import Login from "./Components/Login";
import PrivateRoute from "./Components/PrivateRoute";
import Register from "./Components/Register";
import ForgotPassword from "./Components/ForgotPassword";
import VerifyOtp from "./Components/VerifyOtp";
// import Dashboard from "./Components/Dashboard";
import RequirmentsForm from "./pages/RequirmentsForm";
import { UserProvider } from "./context/UserContext";
import Header from "./Components/Header";
import Submissions from "./Components/Submissions";

export default function App() {
  return (
    <BrowserRouter>
      <UserProvider>
        <Header />
        <div className="mt-[70px]">
          <Routes>
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <RequirmentsForm />
                </PrivateRoute>
              }
            />
            <Route
              path="/submissions"
              element={
                <PrivateRoute>
                  <Submissions />
                </PrivateRoute>
              }
            />
            {/* <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} /> */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot" element={<ForgotPassword />} />
            <Route path="/verify-otp" element={<VerifyOtp />} />
          </Routes>
        </div>
      </UserProvider>
    </BrowserRouter>
  );
}

// // src/App.tsx
// import { BrowserRouter, Routes, Route } from "react-router-dom";
// import Register from "./components/Register";
// import Login from "./components/Login";
// import ForgotPassword from "./components/ForgotPassword";
// import VerifyOtp from "./components/VerifyOtp";
// import Dashboard from "./components/Dashboard";
// import "./styles/main.scss";

// export default function App() {
//   return (
//     <BrowserRouter>
//       <Routes>
//         <Route path="/" element={<h1>hleo</h1>} />
//         <Route path="/login" element={<Login />} />
//         <Route path="/register" element={<Register />} />
//         <Route path="/forgot" element={<ForgotPassword />} />
//         <Route path="/verify-otp" element={<VerifyOtp />} />
//         <Route path="/dashboard" element={<Dashboard />} />
//       </Routes>
//     </BrowserRouter>
//   );
// }
