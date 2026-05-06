import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import "./Dashboard.css";
import "../layout/AppLayout.css";
import DiscoverSection from "../components/DiscoverSection";

const MATCH_COLORS = ["#2F5AA8", "#E8912D", "#D04C5B", "#B695E3"];

function normalizeRequestsPayload(data) {
  const requestsData = data?.results ?? data;
  return Array.isArray(requestsData) ? requestsData : [];
}

function normalizeConversationsPayload(data) {
  const conversationsData = data?.results ?? data;
  return Array.isArray(conversationsData) ? conversationsData : [];
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
  const navigate = useNavigate();

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
          .map((request) => {
            const senderId = Number(request.sender_id ?? request.sender);
            const receiverId = Number(request.receiver_id ?? request.receiver);

            const matchedUserId =
              senderId === Number(currentUserId)
                ? receiverId
                : senderId;

            return {
              id: request.id,
              userId: matchedUserId,
              name: getOtherUserName(request, currentUserId),
              skill: request.skill_title || "Skill swap",
            };
          });

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
          <button
            key={match.id}
            type="button"
            className="match-pill"
            onClick={() => navigate(`/profile/${match.userId}`)}
            style={{
              backgroundColor:
                MATCH_COLORS[(index + colorOffset) % MATCH_COLORS.length],
              border: "none",
              cursor: "pointer",
            }}
          >
            <strong>
              {match.name}
            </strong>
            <span>
              {match.skill}
            </span>
          </button>
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
  const [dashboardStats, setDashboardStats] = useState({
    matches: 0,
    unreadMessages: 0,
  });

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

  useEffect(() => {
    let isMounted = true;

    async function loadDashboardStats() {
      try {
        const requestsResponse = await api.get("requests/");

        if (!isMounted) return;

        const acceptedMatchesCount = normalizeRequestsPayload(requestsResponse.data)
          .filter((request) => request.status === "accepted")
          .length;

        setDashboardStats({
          matches: acceptedMatchesCount,
          unreadMessages: 0,
        });
      } catch (error) {
        console.error("Failed to load dashboard stats:", error);

        if (isMounted) {
          setDashboardStats({
            matches: 0,
            unreadMessages: 0,
          });
        }
      }
    }

    loadDashboardStats();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <>
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
              <span className="stat-number">{dashboardStats.matches}</span>
              <span className="stat-label">New Matches</span>
            </div>

            <div className="banner-stat">
              <span className="stat-number">{dashboardStats.unreadMessages}</span>
              <span className="stat-label">Messages</span>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-section">
        <MatchesSection />
      </div>

      <div className="dashboard-section">
        <DiscoverSection />
      </div>
    </>
  );
}

export default Dashboard;
