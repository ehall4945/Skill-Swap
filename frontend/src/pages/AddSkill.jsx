import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import "./Dashboard.css";
import "./AddSkill.css";

const CATEGORY_OPTIONS = [
  "Programming",
  "Design",
  "Languages",
  "Cooking",
];

const INITIAL_FORM = {
  title: "",
  description: "",
  category: CATEGORY_OPTIONS[0],
  skill_type: "OFFER",
};

export default function AddSkill() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await api.post("/skills/", {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        skill_type: formData.skill_type,
      });
      navigate("/profile", { replace: true });
    } catch (requestError) {
      const apiError =
        requestError.response?.data?.detail ||
        Object.values(requestError.response?.data || {}).flat()[0];

      setError(apiError || "We couldn't save your skill right now.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="dashboard-section">
      <section className="section-card add-skill-page">
        <div className="add-skill-header">
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
        </div>

        <form className="add-skill-form" onSubmit={handleSubmit}>
          <label className="add-skill-field">
            <span>Title</span>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
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
              onChange={handleChange}
              placeholder="Describe what you can offer, your experience, and how you'd like to help."
              maxLength={500}
              rows={6}
              required
            />
          </label>

          <label className="add-skill-field">
            <span>Category</span>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            >
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          {error ? <p className="add-skill-error">{error}</p> : null}

          <input type="hidden" name="skill_type" value={formData.skill_type} />

          <div className="add-skill-actions">
            <Link to="/profile" className="add-skill-secondary-action">
              Cancel
            </Link>

            <button type="submit" className="add-skill-primary-action" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Skill"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
