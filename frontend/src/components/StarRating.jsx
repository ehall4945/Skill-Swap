import { useState } from "react";

export default function StarRating({ rating, setRating }) {
  const [hover, setHover] = useState(null);

  return (
    <div style={{ display: "flex", gap: "8px", fontSize: "32px" }}>
      {[1,2,3,4,5].map((star) => (
        <span
          key={star}
          onClick={() => setRating(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(null)}
          style={{
            cursor: "pointer",
            color: (hover || rating) >= star ? "#ffc107" : "#ccc"
          }}
        >
          ★
        </span>
      ))}
    </div>
  );
}