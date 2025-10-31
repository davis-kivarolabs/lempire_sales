import "./components.scss"
// import { signOut, auth } from "../firebase";
import { useUser } from "../context/UserContext";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const Header = () => {

    const { user, logout } = useUser();

    async function handleLogout() {
        // await signOut(auth);
        logout()
        window.location.href = "/login";
        setIsMenu(false)
    }

    // const user = useUser();
    const navigate = useNavigate();
    console.log("user: ", user)

    const [isMenu, setIsMenu] = useState(false)

    return (
        // <div className="header_section" style={{ backgroundColor: "teal" }} >
        <div className="header_section" style={{ backgroundColor: "#094349", height: "80px" }} >
            {/* <div className="header_section" style={{ backgroundColor: "#00252d", height: "80px" }} > // dark */}
            {/* <div className="header_section" style={{ backgroundColor: "#08afbd", height: "80px" }} > // light */}
            <div>
                <img onClick={() => navigate('/')} className="header_logo" src="/white_logo.png" alt="" />
            </div>

            <div style={{ position: "relative" }} >
                {user && <svg onClick={() => setIsMenu(true)} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 5.92C12.5302 5.92 12.96 5.49019 12.96 4.96C12.96 4.42981 12.5302 4 12 4C11.4698 4 11.04 4.42981 11.04 4.96C11.04 5.49019 11.4698 5.92 12 5.92Z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                    <path d="M12 12.96C12.5302 12.96 12.96 12.5302 12.96 12C12.96 11.4698 12.5302 11.04 12 11.04C11.4698 11.04 11.04 11.4698 11.04 12C11.04 12.5302 11.4698 12.96 12 12.96Z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                    <path d="M12 20C12.5302 20 12.96 19.5702 12.96 19.04C12.96 18.5098 12.5302 18.08 12 18.08C11.4698 18.08 11.04 18.5098 11.04 19.04C11.04 19.5702 11.4698 20 12 20Z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                </svg>}
                <div className={`menu_overlay ${isMenu ? "active" : ""}`}></div>
                <div className={`menu_section ${isMenu ? "active" : ""}`} >
                    <div className="close_button" onClick={() => setIsMenu(false)} >
                        <div>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M19 5L5 19" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                                <path d="M19 19L5 5" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                            </svg>
                        </div>
                    </div>
                    <div className="head_menus" >
                        <div className="menu_button" >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 21.5C17.2467 21.5 21.5 17.2467 21.5 12C21.5 6.7533 17.2467 2.5 12 2.5C6.7533 2.5 2.5 6.7533 2.5 12C2.5 17.2467 6.7533 21.5 12 21.5Z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                                <path d="M6.3739 19.6528C6.90736 18.6208 7.71438 17.7554 8.70668 17.1513C9.69897 16.5472 10.8383 16.2277 12 16.2277C13.1617 16.2277 14.301 16.5472 15.2933 17.1513C16.2857 17.7554 17.0926 18.6208 17.6261 19.6528" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                                <path d="M12 13.0556C13.8772 13.0556 15.3989 11.5339 15.3989 9.6567C15.3989 7.77954 13.8772 6.25781 12 6.25781C10.1228 6.25781 8.60114 7.77954 8.60114 9.6567C8.60114 11.5339 10.1228 13.0556 12 13.0556Z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                            </svg>
                            <p className="text-white" >{user?.username}</p>
                        </div>

                        <div onClick={() => {
                            navigate("/submissions");
                            setIsMenu(false);
                        }} className="menu_button" >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M19.9218 12.0052V17.2864C19.919 17.7472 19.7957 18.1993 19.5641 18.5977C19.3324 18.9961 19.0006 19.3269 18.6015 19.5573C16.5958 20.7108 14.3133 21.2951 12 21.2473C9.68548 21.2911 7.40292 20.7022 5.3985 19.5441C5.00133 19.3148 4.67071 18.9861 4.4392 18.5902C4.20769 18.1943 4.08328 17.745 4.07821 17.2864V12.0052C6.29784 13.8412 9.12271 14.7828 12 14.6458C14.8773 14.7828 17.7022 13.8412 19.9218 12.0052Z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                                <path d="M19.9218 5.4037C17.7022 7.23968 14.8773 8.1813 12 8.0443C9.12271 8.1813 6.29784 7.23968 4.07821 5.4037C6.29784 3.56772 9.12271 2.6261 12 2.7631C14.8773 2.6261 17.7022 3.56772 19.9218 5.4037Z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                                <path d="M19.9218 5.40369V12.0052M4.07821 12.0052V5.40369" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                            </svg>
                            <p className="text-white" >Forms</p>
                        </div>

                        <div onClick={handleLogout} className="menu_button" >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M13.4767 21.2448H8.34067C7.04877 21.3045 5.78536 20.8527 4.82407 19.9876C3.86278 19.1224 3.28099 17.9134 3.2047 16.6224V7.37762C3.28099 6.08659 3.86278 4.87757 4.82407 4.01241C5.78536 3.14724 7.04877 2.69559 8.34067 2.75524H13.4767" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                                <path d="M20.7953 12H7.44174" stroke="white" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" />
                                <path d="M16.0833 17.136L20.4874 12.7319C20.6802 12.5371 20.7884 12.2742 20.7884 12C20.7884 11.7259 20.6802 11.4629 20.4874 11.2681L16.0833 6.86404" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                            </svg>
                            <p className="text-white" >Logout</p>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    )
}

export default Header;