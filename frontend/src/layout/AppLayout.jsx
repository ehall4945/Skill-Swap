/*
APP LAYOUT WRAPPER

Wraps all pages using {children}.

Controls:
- Main app container structure
- Overall page layout shell
- Heading and icons

All pages render inside this component.
*/

import "./AppLayout.css";
import skillswap from '../images/Skillswap.png'; 
import { useEffect, useState, useCallback, useRef } from "react"; 
import { NavLink, useNavigate } from "react-router-dom";
import NotificationBell from "../components/NotificationBell";
import { useAuth } from "../context/AuthContext";
import { Home, UserCircle2, MessageSquare, ListChecks, PlusCircle, ChevronRight, LogOut, User, Repeat, Bell } from "lucide-react";

const NAV_ITEMS = [
    { to: "/", label: "Dashboard", icon: Home, end: true },
    { to: "/listings", label: "Marketplace", icon: ListChecks },
    { to: "/skills/new", label: "Create Skill", icon: PlusCircle, end: true },
    { to: "/requests", label: "My Swaps", icon: Repeat },
    { to: "/notifications", label: "Notifications", icon: Bell },
    { to: "/profile", label: "Profile", icon: UserCircle2 },
    { to: "/chat", label: "Chat", icon: MessageSquare },
];

function AppLayout({ children }) {
    const { user, logout, authLoading } = useAuth();
    const [logoutBusy, setLogoutBusy] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const dropdownRef = useRef(null); 
    const avatarBtnRef = useRef(null);

    const navigate = useNavigate();

    const greetingName = (user?.first_name && user.first_name.trim()) ||
                         (user?.name && user.name.trim()) ||
                         (user?.username && user.username.trim()) ||
                         ""; 
    
    const helloText = greetingName ? `Hello, ${greetingName}!` : "Hello!";

    const avatarLetter = (user?.first_name?.[0] || user?.username?.[0] || "U").toUpperCase();

    const rawAvatar = user?.profile_image;
    
    const avatarUrl =
        rawAvatar && rawAvatar.trim() !== ""
        ? rawAvatar.startsWith("http")
            ? rawAvatar
            : `${import.meta.env.VITE_API_URL.replace("/api", "")}${rawAvatar}`
        : null;

    const handleLogout = useCallback(() => {
        if(logoutBusy) return;
        setLogoutBusy(true);
        try{
            logout();
            navigate("/login", { replace: true });
        } finally {
            setLogoutBusy(false);
        }
    }, [logout, logoutBusy, navigate]);

    useEffect(() => {
        function onDocClick(e){
            if (!profileOpen) return;
            const menu = dropdownRef.current;
            const btn = avatarBtnRef.current;
            if (menu && !menu.contains(e.target) && btn && !btn.contains(e.target)){
                setProfileOpen(false);
            }
        }
        function onEscape(e){
            if (e.key === "Escape") setProfileOpen(false);
        }
        document.addEventListener("mousedown", onDocClick);
        document.addEventListener("keydown", onEscape);
        return () => {
            document.removeEventListener("mousedown", onDocClick);
            document.removeEventListener("keydown", onEscape);
        };
    }, [profileOpen]);

    return (
        <div className="app-layout">
            {/* left sidebar */}
            <aside className="sidebar">
                <div className="sidebar-brand">
                    <img src={skillswap} alt="SkillSwap Logo" className="brand-logo" />
                </div>

                <nav className="sidebar-nav" aria-label="Primary">
                    {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
                        <NavLink 
                            key={to} 
                            to={to} 
                            end={Boolean(end)} 
                            className={({ isActive }) => 
                            `sidebar-item ${isActive ? "active" : ""}`
                            }
                        >
                        <span className="sidebar-item-icon">
                            <Icon size={18} strokeWidth={2} /> 
                        </span>
                        <span className="sidebar-item-label">{label}</span>
                        <ChevronRight 
                            size={16}
                            strokeWidth={2}
                            className="sidebar-item-chevron"
                            aria-hidden="true"
                        />
                    </NavLink>
                    ))}
                </nav>
            </aside>
            
            {/* main content area */}
            <div className="main">
                <header className="header" role="banner">
                    <div className="header-bar">
                        <div className="header-bar-inner">
                            <div className="header-left">
                                <div className="hello">
                                    {authLoading ? "Loading..." : helloText}
                                </div>
                            </div>

                            {/* header actions */}
                            <div className="header-actions">
                                <button className="icon-button" type="button" aria-label="My Swaps" onClick={() => navigate("/requests")}>
                                    <Repeat strokeWidth = {1.8} />
                                </button>

                                {!authLoading && user ? <NotificationBell /> : null}
                                
                                <button 
                                    ref={avatarBtnRef}
                                    className="avatar-button" 
                                    type="button" 
                                    aria-haspopup="menu"
                                    aria-expanded={profileOpen}
                                    aria-controls="profile-menu"
                                    onClick={() => setProfileOpen((v) => !v)}
                                >
                                    {avatarUrl ? (
                                        <img
                                            src={avatarUrl}
                                            alt="User avatar"
                                            className="avatar avatar-image"
                                            onError={ (e) => {
                                                e.currentTarget.style.display = 'none';
                                            } }
                                        />
                                        ) : (
                                            <span className="avatar">{avatarLetter}</span>
                                        ) }
                                </button> 

                                {profileOpen && (
                                    <div 
                                        id="profile-menu"
                                        role="menu"
                                        aria-label="Profile Menu"
                                        className="profile-menu"
                                        ref={dropdownRef}
                                        >
                                        <div className="profile-menu-header"> 
                                            <div className="profile-initial">
                                                {avatarUrl ? (
                                                    <img 
                                                        src={avatarUrl}
                                                        alt="User avatar"
                                                        className="profile-avatar-image"
                                                    />
                                                ) : (
                                                    avatarLetter
                                                ) }
                                            </div> 
                                            <div className="profile-meta">
                                                <div className="profile-name">{greetingName || "User"}</div>
                                                <div className="profile-username">{user?.username ? `@${user.username}` : ""}</div>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            role="menuitem"
                                            className="profile-menu-item"
                                            onClick={() => {
                                                setProfileOpen(false);
                                                navigate("/profile");
                                            }}
                                            >
                                            <User size={16} />
                                            <span>Profile</span>
                                        </button>

                                        <button
                                            type="button"
                                            role="menuitem"
                                            className="profile-menu-item danger"
                                            onClick={handleLogout}
                                            disabled={logoutBusy}
                                        >
                                            <LogOut size={16} />
                                            <span>{logoutBusy ? "Logging out..." : "Logout"}</span>
                                        </button>
                                    </div>
                                 )}
                            </div>
                        </div>
                    </div>
                </header>

                {/* page content area */}
                <main className="content" role="main">
                    <div className="canvas">
                        <div className="feed-container">
                            {children}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );

}

export default AppLayout;
