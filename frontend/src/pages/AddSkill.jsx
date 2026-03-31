import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import "../layout/AppLayout.css";
import "./Dashboard.css";
import "./AddSkill.css";

const OTHER_CATEGORY = "Other";
const DEFAULT_CATEGORY = "Programming";
const CATEGORY_OPTIONS = [
  DEFAULT_CATEGORY,
  "Design",
  "Languages",
  "Cooking",
  OTHER_CATEGORY,
];

const ERROR_BANNER_STYLE = {
  backgroundColor: "#fee2e2",
  color: "#b91c1c",
  padding: "10px",
  borderRadius: "6px",
  marginBottom: "15px",
  border: "1px solid #fecaca",
  fontSize: "0.9rem",
  textAlign: "center",
};

const SUCCESS_BANNER_STYLE = {
  backgroundColor: "#dcfce7",
  color: "#15803d",
  padding: "10px",
  borderRadius: "6px",
  marginBottom: "15px",
  border: "1px solid #bbf7d0",
  fontSize: "0.9rem",
  textAlign: "center",
};

const CUSTOM_CATEGORY_ROW_STYLE = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: "12px",
};

const CUSTOM_CATEGORY_INPUT_STYLE = {
  flex: "1 1 240px",
};

const INITIAL_FORM = {
  title: "",
  description: "",
};

function getApiErrorMessage(error) {
  const responseData = error.response?.data;

  if (typeof responseData?.detail === "string") {
    return responseData.detail;
  }

  const firstFieldError = Object.values(responseData || {})
    .flat()
    .find((value) => typeof value === "string" && value.trim());

  return firstFieldError || "We couldn't save your skill right now.";
}

export default function AddSkill() {
  const navigate = useNavigate();
  const customCategoryInputRef = useRef(null);

  const [formData, setFormData] = useState(INITIAL_FORM);
  const [selectedCategory, setSelectedCategory] = useState(DEFAULT_CATEGORY);
  const [customCategory, setCustomCategory] = useState("");
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (isCustomCategory) {
      customCategoryInputRef.current?.focus();
    }
  }, [isCustomCategory]);

  const handleFieldChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  };

  const handleCategorySelect = (event) => {
    const { value } = event.target;

    if (value === OTHER_CATEGORY) {
      setIsCustomCategory(true);
    } else {
      setSelectedCategory(value);
    }

    if (error) {
      setError("");
    }
  };

  const handleCustomCategoryChange = (event) => {
    setCustomCategory(event.target.value);

    if (error) {
      setError("");
    }
  };

  const handleResetCustomCategory = () => {
    setCustomCategory("");
    setIsCustomCategory(false);
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const title = formData.title.trim();
    const description = formData.description.trim();
    const category = isCustomCategory
      ? customCategory.trim()
      : selectedCategory;

    if (!title || !description || !category) {
      setSuccess("");
      setError("Please complete the title, description, and category before saving.");
      return;
    }

    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      await api.post("skills/", {
        title,
        description,
        category,
        skill_type: "OFFER",
      });

      navigate("/profile", {
        replace: true,
        state: { message: "Skill added successfully!" }
      });

    } catch (requestError) {
      setSuccess("");
      setError(getApiErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="dashboard-section">
      <section className="section-card add-skill-page">
        {error ? <div style={ERROR_BANNER_STYLE}>{error}</div> : null}
        {success ? <div style={SUCCESS_BANNER_STYLE}>{success}</div> : null}

        <div className="discover">
          <header className="discover-header add-skill-header">
            <div>
              <p className="add-skill-eyebrow">Share what you can teach</p>
              <h2>Add a Skill</h2>
              <p className="add-skill-subtitle">
                Add a new skill to your profile so other members can discover it.
              </p>
            </div>

            <Link to="/profile" className="add-skill-secondary-action">
              Back to Profile
            </Link>
          </header>

          <form className="add-skill-form" onSubmit={handleSubmit}>
            <label className="add-skill-field">
              <span>Title</span>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleFieldChange}
                placeholder="e.g. React tutoring"
                maxLength={100}
                required
              />
            </label>

            <label className="add-skill-field">
              <span>Description</span>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleFieldChange}
                placeholder="Describe what you can offer, your experience, and how you'd like to help."
                maxLength={500}
                rows={6}
                required
              />
            </label>

            <div className="add-skill-field">
              <span>Category</span>
              {isCustomCategory ? (
                <div style={CUSTOM_CATEGORY_ROW_STYLE}>
                  <input
                    ref={customCategoryInputRef}
                    type="text"
                    value={customCategory}
                    onChange={handleCustomCategoryChange}
                    placeholder="Type your custom category"
                    maxLength={50}
                    required
                    style={CUSTOM_CATEGORY_INPUT_STYLE}
                  />

                  <button
                    type="button"
                    className="add-skill-secondary-action"
                    onClick={handleResetCustomCategory}
                  >
                    Reset
                  </button>
                </div>
              ) : (
                <select
                  name="category"
                  value={selectedCategory}
                  onChange={handleCategorySelect}
                  required
                >
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="add-skill-actions">
              <Link to="/profile" className="add-skill-secondary-action">
                Cancel
              </Link>

              <button
                type="submit"
                className="add-skill-primary-action"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Save Skill"}
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
