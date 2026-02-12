import "./Discover.css";

function Home() {
  return (
    <div className="discover">
      <header className="discover-header">
        <h1>Discover</h1>
      </header>

      <section className="discover-feed">
        <div className="skill-card">
          <h3>React Tutoring</h3>
          <p>Learn React basics in 2 sessions.</p>
          <span className="skill-tag">Wants: Spanish Practice</span>
        </div>
        <div className="skill-card">
            <h3>Spanish Tutoring</h3>
            <p>Learn conversational Spanish with me!</p>
            <span className="skill-tag">Wants: Cooking Lessons</span>
        </div>
        
      </section>
    </div>
  );
}

export default Home;
