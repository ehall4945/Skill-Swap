import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { SlidersHorizontal } from "lucide-react";
import "./Dashboard.css";
import "../layout/AppLayout.css";
import DiscoverSection from "../components/DiscoverSection";

/* -----------------------------
   MATCHES SECTION
----------------------------- */
function MatchesSection() {
  const matches = [
    { name: "Anna", skill: "Spanish Tutor", wants: "JavaScript help", color: "#2F5AA8" },
    { name: "John", skill: "JavaScript Tutor", wants: "Math help", color: "#E8912D" },
    { name: "Mike", skill: "Guitar Teacher", wants: "Photography tips", color: "#D04C5B" },
    { name: "Lena", skill: "UI Designer", wants: "React mentoring", color: "#B695E3" },
    { name: "Carlos", skill: "Photography Tutor", wants: "Spanish practice", color: "#E8912D" },
    { name: "Maya", skill: "Yoga Instructor", wants: "Web design help", color: "#2F5AA8" },
    { name: "Sam", skill: "Data Science Tutor", wants: "Machine learning study partner", color: "#D04C5B" },
  ];

  return (
    <div className="section-card">
      <header className="matches-header">
        <h2>Your Matches</h2>
      </header>

      <div className="matches-row">
        {matches.map((match, index) => (
          <div
            key={index}
            className="match-pill"
            style={{ backgroundColor: match.color }}
          >
            <strong>
              {match.name}: {match.skill}
            </strong>
            <span>Wants: {match.wants}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -----------------------------
   DASHBOARD PAGE
----------------------------- */
function Dashboard() {
  const [firstName, setFirstName] = useState("User");

  useEffect(() => {
    const userData = localStorage.getItem("user");

    if (!userData) return;

    try {
      const user = JSON.parse(userData);
      setFirstName(user.firstName || user.first_name || "User");
    } catch (error) {
      console.error("Error parsing user data:", error);
    }
  }, []);

  return (
    <>
      <div className="dashboard-banner">
        <div className="banner-left">
          <h1>Welcome back, {firstName}</h1>
          <p>Ready to learn something new today?</p>

          <Link to="/profile" className="dashboard-profile-link">
            View My Profile
          </Link>
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
      </div>

      <MatchesSection />
      <DiscoverSection />
    </>
  );
}

export default Dashboard;