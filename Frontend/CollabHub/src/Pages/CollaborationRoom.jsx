import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";

const seedMessages = [
  {
    id: 1,
    sender: "Project Owner",
    mine: false,
    text: "Welcome! Let us align scope and milestones before we divide tasks.",
    time: "09:41",
  },
  {
    id: 2,
    sender: "You",
    mine: true,
    text: "Perfect. I can start with the onboarding flow and component structure.",
    time: "09:43",
  },
];

export default function CollaborationRoom() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();

  const [messages, setMessages] = useState(seedMessages);
  const [draft, setDraft] = useState("");
  const [drawOpen, setDrawOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [screenShared, setScreenShared] = useState(false);

  const roomTitle = useMemo(() => `Project Collaboration #${id}`, [id]);

  const sendMessage = (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;

    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    setMessages((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        sender: user?.name || "You",
        mine: true,
        text,
        time,
      },
    ]);
    setDraft("");
  };

  return (
    <div className="page collaboration-page">
      <section className="collab-shell">
        <header className="collab-header">
          <div>
            <button className="btn btn-outline btn-sm" onClick={() => navigate(-1)}>
              Back
            </button>
            <h1>{roomTitle}</h1>
            <p>Live collaboration workspace with chat, call controls, and shared whiteboard UI.</p>
          </div>
          <div className="collab-statuses">
            <span className="status-chip status-live">Live Session</span>
            <span className="status-chip">2 Participants</span>
          </div>
        </header>

        <div className={`collab-main ${drawOpen ? "draw-open" : ""}`}>
          <section className="call-stage">
            <div className="remote-video">
              <div className="video-label">Teammate Video</div>
              <p>Video stream placeholder</p>
            </div>

            <div className="local-video">
              <div className="video-label">Your Video</div>
            </div>

            {drawOpen && (
              <div className="draw-video-stack">
                <div className="mini-video">Teammate</div>
                <div className="mini-video">You</div>
              </div>
            )}

            <div className="call-controls">
              <button className={`btn btn-sm ${isMuted ? "btn-danger" : "btn-outline"}`} onClick={() => setIsMuted((v) => !v)}>
                {isMuted ? "Unmute" : "Mute"}
              </button>
              <button className={`btn btn-sm ${cameraOff ? "btn-danger" : "btn-outline"}`} onClick={() => setCameraOff((v) => !v)}>
                {cameraOff ? "Camera Off" : "Camera On"}
              </button>
              <button className={`btn btn-sm ${screenShared ? "btn-primary" : "btn-outline"}`} onClick={() => setScreenShared((v) => !v)}>
                {screenShared ? "Stop Share" : "Share Screen"}
              </button>
              <button className={`btn btn-sm ${drawOpen ? "btn-primary" : "btn-outline"}`} onClick={() => setDrawOpen((v) => !v)}>
                {drawOpen ? "Close Draw" : "Open Draw"}
              </button>
            </div>
          </section>

          {drawOpen && (
            <section className="draw-stage">
              <aside className="draw-tools">
                <h3>Draw Tools</h3>
                <button className="btn btn-outline btn-sm">Pen</button>
                <button className="btn btn-outline btn-sm">Highlighter</button>
                <button className="btn btn-outline btn-sm">Eraser</button>
                <button className="btn btn-outline btn-sm">Rectangle</button>
                <button className="btn btn-outline btn-sm">Arrow</button>
                <button className="btn btn-danger btn-sm">Clear</button>
              </aside>
              <div className="draw-canvas-shell">
                <div className="draw-canvas">
                  <span>Shared whiteboard area (UI only)</span>
                </div>
              </div>
            </section>
          )}

          <aside className="chat-panel">
            <div className="chat-header">
              <h3>Team Chat</h3>
              <span>{messages.length} messages</span>
            </div>

            <div className="chat-log">
              {messages.map((msg) => (
                <article key={msg.id} className={`chat-bubble ${msg.mine ? "mine" : ""}`}>
                  <strong>{msg.sender}</strong>
                  <p>{msg.text}</p>
                  <small>{msg.time}</small>
                </article>
              ))}
            </div>

            <form className="chat-composer" onSubmit={sendMessage}>
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Type message for your teammate..."
              />
              <button className="btn btn-primary" type="submit">
                Send
              </button>
            </form>
          </aside>
        </div>
      </section>
    </div>
  );
}