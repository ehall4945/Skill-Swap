import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import StarRating from "../components/StarRating";
import { getUserRatings, submitRating } from "../api/ratings";
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

  // Ratings for public profile
  const [ratingsSummary, setRatingsSummary] = useState({
    average: null,
    count: 0,
    can_rate: false,
    my_rating: null,
    reviews: [],
  });
  const [selectedRating, setSelectedRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [ratingMessage, setRatingMessage] = useState("");
  const [savingRating, setSavingRating] = useState(false);
  const [showRatingForm, setShowRatingForm] = useState(false);

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

  // Loads the ratings system for public profiles
  useEffect(() => {
    let isMounted = true;

    async function loadRatings() {
      if (!Number.isInteger(numericUserId) || numericUserId <= 0) {
        return;
      }

      try {
        const data = await getUserRatings(numericUserId);

        if (!isMounted) return;

        setRatingsSummary({
          average: data.average,
          count: data.count || 0,
          can_rate: Boolean(data.can_rate),
          my_rating: data.my_rating || null,
          reviews: Array.isArray(data.reviews) ? data.reviews : [],
        });

        setSelectedRating(data.my_rating?.rating || 0);
        setReviewText(data.my_rating?.review || "");
        setShowRatingForm(Boolean(data.can_rate) && !data.my_rating);

      } catch (requestError) {
        console.error("Failed to load ratings:", requestError);
      }
    }

    loadRatings();

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

  // Handles submitting ratings for users
  const handleSubmitRating = async (event) => {
    event.preventDefault();

    if (!selectedRating) {
      setRatingMessage("Please choose a star rating first.");
      return;
    }

    try {
      setSavingRating(true);
      setRatingMessage("");

      await submitRating({
        user: numericUserId,
        rating: selectedRating,
        review: reviewText,
      });

      const updatedRatings = await getUserRatings(numericUserId);

      setRatingsSummary({
        average: updatedRatings.average,
        count: updatedRatings.count || 0,
        can_rate: Boolean(updatedRatings.can_rate),
        my_rating: updatedRatings.my_rating || null,
        reviews: Array.isArray(updatedRatings.reviews) ? updatedRatings.reviews : [],
      });

      setRatingMessage("Rating saved!");
      setShowRatingForm(false);

    } catch (requestError) {
      setRatingMessage(
        requestError.response?.data?.detail ||
        "Could not save rating right now."
      );
    } finally {
      setSavingRating(false);
    }
  };

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
              <img
              src={profile.banner_image.startsWith('http') ? profile.banner_image : `http://localhost:8000${profile.banner_image}`}
              alt={`${displayName} banner`}
              />
            ) : (
              <div className="public-profile-banner-placeholder" />
            )}
          </div>

          <div className="profile-avatar-wrapper">
            <div className="avatar-circle">
              {profile.profile_image ? (
                <img
                src={profile.profile_image.startsWith('http') ? profile.profile_image : `http://localhost:8000${profile.profile_image}`}
                alt={`${displayName} avatar`}
                />
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

              <div className="profile-rating">
                {ratingsSummary.count > 0 ? (
                  <>
                    ★ {ratingsSummary.average} / 5 · {ratingsSummary.count}{" "}
                    {ratingsSummary.count === 1 ? "review" : "reviews"}
                  </>
                ) : (
                  "No ratings yet"
                )}
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

        {/* Adds ratings card to user profiles */}
        <section className="profile-card ratings-card">
          <div className="card-header">
            <h3>Ratings</h3>
            <span className="public-profile-section-note">
              {ratingsSummary.count > 0
                ? `${ratingsSummary.average} / 5 average`
                : "No ratings yet"}
            </span>
          </div>

          {ratingsSummary.can_rate && ratingsSummary.my_rating && !showRatingForm ? (
            <div className="rating-current-review">
              <p className="public-profile-note">Your rating</p>

              <div className="rating-current-stars">
                ★ {ratingsSummary.my_rating.rating} / 5
              </div>

              {ratingsSummary.my_rating.review ? (
                <p className="rating-current-text">
                  {ratingsSummary.my_rating.review}
                </p>
              ) : (
                <p className="public-profile-note">No written review added.</p>
              )}

              {ratingMessage ? (
                <p className="rating-message">{ratingMessage}</p>
              ) : null}

              <button
                type="button"
                className="primary-btn rating-edit-btn"
                onClick={() => {
                  setSelectedRating(ratingsSummary.my_rating?.rating || 0);
                  setReviewText(ratingsSummary.my_rating?.review || "");
                  setRatingMessage("");
                  setShowRatingForm(true);
                }}
              >
                Edit Your Rating
              </button>
            </div>
          ) : ratingsSummary.can_rate ? (
            <form className="rating-form" onSubmit={handleSubmitRating}>
              <p className="public-profile-note">
                Rate your experience with this match.
              </p>

              <StarRating
                rating={selectedRating}
                setRating={setSelectedRating}
              />

              <textarea
                className="rating-review-input"
                placeholder="Optional: write a short review..."
                value={reviewText}
                onChange={(event) => setReviewText(event.target.value)}
              />

              {ratingMessage ? (
                <p className="rating-message">{ratingMessage}</p>
              ) : null}

              <div className="rating-form-actions">
                <button
                  type="submit"
                  className="primary-btn"
                  disabled={savingRating || selectedRating === 0}
                >
                  {savingRating
                    ? "Saving..."
                    : ratingsSummary.my_rating
                      ? "Update Rating"
                      : "Submit Rating"}
                </button>

                {ratingsSummary.my_rating ? (
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => {
                      setShowRatingForm(false);
                      setSelectedRating(ratingsSummary.my_rating?.rating || 0);
                      setReviewText(ratingsSummary.my_rating?.review || "");
                      setRatingMessage("");
                    }}
                  >
                    Cancel
                  </button>
                ) : null}
              </div>
            </form>
          ) : !isOwnProfile ? (
            <p className="public-profile-note">
              You can rate this member after you match with them.
            </p>
          ) : null}

          <div className="ratings-grid">
            {ratingsSummary.reviews.length > 0 ? (
              ratingsSummary.reviews.map((review) => (
                <div key={review.id} className="rating-item">
                  <h4>★ {review.rating} / 5</h4>

                  {review.review ? (
                    <p>{review.review}</p>
                  ) : (
                    <p>No written review added.</p>
                  )}

                  <span className="review-meta">
                    {review.reviewer_name}
                  </span>
                </div>
              ))
            ) : (
              <p className="public-profile-note">
                No one has reviewed this member yet.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
