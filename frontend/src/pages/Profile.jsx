import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import api from "../services/api";
import "../layout/AppLayout.css"; 
import "./Dashboard.css"; 

const US_STATES = [
  { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' }, { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' }, { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' }, { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' }, { code: 'HI', name: 'Hawaii' }, { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' }, { code: 'IN', name: 'Indiana' }, { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' }, { code: 'KY', name: 'Kentucky' }, { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' }, { code: 'MD', name: 'Maryland' }, { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' }, { code: 'MN', name: 'Minnesota' }, { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' }, { code: 'MT', name: 'Montana' }, { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' }, { code: 'NH', name: 'New Hampshire' }, { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' }, { code: 'NY', name: 'New York' }, { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' }, { code: 'OH', name: 'Ohio' }, { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' }, { code: 'PA', name: 'Pennsylvania' }, { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' }, { code: 'SD', name: 'South Dakota' }, { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' }, { code: 'UT', name: 'Utah' }, { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' }, { code: 'WA', name: 'Washington' }, { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' }, { code: 'WY', name: 'Wyoming' }
];

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const location = useLocation();
  
  // NEW: State for handling edits
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ bio: "", location: "" });

  useEffect(() => {
    let isMounted = true;

    async function loadProfilePage() {
      try {
        const [profileResponse, skillsResponse] = await Promise.all([
          api.get("profiles/"),
          api.get("skills/", { params: { mine: "true" } }),
        ]);

        if (!isMounted) return;

        // Handle profile data which might be an array or a single object
        const profileData = profileResponse.data.results ?? profileResponse.data;
        const myProfile = Array.isArray(profileData) ? profileData[0] : profileData;

        if (myProfile?.id) {
          setProfile(myProfile);
          setEditForm({
            bio: myProfile.bio || "",
            location: myProfile.location || "",
          });
        }  else {
          console.warn("Profile not found, but continuing to load skills...");
        }

        // Handle skills data which might also be an array or a single object
        const skillsData = skillsResponse.data.results ?? skillsResponse.data;

        console.log("Debug - Skills received:", skillsData);

        setSkills(Array.isArray(skillsData) ? skillsData : []);

      } catch (err) {
        if (!isMounted) return;
        console.error("Profile page fetch error:", err);
        setError("We couldn't load your profile and skills. Try refreshing the page.");
      }  finally {
        if (isMounted) setLoading(false);
      }
    }

    loadProfilePage();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    // Check if we arrived here with a "flash message"
    if (location.state?.message) {
      setSuccess(location.state.message);

      // Clear it after 3 seconds
      const timer = setTimeout(() => setSuccess(""), 3000);
      window.history.replaceState({}, document.title);

      return () => clearTimeout(timer);
    } 
  }, [location.state]);

  // NEW: Handle typing in the input boxes
  const handleChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  // NEW: Send the updated data to Django
  const handleSave = async () => {
    // Check if we actually have an ID before sending
    if (!profile?.id) {
      setError("Profile ID not found. Please refresh.");
      return;
    }

    try {
      const response = await api.patch(`/profiles/${profile.id}/`, editForm);
      setProfile(response.data);
      setIsEditing(false);
      setError(""); // Clear any old errors

      // Show success message
      setSuccess("Profile updated successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error saving profile:", err);
      setError("Failed to save changes. Please try again.");
    }
  };

  // NEW: Delete a skill
  const handleDeleteSkill = async (skillId) => {
    if (!window.confirm("Are you sure you want to delete this skill?")) return;

    try {
      await api.delete(`/skills/${skillId}/`);

      // Update the UI by filtering out the deleted skill
      setSkills(current => current.filter(s => s.id !== skillId));

      // Clear any previous errors if the delete is successful
      setError("");
      setSuccess("Skill deleted successfully!");
      setTimeout(() => setSuccess(""), 3000);
    }  catch (err) {
      console.error("Error deleting skill:", err);

      // Set the integrated error message instead of an alert
      setError("Failed to delete the skill. Please try again.");

      // Auto-hide the error message after 3 seconds
      setTimeout(() => setError(""), 3000);  
    }
  };

  if (loading) return <div className="section-card"><p>Loading your profile...</p></div>;
  if (!profile && !loading && !error && skills.length === 0) {
    return <div className="section-card"><p>No profile data found.</p></div>;
  }
  
  return (
    <div className="section-card">
      {/* NEW: Integrated Error Banner */}
      {error && (
        <div style={{
          backgroundColor: "#fee2e2",
          color: "#b91c1c",
          padding: "10px",
          borderRadius: "6px",
          marginBottom: "15px",
          border: "1px solid #fecaca",
          fontSize: "0.9rem",
          textAlign: "center"
        }}>
          {error}
        </div>
      )}

      {/* NEW: Success Banner */}
      {success && (
        <div style={{
          backgroundColor: "#dcfce7",
          color: "#15803d",
          padding: "10px",
          borderRadius: "6px",
          marginBottom: "15px",
          border: "1px solid #bbf7d0",
          fontSize: "0.9rem",
          textAlign: "center"
        }}>
          {success}
        </div>
      )}


      <div className="discover">
        <header className="discover-header">
          <h2>Your Profile</h2>
          {isEditing ? (
            <div>
              <button 
                onClick={handleSave} 
                className="add-skill-primary-action" 
                style={{ padding: "5px 15px" }}
              >
                Save
              </button>
              <button 
                onClick={() => setIsEditing(false)} 
                className="add-skill-secondary-action"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setIsEditing(true)} 
              className="add-skill-secondary-action"
            >
              Edit Profile
            </button>
          )}
        </header>
        
        <div className="profile-details" style={{ marginTop: "20px" }}>
          
          <div style={{ marginBottom: "15px" }}>
            <h3 style={{ margin: "0 0 5px 0", color: "#555" }}>Bio</h3>
            {/* NEW: Show text area if editing, otherwise show regular text */}
            {isEditing ? (
              <textarea 
                name="bio"
                value={editForm.bio}
                onChange={handleChange}
                style={{ width: "100%", minHeight: "80px", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
              />
            ) : (
              <p style={{ margin: 0, lineHeight: "1.5" }}>
                {profile?.bio || "You haven't written a bio yet. Tell the community about yourself!"}
              </p>
            )}
          </div>

          <div style={{ marginBottom: "15px" }}>
            <h3 style={{ margin: "0 0 5px 0", color: "#555" }}>Location</h3>
            {/* NEW: Show input if editing, otherwise show regular text */}
            {isEditing ? (
              <select 
                name="location" 
                value={editForm.location} 
                onChange={handleChange} 
                style={inputStyle}
              >
                {US_STATES.map(state => (
                  <option key={state.code} value={state.code}>{state.name}</option>
                ))}
              </select>
            ) : (
              <p style={{ margin: 0 }}>
                {/* Helper: Shows 'Wisconsin' instead of just 'WI' */}
                {US_STATES.find(s => s.code === profile?.location)?.name || profile?.location || "No location set."}
              </p>
            )}
          </div>
        </div>

        <div style={{ marginTop: "28px" }}>
          <h3 style={{ margin: "0 0 12px 0", color: "#555" }}>Your Skills</h3>

          {skills.length === 0 ? (
            <p style={{ margin: 0, color: "#64748B" }}>
              You have not added any skills yet.
            </p>
          ) : (
            <div className="discover-feed">
              {skills.map((skill) => (
                <article key={skill.id} className="skill-card" style={{ position: "relative" }}>
                  {/* THE DELETE BUTTON */}
                  <button
                  onClick={() => handleDeleteSkill(skill.id)}
                  style={{
                    position: "absolute",
                    top: "10px",
                    right: "10px",
                    background: "none",
                    border: "none",
                    color: "#ef4444",
                    fontSize: "1.2rem",
                    cursor: "pointer",
                    fontWeight: "bold"
                  }}
                  title="Delete Skill"
                >
                  ×
                </button>

                <h3>{skill.title}</h3>
                <p>{skill.description}</p>
                <span className="skill-tag">{skill.category || "General"}</span>
              </article>
            ))}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

const bannerStyle = (bg, color) => ({
  backgroundColor: bg, color: color, padding: "10px", borderRadius: "6px", marginBottom: "15px", border: `1px solid ${color}55`, textAlign: "center"
});
const labelStyle = { margin: "0 0 5px 0", color: "#555" };
const inputStyle = { width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc", minHeight: "38px" };
const deleteBtnStyle = { position: "absolute", top: "10px", right: "10px", background: "none", border: "none", color: "#ef4444", fontSize: "1.2rem", cursor: "pointer" };