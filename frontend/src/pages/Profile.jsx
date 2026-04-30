import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { deleteAccount, startConversation } from "../api/client";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import "../layout/AppLayout.css"; 
import "./Profile.css"; 
import { storeUser, getStoredUser } from "../api/client";

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

const stateNameFromCode = (code) =>
  US_STATES.find(s => s.code === code)?.name || code;

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const { user, setUser, logout } = useAuth(); 
  
  // NEW: State for handling edits
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ headline: "", bio: "", location: "" });
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null); 
  const [avatarPreview, setAvatarPreview] = useState(null); 
  const [isEditingBanner, setIsEditingBanner] = useState(false);
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null); 
  const [isEditingHeadline, setIsEditingHeadline] = useState(false);
  const [isEditingLocation, setIsEditingLocation] = useState(false); 
  const [isEditMode, setIsEditMode] = useState(false); 
  //const [editForm, setEditForm] = useState({ bio: "", location: "" });
  const [chatLoading, setChatLoading] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const profileChatTargetId = Number(location.state?.targetUserId ?? profile?.user ?? 0);
  const canMessageProfile =
    Boolean(profileChatTargetId) && Number(profileChatTargetId) !== Number(user?.id);

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

        if(myProfile?.id) {
          setProfile(myProfile); 
        }

        setEditForm({
          headline: myProfile?.headline || "",
          bio: myProfile?.bio || "",
          location: myProfile?.location || "",
        });

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

  // Handle typing in the input boxes
  const handleChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  // Send the updated data to Django
  const resetEditFormFromProfile = () => {
    setEditForm({
      headline: profile?.headline || "",
      bio: profile?.bio || "",
      location: profile?.location || "",
    }); 
  }; 

  const saveProfileFieldsFormData = async (fields, onDone) => {
    if (!profile?.id) return;

    const formData = new FormData();
    Object.entries(fields).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value); 
      }
    });

    try{
      const response = await api.patch(
        `/profiles/${profile.id}/`,
        formData,
        { headers: { "Content-Type": "multipart/form-data"} }
      ); 

      setProfile(response.data);
      setError("");
      setSuccess("Profile updated successfully!");
      setTimeout( () => setSuccess(""), 3000);
      onDone?.();
    } catch (err) {
      console.error("Error saving profile:", err.response?.data || err);
      setError("Failed to save changes. Please try again."); 
    }
  }; 

  // Delete a skill
  const handleInitiateChat = async (targetUserId) => {
    if (!targetUserId) {
      setError("We couldn't determine who to message from this profile.");
      return;
    }

    try {
      setChatLoading(true);
      setError("");
      const conv = await startConversation(targetUserId);
      navigate("/chat", { state: { activeId: conv.id } });
    } catch (err) {
      console.error("Error starting conversation:", err);
      setError(
        err.response?.data?.detail ||
        "Could not open a conversation right now. Please try again."
      );
    } finally {
      setChatLoading(false);
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
  
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleAvatarSave = async () => {
    if(!avatarFile || !profile?.id) return;

    try{
      const formData = new FormData();
      formData.append("profile_image", avatarFile);

      const response = await api.patch(
        `/profiles/${profile.id}/`,
        formData, 
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      setProfile(response.data);

      const updatedAuthUser = {
        ...getStoredUser(),
        profile_image: response.data.profile_image,
      };

      storeUser(updatedAuthUser);
      setUser(updatedAuthUser); 

      setIsEditingAvatar(false);
      setAvatarFile(null);
      setAvatarPreview(null);
      
      setSuccess("Profile picture updated!");
      setTimeout( () => setSuccess(""), 3000);
    } catch (err) {
      console.error("Avatar upload error:", err); 
      setError("Failed to update profile picture"); 
    } 
  };

  const handleAvatarCancel = () => {
    setAvatarFile(null);
    setAvatarPreview(null); 
    setIsEditingAvatar(false); 
  }; 

  const handleBannerChange = (e) => {
    const file = e.target.files[0];
    if (!file) return; 

    setBannerFile(file);
    setBannerPreview(URL.createObjectURL(file));
  }; 

  const handleBannerSave = async () => {
    if (!bannerFile || !profile?.id) return;

    try {
      const formData = new FormData();
      formData.append("banner_image", bannerFile); 

      const response = await api.patch(
        `/profiles/${profile.id}/`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" }} 
      ); 

      setProfile(response.data); 
      setIsEditingBanner(false); 
      setBannerFile(null);
      setBannerPreview(null); 

      setSuccess("Banner Updated!"); 
      setTimeout( () => setSuccess(""), 3000); 
    } catch (err) {
      console.error("Banner upload failed:", err);
      setError("Failed to update banner."); 
    }
  }; 

  const handleBannerCancel = () => {
    setIsEditingBanner(false);
    setBannerFile(null);
    setBannerPreview(null); 
  }; 

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "Delete your account permanently? This will remove your profile, skills, and swap requests. Your chat messages will remain visible to other users as sent by a deleted account."
    );

    if (!confirmed) return;

    try {
      setIsDeletingAccount(true);
      setError("");
      await deleteAccount();
      logout();
      navigate("/register", { replace: true });
    } catch (err) {
      console.error("Account deletion failed:", err);
      setError("We couldn't delete your account right now. Please try again.");
      setIsDeletingAccount(false);
    }
  };

  if (loading) return <div className="section-card"><p>Loading your profile...</p></div>;
  if (!profile && !loading && !error && skills.length === 0) {
    return <div className="section-card"><p>No profile data found.</p></div>;
  }

  return (
    <div className="profile-shell">
      <div className="profile-page"> 
        {/* Error and success banners */}
        {error && <div className="banner-error">{error}</div>}
        {success && <div className="banner-success">{success}</div>}

        {isEditMode && (
          <div className="profile-edit-actions">
            <button
              className="secondary-btn"
                onClick={ () => {
                  setIsEditMode(false);
                  setIsEditingAvatar(false);
                  setIsEditingBanner(false);
                  setIsEditingHeadline(false);
                  setIsEditingLocation(false);
                  setIsEditing(false); 
              } }
            >
              Done editing 
            </button>
          </div>
        )}
      
        {/* profile header */}
        <section className="profile-header-card">
          <div className="profile-banner">
            {bannerPreview ? (
              <img src={bannerPreview} alt="Banner preview" />
            ) : profile?.banner_image ? (
              <img
              src={profile.banner_image.startsWith('http') ? profile.banner_image : `http://localhost:8000${profile.banner_image}`}
              alt="Profile banner"
              />
            ) : null}

            <div className="banner-actions">
              {isEditMode && !isEditingBanner && (
                <button className="edit-profile-btn" onClick={ () => setIsEditingBanner(true)}>
                  Edit
                </button>
              )}

              {isEditingBanner && (
                <>
                  <label className="secondary-btn">
                    Upload
                      <input 
                        type="file" 
                        accept="image/*"
                        hidden onChange={handleBannerChange}
                      />
                  </label>

                  <button className="secondary-btn" onClick={handleBannerCancel}>
                    Cancel
                  </button>

                  <button className="save-btn" onClick={handleBannerSave} disabled={!bannerFile}>
                    Save
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="profile-avatar-wrapper">
            <div className="avatar-circle">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar preview" />
                ) : profile?.profile_image ? (
                <img
                src={profile.profile_image.startsWith('http') ? profile.profile_image : `http://localhost:8000${profile.profile_image}`}
                alt="Profile avatar"
                />
              ) : (
              
              <div className="avatar-placeholder" />
              )}
            </div>
            
            <div className="avatar-actions"> 
              {!isEditMode && (
                <button className="edit-profile-btn" 
                  onClick={ () => {
                    setIsEditMode(true);
                    setIsEditingAvatar(true); 
                  } }
                >
                  Edit profile
                </button>
              )}
              
              {isEditMode && isEditingAvatar && (
                <>
                  <label className="secondary-btn">
                    Upload
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      hidden
                    />
                  </label>
                
                  <button className="secondary-btn" onClick={handleAvatarCancel}>
                    Cancel
                  </button>
                
                  <button className="save-btn" onClick={handleAvatarSave} disabled={!avatarFile}>
                    Save
                  </button>
                </>
              )}
            </div>
          </div>
          
        
          <div className="profile-header-content">
            <div className="profile-meta">
              <h2 className="profile-name">
                {profile?.first_name || "User"}
              </h2>

              <div className="headline-row">
                {!isEditingHeadline ? (
                  <>
                    <p className="profile-role">
                    {profile?.headline || "Headline not set."}
                    </p>

                    {isEditMode && (
                      <button className="edit-profile-btn" 
                        onClick={ () => setIsEditingHeadline(true) }
                      >
                        Edit
                      </button>
                    ) }
                  </>
                ) : (
                  <>
                    <input 
                      type="text"
                      name="headline"
                      value={editForm.headline}
                      onChange={handleChange}
                      className="headline-input"
                      placeholder="Add a headline (e.g. Student)"
                      autoFocus
                    />
                    
                    <button className="secondary-btn" onClick={ () => {
                        resetEditFormFromProfile(); 
                        setIsEditingHeadline(false); 
                      }}
                    >
                      Cancel
                    </button>

                    <button className="save-btn" onClick={ () => {
                      saveProfileFieldsFormData(
                        { headline: editForm.headline },
                          () => setIsEditingHeadline(false) 
                        ) 
                      }}
                    >
                      Save
                    </button>
                  </>
                ) }
              </div>
              
              <div className="location-row">
                {!isEditingLocation ? (
                  <>
                    <p className="profile-location">
                      {profile?.location
                      ? stateNameFromCode(profile.location)
                      : "Location not set."}
                    </p>

                    {isEditMode && (
                      <button
                      className="edit-profile-btn"
                      onClick={ () => setIsEditingLocation(true) }
                    >
                      Edit
                    </button>
                    )} 
                  </>
                ) : (
                  <>
                    <select
                      value={editForm.location}
                      onChange={(e) =>
                        setEditForm({ ...editForm, location: e.target.value })
                      }
                      className="location-select"
                    >
                      <option value="">Select state</option>
                      {US_STATES.map(({ code, name }) => (
                        <option key={code} value={code}>
                          {name}
                        </option>
                      ))}
                    </select>

                    <button
                      className="secondary-btn"
                      onClick={() => {
                        resetEditFormFromProfile(); 
                        setIsEditingLocation(false);
                      }}
                    >
                      Cancel
                    </button>

                    <button
                      className="save-btn"
                      disabled={!editForm.location}
                      onClick={ () => 
                        saveProfileFieldsFormData(
                          { location: editForm.location },
                          () => setIsEditingLocation(false)
                        )
                      }
                    >
                      Save
                    </button>
                  </>
                ) }
              </div>
              
              <div className="profile-actions">
                <button className="primary-btn" onClick={() => navigate("/chat")}>
                  Messages
                </button>
                
                <button className="secondary-btn" onClick={() => navigate("/listings")}>
                  Marketplace
                </button>
              </div>
              
              <div className="profile-rating">
                RATING #/10
              </div>
            </div>
          </div>
        </section>
      
        {/* about */}
        <section className="profile-card">
          <div className="card-header">
            <h3>About</h3>
            <div className="about-actions">
              {!isEditing && isEditMode && (
                <button className="edit-profile-btn" onClick={() => setIsEditing(true)}
                >
                Edit
                </button>
              )}
              
              { isEditing && (
                <>
                  <button className="secondary-btn" onClick={() => {
                    resetEditFormFromProfile(); 
                    setIsEditing(false);
                    }}
                  >
                  Cancel
                  </button>
                
                  <button
                    className="save-btn"
                    onClick={ () =>
                      saveProfileFieldsFormData(
                        { bio: editForm.bio },
                        () => setIsEditing(false)
                      )
                    }
                  >
                  Save
                  </button>
                </>
              )}
            </div>
          </div>
          
          {isEditing ? (
            <textarea
            name="bio"
            value={editForm.bio}
            onChange={handleChange}
            className="profile-textarea"
            />
            ) : (
            <p className="profile-text">
              {profile?.bio || "No bio added yet."}
            </p>
          )}
        </section>
      
        {/* skills */}
        <section className="profile-card">
          <h3>Skills</h3>
          {skills.length === 0 ? (
            <p>No skills added yet.</p>
          ) : (
            <div className="skills-card-grid">
              {skills.map(skill => (
                <div key={skill.id} className="skill-card">
                  <button 
                  className="skill-delete" 
                  onClick={ () => handleDeleteSkill(skill.id)}
                  aria-label="Delete skill"
                  >
                    x
                  </button>
                  <h4 className="skill-title">{skill.title}</h4>
                  {skill.description && (
                    <p className="skill-description">
                      {skill.description}
                    </p>
                  )}

                  {skill.category && (
                    <span className="skill-tag">
                      {skill.category.toUpperCase()}
                    </span>
                  ) }
                </div>
              ) ) }
            </div>
          ) }
        </section>
      
        {/* rating */}
        <section className="profile-card ratings-card">
          <h3>Ratings</h3>
          <div className="ratings-grid">
            {[1, 2, 3].map(i => (
            <div key={i} className="rating-item">
              <h4>Review title</h4>
              <p>Review body</p>
              <span className="review-meta">
                Review date
              </span>
            </div>
            ))}
          </div>
        </section>

        <section className="profile-card danger-zone-card">
          <div className="danger-zone-header">
            <div>
              <h3>Danger Zone</h3>
              <p className="danger-zone-copy">
                Permanently delete your account, profile, skills, and swap requests.
                Existing chat history stays available to the other participant as coming from a deleted account.
              </p>
            </div>
            <button
              className="danger-btn"
              onClick={handleDeleteAccount}
              disabled={isDeletingAccount}
            >
              {isDeletingAccount ? "Deleting..." : "Delete Account"}
            </button>
          </div>
        </section>
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
