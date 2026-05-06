import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, X, Ellipsis, Info } from "lucide-react";
import api from "../services/api";
import demoProfile from "../images/demo-profile.png";
import "./DiscoverSection.css";

/* A maximum of three profiles will ever be displayed at a time */
const VISIBLE_COUNT = 3;

/* 
*  Large displays = 3 cards 
*  Medium displays = 2 cards
*  Small displays = 1 card
*  Undefined display (catch all) = 3 cards
*/
function getDisplayCount() {
  if (typeof window === "undefined") return 3;
  if (window.innerWidth <= 760) return 1;
  if (window.innerWidth <= 1200) return 2;
  return 3;
}

function normalizeSkillsPayload(data) {
  const skillsData = data?.results ?? data;
  return Array.isArray(skillsData) ? skillsData : [];
}

function getApiErrorMessage(error, fallbackMessage) {
  const apiData = error.response?.data;

  if (typeof apiData?.detail === "string") {
    return apiData.detail;
  }

  if (typeof apiData === "object" && apiData !== null) {
    const firstError = Object.values(apiData).flat()[0];
    if (typeof firstError === "string") return firstError;
  }

  return fallbackMessage;
}

function normalizeImageUrl(imageUrl) {
  if (!imageUrl) return demoProfile;
  if (imageUrl.startsWith("http")) return imageUrl;
  return `http://localhost:8000${imageUrl}`;
}

function getFirstName(skill) {
  if (skill.owner_first_name?.trim()) return skill.owner_first_name.trim();
  if (skill.owner_name?.trim()) return skill.owner_name.trim().split(" ")[0];
  return "Community Member";
}

function getOwnerId(skill) {
  return typeof skill.user === "object" ? skill.user?.id : skill.user;
}

