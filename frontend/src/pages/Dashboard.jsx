import { useState, useEffect } from "react";
import "./Dashboard.css";
import "../layout/AppLayout.css";
import { SlidersHorizontal } from "lucide-react";

/* -----------------------------
   DISCOVER SECTION
----------------------------- */
function DiscoverSection() {
  return (
    <div className="section-card">
      <div className="discover">
        <header className="discover-header">
          <h2>Discover</h2>
            {/* Filter icon, top right corner of the discover card */}
            <button className="icon-button">
                <SlidersHorizontal size={20} strokeWidth={1.8}/>
            </button>
        </header>

        <section className="discover-feed">

          <div className="skill-card">
            <h3>React Tutoring</h3>
            <p>Learn React basics in 2 sessions.</p>
            <span className="skill-tag">Wants: Spanish Practice</span>
          </div>

          <div className="skill-card">
              <h3>Spanish Tutoring</h3>
              <p>Learn conversational Spanish with me!</p>
              <span className="skill-tag">Wants: Cooking Lessons</span>
          </div>

          <div className="skill-card">
              <h3>Guitar Lessons</h3>
              <p>Want to learn guitar? Now hosting lessons!</p>
              <span className="skill-tag">Wants: React Basics</span>
          </div>
          
          <div className="discover-more">
            Discover More
          </div>
        </section>
      </div>
    </div>
  );
}

/* -----------------------------
   MATCHES SECTION
----------------------------- */
function MatchesSection() {
  return (
    <div className="section-card">
      <div className="matches">

        <header className="discover-header">
          <h2>Your Matches</h2>

          {/* Filter icon, top right corner of the discover card */}
            <button className="icon-button">
                <SlidersHorizontal size={20} strokeWidth={1.8}/>
            </button>
        </header>

        <section className="discover-feed">

          <div className="skill-card">
            <h3>Anna: Spanish Tutor</h3>
            <p>Ready to trade language practice.</p>
            <span className="skill-tag">Wants: JavaScript Help</span>
          </div>

          <div className="skill-card">
            <h3>Mike: Guitar Teacher</h3>
            <p>Looking for photography lessons.</p>
            <span className="skill-tag">Wants: Photography Tips</span>
          </div>

          <div className="skill-card">
            <h3>John: JavaScript Tutor</h3>
            <p>Looking for someone to help teach me math.</p>
            <span className="skill-tag">Wants: Math Help</span>
          </div>

          <div className="discover-more">
            See More Matches
          </div>
        </section>
      </div>
    </div>
  );
}

/* -----------------------------
   DASHBOARD PAGE (MAIN EXPORT)
----------------------------- */
function Dashboard() {
  const [firstName, setFirstName] = useState("User");

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setFirstName(user.firstName || user.first_name || "User");
      } catch (e) {
        console.error("Error parsing user data", e);
      }
    }
  }, []);

  return (
    <>
    {/* Banner at top of dashboard page */}
    <div className="dashboard-banner">

      <div className="banner-left">
        <h1>Welcome back, {firstName}</h1>
        <p>Ready to learn something new today?</p>
      </div>

      <div className="banner-right">
        <div className="banner-stat">
          <span className="stat-number">[#]</span>
          <span className="stat-label">New Matches</span>
        </div>

        <div className="banner-stat">
          <span className="stat-number">[#]</span>
          <span className="stat-label">Messages</span>
        </div>
      </div>

    {/* Renders previous two sections on the page */}
    </div>
      <DiscoverSection />
      <MatchesSection />
    </>
  );
}

export default Dashboard;
