import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, X, Ellipsis, Info } from "lucide-react";
import demoProfile from "../images/demo-profile.png";
import "./DiscoverSection.css";

/* Hard coded profiles to use for V1 demo */
const INITIAL_PROFILES = [
  {
    id: 1,
    name: "Kevin",
    pronouns: "He/Him/His",
    headline: "Film Student at UW-Milwaukee",
    location: "Milwaukee, Wisconsin",
    teaches: "Film Tutor",
    seeking: "Spanish Tutor",
    accent: "purple",
    image: demoProfile
  },
  {
    id: 2,
    name: "Anna",
    pronouns: "She/Her/Hers",
    headline: "Spanish Tutor at UW-Milwaukee",
    location: "Milwaukee, Wisconsin",
    teaches: "Spanish Tutor",
    seeking: "JavaScript Help",
    accent: "blue",
    image: demoProfile
  },
  {
    id: 3,
    name: "Mike",
    pronouns: "He/Him/His",
    headline: "Music Student at UW-Milwaukee",
    location: "Milwaukee, Wisconsin",
    teaches: "Guitar Teacher",
    seeking: "Photography Tips",
    accent: "purple",
    image: demoProfile
  },
  {
    id: 4,
    name: "Sara",
    pronouns: "She/Her/Hers",
    headline:
      "Computer Science Student at UW-Milwaukee",
    location: "Milwaukee, Wisconsin",
    teaches: "Python Tutor",
    seeking: "Public Speaking Help",
    accent: "blue",
    image: demoProfile
  },
  {
    id: 5,
    name: "Jordan",
    pronouns: "They/Them",
    headline: "Design Student at UW-Milwaukee",
    location: "Milwaukee, Wisconsin",
    teaches: "UI Design Tutor",
    seeking: "React Mentor",
    accent: "purple",
    image: demoProfile
  },
  {
    id: 6,
    name: "Lila",
    pronouns: "She/Her/Hers",
    headline: "Business Student at UW-Milwaukee",
    location: "Milwaukee, Wisconsin",
    teaches: "Marketing Tutor",
    seeking: "Excel Help",
    accent: "blue",
    image: demoProfile
  },
  {
    id: 7,
    name: "Omar",
    pronouns: "He/Him/His",
    headline: "Engineering Student at UW-Milwaukee",
    location: "Milwaukee, Wisconsin",
    teaches: "CAD Tutor",
    seeking: "Resume Help",
    accent: "purple",
    image: demoProfile
  },
  {
    id: 8,
    name: "Nina",
    pronouns: "She/Her/Hers",
    headline: "Education Student at UW-Milwaukee",
    location: "Milwaukee, Wisconsin",
    teaches: "Writing Tutor",
    seeking: "Statistics Help",
    accent: "blue",
    image: demoProfile
  },
];

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

/*
*  Builds the internal queue of profiles used by the discover feed.
*  Each profile receives a unique runtimeId so React can properly
*  track card animations when profiles enter or leave the grid.
*/
function buildQueue() {
  return INITIAL_PROFILES.map((profile, index) => ({
    ...profile,
    isIncoming: false,
    runtimeId: `${profile.id}-${index}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`,
  }));
}

/*
*  Selects the next profile to insert into the discover feed.
*  Priority is given to profiles that have not yet been shown.
*  If all profiles have been used, a random one is recycled.
*/
function getNextProfile(queue, usedIds) {
  const unused = queue.find((profile) => !usedIds.has(profile.id));

  if (unused) {
    return {
      ...unused,
      isIncoming: true,
      runtimeId: `${unused.id}-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`,
    };
  }

  const recycled = queue[Math.floor(Math.random() * queue.length)];
  return {
    ...recycled,
    isIncoming: true,
    runtimeId: `${recycled.id}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`,
  };
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
            <span className="discover-card__pronouns">({profile.pronouns})</span>
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
            {profile.name} is a {profile.headline.toLowerCase()} who can help
            with {profile.teaches.toLowerCase()} and is currently looking for{" "}
            {profile.seeking.toLowerCase()}.
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
            <li>{profile.pronouns}</li>
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
*  Manages profile queue state, card transitions,
*  user decisions, and responsive card counts.
*/
export default function DiscoverSection() {
  const queue = useMemo(() => buildQueue(), []);
  const [visibleProfiles, setVisibleProfiles] = useState(
    queue.slice(0, VISIBLE_COUNT)
  );
  const [usedProfileIds, setUsedProfileIds] = useState(
    new Set(queue.slice(0, VISIBLE_COUNT).map((profile) => profile.id))
  );
  const [feedback, setFeedback] = useState(null);
  const [busyCardId, setBusyCardId] = useState(null);
  const [pendingProfile, setPendingProfile] = useState(null);
  const [displayCount, setDisplayCount] = useState(getDisplayCount);

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
  *  Removes the current card, prepares the next profile,
  *  and triggers the exit animation before inserting the new card.
  */
  const handleDecision = (runtimeId, action) => {
    if (busyCardId) return;

    const current = visibleProfiles.find(
      (profile) => profile.runtimeId === runtimeId
    );
    if (!current) return;

    const nextProfile = getNextProfile(
      queue,
      new Set([...usedProfileIds, current.id])
    );

    setBusyCardId(runtimeId);
    setPendingProfile(nextProfile);
    setFeedback({
      name: current.name,
      action,
    });

    setUsedProfileIds((prev) => {
      const updated = new Set(prev);
      updated.add(current.id);
      return updated;
    });

    setVisibleProfiles((prev) =>
      prev.filter((profile) => profile.runtimeId !== runtimeId)
    );
  };

  /*
  *  Called after a card exit animation completes.
  *  Inserts the pending profile into the grid and
  *  unlocks the interface for the next interaction.
  */
  const handleExitComplete = () => {
    if (!pendingProfile) return;

    setVisibleProfiles((prev) => [...prev, pendingProfile]);
    setPendingProfile(null);
    setBusyCardId(null);
  };

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
              key={`${feedback.name}-${feedback.action}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className={`discover-section__feedback ${
                feedback.action === "like"
                  ? "discover-section__feedback--yes"
                  : "discover-section__feedback--pass"
              }`}
            >
              {feedback.action === "like"
                ? `Interested in ${feedback.name}`
                : `Passed on ${feedback.name}`}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <div className="discover-cards-box">
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
      </div>
    </section>
  );
}