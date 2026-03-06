import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./Dashboard.css";
import "../layout/AppLayout.css";
import { SlidersHorizontal } from "lucide-react";
import api from "../services/api";

/* -----------------------------
   DISCOVER SECTION
----------------------------- */
function DiscoverSection() {
  // 1. Set up state to hold our skills from Django
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/skills/')
      .then((response) => {
       
        console.log("Data from Django:", response.data);

        const actualSkills = response.data.results ? response.data.results : response.data;
        
        setSkills(actualSkills);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching skills:", error);
        setLoading(false);
      });
  }, []);

  return (
    <div className="section-card">
      <div className="discover">
        <header className="discover-header">
          <h2>Discover</h2>
            <button className="icon-button">
                <SlidersHorizontal size={20} strokeWidth={1.8}/>
            </button>
        </header>

        <section className="discover-feed">
          {/* 3. Loop through the data and render the cards dynamically */}
          {loading ? (
            <p>Loading real skills from the database...</p>
          ) : skills.length === 0 ? (
            <p>No skills found. Be the first to add one!</p>
          ) : (
            skills.map((skill) => (
              <div className="skill-card" key={skill.id}>
                <h3>{skill.title}</h3>
                <p>{skill.description}</p>
                {/* Notice how we use the custom owner_name field you built! */}
                <span className="skill-tag">Offered by: {skill.owner_name}</span> 
              </div>
            ))
          )}
          
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
        {/* --- NEW PROFILE BUTTON --- */}
        <Link 
          to="/profile" 
          style={{ 
            display: "inline-block", 
            marginTop: "15px", 
            padding: "8px 16px", 
            backgroundColor: "#fff", 
            color: "#333", 
            textDecoration: "none", 
            borderRadius: "5px",
            fontWeight: "bold"
          }}
        >
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

    {/* Renders previous two sections on the page */}
    </div>
      <DiscoverSection />
      <MatchesSection />
    </>
  );
}

export default Dashboard;
