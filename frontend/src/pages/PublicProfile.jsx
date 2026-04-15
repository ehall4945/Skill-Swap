import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import "../layout/AppLayout.css";
import "./Profile.css";

const US_STATES = [
  { code: "AL", name: "Alabama" }, { code: "AK", name: "Alaska" }, { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" }, { code: "CA", name: "California" }, { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" }, { code: "DE", name: "Delaware" }, { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" }, { code: "HI", name: "Hawaii" }, { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" }, { code: "IN", name: "Indiana" }, { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" }, { code: "KY", name: "Kentucky" }, { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" }, { code: "MD", name: "Maryland" }, { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" }, { code: "MN", name: "Minnesota" }, { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" }, { code: "MT", name: "Montana" }, { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" }, { code: "NH", name: "New Hampshire" }, { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" }, { code: "NY", name: "New York" }, { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" }, { code: "OH", name: "Ohio" }, { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" }, { code: "PA", name: "Pennsylvania" }, { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" }, { code: "SD", name: "South Dakota" }, { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" }, { code: "UT", name: "Utah" }, { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" }, { code: "WA", name: "Washington" }, { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" }, { code: "WY", name: "Wyoming" },
];

const stateNameFromCode = (code) =>
  US_STATES.find((state) => state.code === code)?.name || code || "";

function getNameInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .map((chunk) => chunk[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "SS";
}

function SkillGrid({ title, skills, fallbackText }) {
  return (
    <section className="profile-card">
      <h3>{title}</h3>

      {skills.length > 0 ? (
        <div className="skills-card-grid">
          {skills.map((skill) => (
            <article key={skill.id} className="skill-card">
              {skill.category ? (
                <span className="skill-tag">{skill.category.toUpperCase()}</span>
              ) : null}
              <h4 className="skill-title">{skill.title}</h4>
              {skill.description ? (
                <p className="skill-description">{skill.description}</p>
              ) : (
                <p className="public-profile-note">No description provided yet.</p>
              )}
            </article>
          ))}
        </div>
      ) : (
        <p className="public-profile-note">{fallbackText}</p>
      )}
    </section>
  );
}

export default function PublicProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [profile, setProfile] = useState(null);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const numericUserId = Number(userId);
  const isOwnProfile = Number(user?.id) === numericUserId;

  useEffect(() => {
    let isMounted = true;

    async function loadPublicProfile() {
      if (!Number.isInteger(numericUserId) || numericUserId <= 0) {
        setError("This profile link is invalid.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await api.get(`/profiles/public/${numericUserId}/`);

        if (!isMounted) return;

        setProfile(response.data?.profile ?? null);
        setSkills(Array.isArray(response.data?.skills) ? response.data.skills : []);
        setError("");
      } catch (requestError) {
        if (!isMounted) return;

        setProfile(null);
        setSkills([]);
        setError(
          requestError.response?.status === 404
            ? "We couldn't find that member profile."
            : "We couldn't load this profile right now. Please try again."
        );
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadPublicProfile();

    return () => {
      isMounted = false;
    };
  }, [numericUserId]);

  const offeredSkills = useMemo(
    () => skills.filter((skill) => skill.skill_type === "OFFER"),
    [skills]
  );
  const requestedSkills = useMemo(
    () => skills.filter((skill) => skill.skill_type === "REQUEST"),
    [skills]
  );

  const displayName = profile?.full_name || "Community Member";
  const displayLocation =
    profile?.location_display ||
    stateNameFromCode(profile?.location) ||
    "Location not shared";
  const headline =
    profile?.headline?.trim() ||
    "Open to exchanging skills and learning with the community.";
  const aboutText =
    profile?.bio?.trim() ||
    "This member has not added a detailed bio yet, but their listed skills are ready to explore.";
  const initials = getNameInitials(displayName);

  if (loading) {
    return (
      <div className="profile-shell">
        <div className="profile-page">
          <section className="profile-card">
            <p>Loading member profile...</p>
          </section>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-shell">
        <div className="profile-page">
          <section className="profile-card">
            {error ? <div className="banner-error">{error}</div> : null}
            <div className="public-profile-actions-row">
              <Link to="/listings" className="primary-btn public-profile-link-btn">
                Back to Marketplace
              </Link>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-shell">
      <div className="profile-page">
        {error ? <div className="banner-error">{error}</div> : null}

        <section className="profile-header-card">
          <div className="profile-banner public-profile-banner">
            {profile.banner_image ? (
              <img src={profile.banner_image} alt={`${displayName} banner`} />
            ) : (
              <div className="public-profile-banner-placeholder" />
            )}
          </div>

          <div className="profile-avatar-wrapper">
            <div className="avatar-circle">
              {profile.profile_image ? (
                <img src={profile.profile_image} alt={`${displayName} avatar`} />
              ) : (
                <div className="public-profile-avatar-fallback">{initials}</div>
              )}
            </div>
          </div>

          <div className="profile-header-content">
            <div className="profile-meta public-profile-meta">
              <p className="public-profile-eyebrow">Member Profile</p>
              <h2 className="profile-name">{displayName}</h2>
              <p className="profile-role">{headline}</p>
              <p className="profile-location">{displayLocation}</p>

              <div className="public-profile-summary">
                <span>{skills.length} listed {skills.length === 1 ? "skill" : "skills"}</span>
                <span>{profile.experience_level_display || "Learner"}</span>
              </div>

              <div className="profile-actions">
                <Link to="/listings" className="primary-btn public-profile-link-btn">
                  Back to Marketplace
                </Link>

                {isOwnProfile ? (
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => navigate("/profile")}
                  >
                    Edit My Profile
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <section className="profile-card">
          <div className="card-header">
            <h3>About</h3>
            <span className="public-profile-section-note">
              {profile.experience_level_display || "Skill-Swap Member"}
            </span>
          </div>
          <p className="profile-text">{aboutText}</p>
        </section>

        <SkillGrid
          title="Skills Offered"
          skills={offeredSkills}
          fallbackText={
            profile.skills_offered?.trim() ||
            "This member has not posted any offered skills yet."
          }
        />

        <SkillGrid
          title="Learning Goals"
          skills={requestedSkills}
          fallbackText={
            profile.skills_wanted?.trim() ||
            "This member has not posted any learning goals yet."
          }
        />
      </div>
    </div>
  );
}
