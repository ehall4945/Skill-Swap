import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import "../layout/AppLayout.css";
import "./Dashboard.css";
import "./AddSkill.css";
import "./Listings.css";

// 1. HELPER: Handles both [list] and {results: [list]} from Django
function normalizeSkillsPayload(data) {
  const skillsData = data?.results ?? data;
  return Array.isArray(skillsData) ? skillsData : [];
}

// 2. HELPER: Extracts clean error messages from Django Rest Framework
function getApiErrorMessage(error, fallbackMessage) {
  const apiData = error.response?.data;
  if (apiData?.detail) return apiData.detail;
  if (typeof apiData === "object") {
    const firstError = Object.values(apiData).flat()[0];
    if (typeof firstError === "string") return firstError;
  }
  return fallbackMessage;
}

// 3. HELPER: Decides what name to show for the skill owner
function getProviderName(skill) {
  return skill.user_name || skill.owner_name || "Community Member";
}

export default function Listings() {
  const navigate = useNavigate();
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Filters & View State
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [showOnlyMine, setShowOnlyMine] = useState(false);

  // Interaction State
  const [connectingSkillId, setConnectingSkillId] = useState(null);

  // Fetch logic - triggers whenever showOnlyMine changes
  useEffect(() => {
    let isMounted = true;

    async function loadSkills() {
      setLoading(true);
      try {
        // Uses the ?mine=true parameter we built in the Django view
        const url = showOnlyMine ? "skills/?mine=true" : "skills/";
        const response = await api.get(url);

        if (!isMounted) return;
        setSkills(normalizeSkillsPayload(response.data));
        setError("");
      } catch (err) {
        if (!isMounted) return;
        setError(getApiErrorMessage(err, "Could not load skills."));
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadSkills();
    return () => { isMounted = false; };
  }, [showOnlyMine]);

  // Handle Swap Request (POST)
  const handleConnect = async (skillId, user) => {
    // SECURITY: Ensure we have an ID, even if 'user' is an object
    const receiverId = typeof user === "object" ? user.id : user;

    if (!receiverId) {
      setError("Owner information missing for this skill.");
      return;
    }

    try {
      setConnectingSkillId(skillId);
      setError("");

      await api.post("requests/", {
        skill: skillId,
        receiver: receiverId, // Matches SwapRequestSerializer
      });

      navigate("/requests", {
        state: { message: "Swap request sent! You can track it in My Swaps." },
      });
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to send request."));
    } finally {
      setConnectingSkillId(null);
    }
  };

  // Client-side filtering logic
  const categories = ["All", ...new Set(skills.map(s => s.category).filter(Boolean))].sort();
  
  const filteredSkills = skills.filter(skill => {
    const matchesSearch = (skill.title + skill.description).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = categoryFilter === "All" || skill.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  if (loading && skills.length === 0) {
    return <div className="dashboard-section"><p>Loading skills...</p></div>;
  }

  return (
    <div className="dashboard-section">
      <section className="section-card">
        {/* Feedback Banners */}
        {error && <div className="listings-banner listings-banner--error">{error}</div>}

        <div className="discover">
          <header className="discover-header">
            <div>
              <h2>{showOnlyMine ? "My Skills" : "Marketplace"}</h2>
              <p className="listings-subtitle">
                {showOnlyMine ? "Manage the skills you have listed." : "Connect with others to swap skills."}
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="add-skill-primary-action"
                onClick={() => navigate("/skills/new")}
              >
                Create New Skill
              </button>
              <button 
                type="button"
                className="add-skill-primary-action" 
                onClick={() => setShowOnlyMine(!showOnlyMine)}
              >
                {showOnlyMine ? "View All Skills" : "View My Skills"}
              </button>
            </div>
          </header>

          {/* Filter Bar */}
          <div className="listings-filter-bar">
            <div className="listings-filter-row">
              <input
                placeholder="Search skills..."
                className="listings-field-control"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <select 
                className="listings-field-control"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Grid */}
          <div className="discover-feed">
            {filteredSkills.map((skill) => {
              const isConnecting = connectingSkillId === skill.id;

              return (
                <article key={skill.id} className="skill-card">
                  <div className="skill-card__content">
                    <span className="skill-tag">{skill.category}</span>
                    <h3>{skill.title}</h3>
                    <p className="skill-provider-info">By <strong>{getProviderName(skill)}</strong></p>
                    <p className="skill-card__description">{skill.description}</p>
                  </div>

                  <div className="skill-card__footer">
                    <Link
                      to={`/profile/${skill.user}`}
                      className="skill-card__profile-link"
                    >
                      View Profile
                    </Link>

                    {!showOnlyMine && (
                      <button
                        className="add-skill-primary-action skill-card__connect-button"
                        onClick={() => handleConnect(skill.id, skill.user)}
                        disabled={isConnecting}
                      >
                        {isConnecting ? "Sending..." : "Connect"}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
