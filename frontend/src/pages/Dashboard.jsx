import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import "./Dashboard.css";
import "../layout/AppLayout.css";
import DiscoverSection from "../components/DiscoverSection";

const MATCH_COLORS = ["#2F5AA8", "#E8912D", "#D04C5B", "#B695E3"];

function normalizeRequestsPayload(data) {
  const requestsData = data?.results ?? data;
  return Array.isArray(requestsData) ? requestsData : [];
}

function getOtherUserName(request, currentUserId) {
  const senderId = Number(request.sender_id ?? request.sender);
  const receiverId = Number(request.receiver_id ?? request.receiver);

  if (senderId === Number(currentUserId)) {
    return request.receiver_name || "Community Member";
  }

  if (receiverId === Number(currentUserId)) {
    return request.sender_name || "Community Member";
  }

  return request.receiver_name || request.sender_name || "Community Member";
}

/* -----------------------------
   MATCHES SECTION
----------------------------- */
function MatchesSection() {
  const [matches, setMatches] = useState([]);
  const [colorOffset] = useState(() => Math.floor(Math.random() * MATCH_COLORS.length));

  useEffect(() => {
    let isMounted = true;

    async function loadMatches() {
      try {
        const [userResponse, requestsResponse] = await Promise.all([
          api.get("auth/me/"),
          api.get("requests/"),
        ]);

        if (!isMounted) return;

        const currentUserId = userResponse.data?.id;
        const acceptedMatches = normalizeRequestsPayload(requestsResponse.data)
          .filter((request) => request.status === "accepted")
          .map((request) => ({
            id: request.id,
            name: getOtherUserName(request, currentUserId),
            skill: request.skill_title || "Skill swap",
          }));

        setMatches(acceptedMatches);
      } catch (error) {
        console.error("Failed to load dashboard matches:", error);
        if (isMounted) setMatches([]);
      }
    }

    loadMatches();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="section-card">
      <header className="matches-header">
        <h2>Your Matches</h2>
      </header>

      <div className="matches-row">
        {matches.map((match, index) => (
          <div
            key={match.id}
            className="match-pill"
            style={{ backgroundColor: MATCH_COLORS[(index + colorOffset) % MATCH_COLORS.length] }}
          >
            <strong>
              {match.name}: {match.skill}
            </strong>
            <span>Accepted swap</span>
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
      {/* dashboard-section div is so content loads with animation */}
      <div className="dashboard-section">
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
      </div>

      {/* dashboard-section div is so content loads with animation */}
      <div className="dashboard-section">
        <MatchesSection /> 
      </div>

      {/* dashboard-section div is so content loads with animation */}
      <div className="dashboard-section">
        <DiscoverSection />     
      </div>
    </>
  );
}

export default Dashboard;
