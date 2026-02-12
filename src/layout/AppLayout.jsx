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
import { Bell, Send, User } from "lucide-react";

function AppLayout({ children }) {
  return (
    <div className="app-layout">

        {/* Heading and icons, auto applies to all child pages */}
        <header className="app-header">

            <div className="header-inner">

                <h1 className="logo">SkillSwap</h1>

                <div className="header-icons">

                    <button className="icon-button">
                        <Bell size={20} strokeWidth={1.8}/>
                    </button>

                    <button className="icon-button">
                        <Send size={20} strokeWidth={1.8}/>
                    </button>

                    <button className="icon-button profile-button">
                        <User size={20} strokeWidth={1.8}/>
                    </button>

                </div>

            </div>

        </header>

      <main className="feed-container">
        {children}
      </main>

    </div>
  );
}

export default AppLayout;