function buildRuntimeId(id) {
  return `${id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/*
*  Builds the internal queue from real backend skill postings.
*  Each skill posting becomes one Discover card.
*/
function buildQueue(skills) {
  return skills.map((skill, index) => ({
    id: skill.id,
    skillId: skill.id,
    ownerId: getOwnerId(skill),
    name: getFirstName(skill),
    fullName: skill.owner_name || getFirstName(skill),
    pronouns: "",
    headline: skill.owner_headline || `Offering ${skill.title}`,
    location: skill.owner_location_display || skill.owner_location || "Location not listed",
    teaches: skill.title,
    seeking: skill.owner_skills_wanted || "a new skill exchange",
    description: skill.description,
    category: skill.category,
    accent: index % 2 === 0 ? "purple" : "blue",
    image: normalizeImageUrl(skill.owner_profile_image),
    isIncoming: false,
    runtimeId: buildRuntimeId(skill.id),
  }));
}

/*
*  Individual profile card component.
*  Handles rendering profile information and user interactions
*  such as "Pass" or "Yes". Also manages the mobile overflow menu.
*/
function ProfileCard({ profile, onDecision, disabled }) {
  const [showMobileActions, setShowMobileActions] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);

  const accentClass =
    profile.accent === "blue"
      ? "discover-card__image-frame--blue"
      : "discover-card__image-frame--purple";

  /* 
  *  Handles mobile menu actions and forwards the decision
  *  back up to the parent DiscoverSection component.
  */
  const handleAction = (action) => {
    setShowMobileActions(false);
    onDecision(profile.runtimeId, action);
  };

  return (
  <motion.article
    layout="position"
    initial={profile.isIncoming ? { opacity: 0, x: 90 } : false}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -40 }}
    transition={{
      layout: { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
      x: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
      opacity: { duration: 0.2, ease: "easeOut" },
    }}
    className="discover-card"
  >
    <button
      type="button"
      className="discover-card__info-btn"
      aria-label={
        isFlipped
          ? `Show summary for ${profile.name}`
          : `Show more info for ${profile.name}`
      }
      onClick={() => {
        setShowMobileActions(false);
        setIsFlipped((prev) => !prev);
      }}
      disabled={disabled}
    >
      <Info size={16} strokeWidth={2.4} />
    </button>

    <motion.div
      className="discover-card__flip-shell"
      animate={{ rotateY: isFlipped ? 180 : 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      style={{ transformStyle: "preserve-3d" }}
    >
      <div className="discover-card__face discover-card__face--front">
        <div className="discover-card__image-wrap">
          <div className={`discover-card__image-frame ${accentClass}`}>
            <img
              src={profile.image}
              alt={`${profile.name} profile`}
              className="discover-card__image"
            />
          </div>
        </div>

        <div className="discover-card__content">
          <div className="discover-card__name-row">
            <h3 className="discover-card__name">{profile.name}</h3>
            {profile.pronouns ? (
              <span className="discover-card__pronouns">({profile.pronouns})</span>
            ) : null}
          </div>

          <p className="discover-card__headline">{profile.headline}</p>
          <p className="discover-card__location">{profile.location}</p>

          <div className="discover-card__skills">
            <p className="discover-card__skill-line">{profile.teaches}</p>
            <p className="discover-card__skill-line">
              Seeking {profile.seeking}
            </p>
          </div>
        </div>

        <div className="discover-card__desktop-actions">
          <button
            type="button"
            disabled={disabled}
            onClick={() => onDecision(profile.runtimeId, "pass")}
            className="discover-card__action-btn discover-card__action-btn--pass"
          >
            <X size={16} strokeWidth={2.5} />
            <span>Pass</span>
          </button>

          <button
            type="button"
            disabled={disabled}
            onClick={() => onDecision(profile.runtimeId, "like")}
            className="discover-card__action-btn discover-card__action-btn--yes"
          >
            <Check size={16} strokeWidth={2.5} />
            <span>Yes</span>
          </button>
        </div>

        <div className="discover-card__mobile-menu-wrap">
          <button
            type="button"
            aria-label={`More options for ${profile.name}`}
            className="discover-card__more-btn"
            onClick={() => setShowMobileActions((prev) => !prev)}
            disabled={disabled}
          >
            <Ellipsis size={18} strokeWidth={2.25} />
          </button>

          <AnimatePresence>
            {showMobileActions && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="discover-card__mobile-actions-popup"
              >
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => handleAction("pass")}
                  className="discover-card__action-btn discover-card__action-btn--pass"
                >
                  <X size={16} strokeWidth={2.5} />
                  <span>Pass</span>
                </button>

                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => handleAction("like")}
                  className="discover-card__action-btn discover-card__action-btn--yes"
                >
                  <Check size={16} strokeWidth={2.5} />
                  <span>Yes</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="discover-card__face discover-card__face--back">
        <div className="discover-card__back-header">
          <h4 className="discover-card__back-title">More about {profile.name}</h4>
          <p className="discover-card__back-subtitle">{profile.location}</p>
        </div>

        <div className="discover-card__back-section">
          <h5 className="discover-card__back-label">About</h5>
          <p className="discover-card__back-text">
            {profile.description || `${profile.name} can help with ${profile.teaches.toLowerCase()}.`}
          </p>
        </div>

        <div className="discover-card__back-section">
          <h5 className="discover-card__back-label">Can help with</h5>
          <p className="discover-card__back-text">{profile.teaches}</p>
        </div>

        <div className="discover-card__back-section">
          <h5 className="discover-card__back-label">Currently seeking</h5>
          <p className="discover-card__back-text">{profile.seeking}</p>
        </div>

        <div className="discover-card__back-section">
          <h5 className="discover-card__back-label">Quick details</h5>
          <ul className="discover-card__back-list">
            <li>{profile.category || "Skill swap"}</li>
            <li>{profile.location}</li>
            <li>Open to skill exchange</li>
          </ul>
        </div>

        <button
          type="button"
          className="discover-card__back-btn"
          onClick={() => setIsFlipped(false)}
          disabled={disabled}
        >
          Back to card
        </button>
      </div>
    </motion.div>
  </motion.article>
  );
}

/*
*  Main Discover feed component.
*  Manages the real backend skill queue, card transitions,
*  user decisions, and responsive card counts.
*/
export default function DiscoverSection() {
  const [queue, setQueue] = useState([]);
  const [visibleProfiles, setVisibleProfiles] = useState([]);
  const [nextQueueIndex, setNextQueueIndex] = useState(VISIBLE_COUNT);
  const [feedback, setFeedback] = useState(null);
  const [busyCardId, setBusyCardId] = useState(null);
  const [pendingProfile, setPendingProfile] = useState(null);
  const [displayCount, setDisplayCount] = useState(getDisplayCount);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadDiscoverSkills() {
      try {
        const response = await api.get("skills/?discover=true");
        const nextQueue = buildQueue(normalizeSkillsPayload(response.data));

        if (!isMounted) return;

        setQueue(nextQueue);
        setVisibleProfiles(nextQueue.slice(0, VISIBLE_COUNT));
        setNextQueueIndex(Math.min(VISIBLE_COUNT, nextQueue.length));
        setLoadError("");
      } catch (error) {
        if (!isMounted) return;
        setLoadError(getApiErrorMessage(error, "We couldn't load skill postings right now."));
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadDiscoverSkills();

    return () => {
      isMounted = false;
    };
  }, []);

  /*
  *  Automatically clears the feedback message
  *  after a short delay once it is displayed.
  */
  useEffect(() => {
    if (!feedback) return undefined;

    const timer = window.setTimeout(() => {
      setFeedback(null);
    }, 1800);

    return () => window.clearTimeout(timer);
  }, [feedback]);

  useEffect(() => {
    const handleResize = () => {
      setDisplayCount(getDisplayCount());
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  /*
  *  Handles a user's decision on a profile card.
  *  "Yes" creates a real swap request before the card leaves the grid.
  */
  const handleDecision = async (runtimeId, action) => {
    if (busyCardId) return;

    const current = visibleProfiles.find(
      (profile) => profile.runtimeId === runtimeId
    );
    if (!current) return;

    setBusyCardId(runtimeId);

    try {
      if (action === "like") {
        await api.post("requests/", {
          skill: current.skillId,
          receiver: current.ownerId,
        });
      } else {
        await api.post("dismissed-skills/", {
          skill: current.skillId,
        });
      }

      const nextProfile = nextQueueIndex < queue.length
        ? {
            ...queue[nextQueueIndex],
            isIncoming: true,
            runtimeId: buildRuntimeId(queue[nextQueueIndex].id),
          }
        : null;

      setPendingProfile(nextProfile);
      setNextQueueIndex((prev) => (nextProfile ? prev + 1 : prev));
      setFeedback({
        name: current.name,
        action,
      });

      setVisibleProfiles((prev) =>
        prev.filter((profile) => profile.runtimeId !== runtimeId)
      );
    } catch (error) {
      setFeedback({
        action: "error",
        message: getApiErrorMessage(error, "Could not send that swap request."),
      });
      setBusyCardId(null);
    }
  };

  /*
  *  Called after a card exit animation completes.
  *  Inserts the pending profile into the grid and
  *  unlocks the interface for the next interaction.
  */
  const handleExitComplete = () => {
    if (pendingProfile) {
      setVisibleProfiles((prev) => [...prev, pendingProfile]);
    }

    setPendingProfile(null);
    setBusyCardId(null);
  };

  const hasVisibleProfiles = visibleProfiles.length > 0;

  /*
  *  Render the Discover section including the title,
  *  feedback banner, and animated grid of profile cards.
  */
  return (
    <section className="discover-section">
      <div className="discover-section__header">
        <div>
          <h2 className="discover-section__title">Discover</h2>
        </div>

        <AnimatePresence mode="wait">
          {feedback ? (
            <motion.div
              key={`${feedback.name || "message"}-${feedback.action}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className={`discover-section__feedback ${
                feedback.action === "like"
                  ? "discover-section__feedback--yes"
                  : feedback.action === "error"
                    ? "discover-section__feedback--error"
                    : "discover-section__feedback--pass"
              }`}
            >
              {feedback.action === "like"
                ? `Interested in ${feedback.name}`
                : feedback.action === "error"
                  ? feedback.message
                  : `Passed on ${feedback.name}`}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <div className="discover-cards-box">
        {loading ? (
          <p className="discover-section__empty-message">Loading skill postings...</p>
        ) : loadError ? (
          <p className="discover-section__empty-message">{loadError}</p>
        ) : !hasVisibleProfiles ? (
          <p className="discover-section__empty-message">
            No new skill postings near you right now. Check back soon for fresh swaps.
          </p>
        ) : (
          <motion.div layout className="discover-grid">
            <AnimatePresence
              initial={false}
              mode="popLayout"
              onExitComplete={handleExitComplete}
            >
            {visibleProfiles.slice(0, displayCount).map((profile) => (
              <ProfileCard
                key={profile.runtimeId}
                profile={profile}
                onDecision={handleDecision}
                disabled={Boolean(busyCardId)}
              />
            ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </section>
  );
}
