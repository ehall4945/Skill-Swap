import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { startConversation } from "../api/client";
import api from "../services/api";
import "./SwapRequests.css";

export default function SwapRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [chatLoadingId, setChatLoadingId] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!location.state?.message) return;

    setSuccess(location.state.message);
    const timer = setTimeout(() => setSuccess(""), 3000);
    window.history.replaceState({}, document.title);

    return () => clearTimeout(timer);
  }, [location.state]);

  async function fetchData() {
    try {
      const [userRes, reqRes] = await Promise.all([
        api.get("auth/me/"),
        api.get("requests/")
      ]);
      setCurrentUser(userRes.data);
      // Handle both paginated and flat array responses
      setRequests(reqRes.data.results ?? reqRes.data);
    } catch (err) {
      setError("Failed to load requests. Please try again later.");
    } finally {
      setLoading(false);
    }
  }

  const handleUpdateStatus = async (requestId, newStatus) => {
    try {
      setError("");
      const response = await api.patch(`requests/${requestId}/`, {
        status: newStatus
      });

      // Update local state by merging response.data to keep sender_name/skill_title
      setRequests((prev) =>
        prev.map((r) =>
          Number(r.id) === Number(requestId)
            ? { ...r, ...response.data }
            : r
        )
      );

      setSuccess(
        newStatus === "accepted"
          ? "Swap request accepted."
          : "Swap request rejected."
      );
    } catch (err) {
      console.error("Update error:", err.response?.data);
      setSuccess("");
      setError(err.response?.data?.detail || "Could not update status.");
    }
  };

  const handleWithdraw = async (requestId) => {
    if (!window.confirm("Are you sure you want to withdraw this request?")) return;
    try {
      setError("");
      const response = await api.patch(`requests/${requestId}/`, {
        status: "withdrawn"
      });

      setRequests((prev) =>
        prev.map((r) =>
          Number(r.id) === Number(requestId)
            ? { ...r, ...response.data }
            : r
        )
      );
      setSuccess("Swap request withdrawn.");
    } catch (err) {
      setSuccess("");
      setError(err.response?.data?.detail || "Failed to withdraw request.");
    }
  };

  const handleInitiateChat = async (targetUserId, requestId) => {
    if (!targetUserId) {
      setError("We couldn't determine who to message for this request.");
      return;
    }

    try {
      setChatLoadingId(requestId);
      setError("");
      const conv = await startConversation(targetUserId);
      navigate("/chat", { state: { activeId: conv.id } });
    } catch (err) {
      console.error("Conversation start error:", err);
      setError(
        err.response?.data?.detail ||
        "Could not open a conversation right now. Please try again."
      );
    } finally {
      setChatLoadingId(null);
    }
  };

  if (loading) return <div className="loading-container">Loading your requests...</div>;

  const incoming = requests.filter(
    (r) => Number(r.receiver_id ?? r.receiver) === Number(currentUser?.id)
  );
  const outgoing = requests.filter(
    (r) => Number(r.sender_id ?? r.sender) === Number(currentUser?.id)
  );

  return (
    <div className="swap-requests-page">
      <header className="page-header">
        <h2>My Swaps</h2>
        <p>Manage the requests you have sent and received.</p>
      </header>

      {error && <div className="error-banner">{error}</div>}
      {success && <div className="success-banner">{success}</div>}

      <div className="requests-grid">
        {/* INCOMING SECTION */}
        <section className="requests-column">
          <h3>Incoming Requests</h3>
          {incoming.length === 0 ? <p className="empty-msg">No incoming requests.</p> : (
            incoming.map((req) => {
              const receiverId = req.receiver_id ?? req.receiver;
              const senderId = req.sender_id ?? req.sender;
              const isReceiver = Number(receiverId) === Number(currentUser?.id);
              const isSender = Number(senderId) === Number(currentUser?.id);

              return (
                <div key={req.id} className="request-card">
                  <div className="request-body">
                    <h4>{req.sender_name}</h4>
                    <p>Wants to learn: <strong>{req.skill_title}</strong></p>
                    <span className="request-date">
                      {new Date(req.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="request-footer">
                    {req.status === 'pending' && isReceiver ? (
                      <div className="action-group">
                        <button className="btn-accept" onClick={() => handleUpdateStatus(req.id, 'accepted')}>Accept</button>
                        <button className="btn-reject" onClick={() => handleUpdateStatus(req.id, 'rejected')}>Reject</button>
                      </div>
                    ) : req.status === 'pending' && isSender ? (
                      <button className="btn-withdraw" onClick={() => handleWithdraw(req.id)}>
                        Withdraw
                      </button>
                    ) : (
                      <div className="status-container">
                        <span className={`status-badge status--${req.status}`}>{req.status}</span>
                        {req.status === 'accepted' && (
                          <button
                            className="btn-message"
                            onClick={() => handleInitiateChat(senderId, req.id)}
                            disabled={chatLoadingId === req.id}
                          >
                            {chatLoadingId === req.id ? "Opening..." : "Message"}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </section>

        {/* OUTGOING SECTION */}
        <section className="requests-column">
          <h3>Sent Requests</h3>
          {outgoing.length === 0 ? <p className="empty-msg">No sent requests.</p> : (
            outgoing.map((req) => {
              const receiverId = req.receiver_id ?? req.receiver;
              const senderId = req.sender_id ?? req.sender;
              const isReceiver = Number(receiverId) === Number(currentUser?.id);
              const isSender = Number(senderId) === Number(currentUser?.id);

              return (
                <div key={req.id} className="request-card">
                  <div className="request-body">
                    <h4>Requested: {req.skill_title}</h4>
                    <p>Sent to: {req.receiver_name || "Community Member"}</p>
                  </div>
                  <div className="request-footer">
                    {req.status === 'pending' && isReceiver ? (
                      <div className="action-group">
                        <button className="btn-accept" onClick={() => handleUpdateStatus(req.id, 'accepted')}>Accept</button>
                        <button className="btn-reject" onClick={() => handleUpdateStatus(req.id, 'rejected')}>Reject</button>
                      </div>
                    ) : (
                      <>
                        <span className={`status-badge status--${req.status}`}>{req.status}</span>
                        {req.status === 'accepted' && (
                          <button
                            className="btn-message"
                            onClick={() => handleInitiateChat(receiverId, req.id)}
                            disabled={chatLoadingId === req.id}
                          >
                            {chatLoadingId === req.id ? "Opening..." : "Message"}
                          </button>
                        )}
                        {req.status === 'pending' && isSender ? (
                          <button className="btn-withdraw" onClick={() => handleWithdraw(req.id)}>
                            Withdraw
                          </button>
                        ) : null}
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </section>
      </div>
    </div>
  );
}
