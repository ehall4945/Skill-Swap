import { useState } from "react";
import StarRating from "../components/StarRating";

export default function RateUser() {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const submitRating = async () => {
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8000/api/ratings/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rating: rating,
          name: comment,
        }),
      });

      if (!res.ok) throw new Error("Failed");

      alert("Rating submitted!");
      setRating(0);
      setComment("");
    } catch (err) {
      alert("Error submitting rating");
    }

    setLoading(false);
  };

  return (
    <div style={{ padding: "30px" }}>
      <h2>Rate Your Exchange</h2>

      <StarRating rating={rating} setRating={setRating} />

      <textarea
        placeholder="Write feedback..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        style={{ width: "300px", height: "100px", marginTop: "10px" }}
      />

      <br />

      <button
        onClick={submitRating}
        disabled={rating === 0 || loading}
      >
        {loading ? "Submitting..." : "Submit"}
      </button>
    </div>
  );
}