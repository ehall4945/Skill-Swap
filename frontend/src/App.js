import React, { useEffect, useState } from 'react';

function App() {
  const [message, setMessage] = useState("Loading...");

  useEffect(() => {
    // Calling the Django API we set up earlier
    fetch('http://localhost:8000/api/test/')
      .then(response => response.json())
      .then(data => setMessage(data.message))
      .catch(err => setMessage("Backend not reachable yet."));
  }, []);

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>Skill-Swap Project</h1>
      <p>Status from Backend: <strong>{message}</strong></p>
    </div>
  );
}

export default App;
