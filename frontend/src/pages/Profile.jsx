import { useState, useEffect } from "react";
import api from "../services/api";
import "../layout/AppLayout.css"; 
import "./Dashboard.css"; 

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // NEW: State for handling edits
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ bio: "", location: "" });

  useEffect(() => {
    api.get('profiles/') 
      .then((response) => {
        // Log this so we can see exactly what 'Person' is receiving
        console.log("DATA RECEIVED FOR LOGGED-IN USER:", response.data);

        // Handle both paginated results and direct lists
        const data = response.data.results ? response.data.results : response.data;
        
        // If the list is empty, it means the backend can't find 'Person's' profile
        if (Array.isArray(data) && data.length > 0) {
          const myProfile = data[0];
          setProfile(myProfile);
          setEditForm({ bio: myProfile.bio || "", location: myProfile.location || "" });
        } else if (!Array.isArray(data) && data.id) {
          // If Django sent a single object instead of a list
          setProfile(data);
          setEditForm({ bio: data.bio || "", location: data.location || "" });
        } else {
          setError("No profile found. Please ensure you are logged in as the correct user.");
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Fetch error:", err);
        setError("Connection error. Try logging out and back in.");
        setLoading(false);
      });
  }, []);

  // NEW: Handle typing in the input boxes
  const handleChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  // NEW: Send the updated data to Django
  const handleSave = async () => {
    // Check if we actually have an ID before sending
    if (!profile || !profile.id) {
      alert("Error: Profile ID not found. Try refreshing the page.");
      return;
    }

    try {
      const response = await api.patch(`/profiles/${profile.id}/`, editForm);
      setProfile(response.data);
      setIsEditing(false);
    } catch (err) {
      console.error("Error saving profile:", err);
    }
  };

  if (loading) return <div className="section-card"><p>Loading your profile...</p></div>;
  if (error) return <div className="section-card"><p style={{ color: "red" }}>{error}</p></div>;
  if (!profile) return <div className="section-card"><p>Profile Not Found</p></div>;

  return (
    <div className="section-card">
      <div className="discover">
        <header className="discover-header">
          <h2>Your Profile</h2>
          {/* NEW: Toggle between Edit and Save buttons */}
          {isEditing ? (
            <div>
              <button onClick={handleSave} className="icon-button" style={{ fontSize: "0.9rem", padding: "5px 10px", backgroundColor: "#4CAF50", color: "white", marginRight: "10px" }}>
                Save
              </button>
              <button onClick={() => setIsEditing(false)} className="icon-button" style={{ fontSize: "0.9rem", padding: "5px 10px" }}>
                Cancel
              </button>
            </div>
          ) : (
            <button onClick={() => setIsEditing(true)} className="icon-button" style={{ fontSize: "0.9rem", padding: "5px 10px" }}>
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
                {profile.bio || "You haven't written a bio yet. Tell the community about yourself!"}
              </p>
            )}
          </div>

          <div style={{ marginBottom: "15px" }}>
            <h3 style={{ margin: "0 0 5px 0", color: "#555" }}>Location</h3>
            {/* NEW: Show input if editing, otherwise show regular text */}
            {isEditing ? (
              <input 
                type="text"
                name="location"
                value={editForm.location}
                onChange={handleChange}
                style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
              />
            ) : (
              <p style={{ margin: 0 }}>
                {profile.location || "No location set."}
              </p>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
}