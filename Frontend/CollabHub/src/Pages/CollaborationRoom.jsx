import { useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
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
  const location = useLocation();
  const { id } = useParams();
  const { user } = useAuth();

  const [messages, setMessages] = useState(seedMessages);
  const [draft, setDraft] = useState("");
  const [drawOpen, setDrawOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [screenShared, setScreenShared] = useState(false);
  const [activeChatTab, setActiveChatTab] = useState("live");
  const [contactHint, setContactHint] = useState("");

  const roomTitle = useMemo(() => {
    if (location.state?.projectTitle) {
      return `Project Collaboration: ${location.state.projectTitle}`;
    }
    return `Project Collaboration #${id}`;
  }, [id, location.state]);

  const ownerName = location.state?.owner?.name || "Project Owner";
  const ownerEmail = location.state?.owner?.email || "";

  const historyByDay = useMemo(() => {
    const today = messages.map((m) => ({ ...m, dateLabel: "Today" }));
    const earlier = [
      {
        id: "old-1",
        sender: ownerName,
        mine: false,
        text: "Please review the wireframe concept and propose improvements.",
        time: "18:35",
        dateLabel: "Yesterday",
      },
      {
        id: "old-2",
        sender: user?.name || "You",
        mine: true,
        text: "Looks good. I will share a refined interaction map tomorrow.",
        time: "18:42",
        dateLabel: "Yesterday",
      },
    ];
    return [...earlier, ...today].reduce((acc, item) => {
      acc[item.dateLabel] = acc[item.dateLabel] || [];
      acc[item.dateLabel].push(item);
      return acc;
    }, {});
  }, [messages, ownerName, user?.name]);

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

  const sendMail = (subject, body) => {
    if (!ownerEmail) {
      setContactHint("Collaborator email will be supplied by backend profile data.");
      return;
    }
    window.location.href = `mailto:${ownerEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleCallUser = () => {
    sendMail(
      `Call request for ${roomTitle}`,
      `Hi ${ownerName},\n\nCan we jump on a quick project call? I am in the collaboration room and ready to discuss tasks.\n\nThanks.`
    );
    setContactHint("Call request draft opened in your email client.");
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

        <section className="collab-contact-card">
          <div>
            <h3>Collaborator Contact</h3>
            <p>
              Connected with <strong>{ownerName}</strong>
              {ownerEmail ? ` (${ownerEmail})` : " (email pending backend data)"}.
            </p>
          </div>
          <div className="collab-contact-actions">
            <button className="btn btn-outline btn-sm" onClick={handleCallUser}>
              Call User (Send Mail)
            </button>
            <button
              className="btn btn-outline btn-sm"
              onClick={() =>
                sendMail(
                  `Message from ${roomTitle}`,
                  `Hi ${ownerName},\n\nSharing project collaboration update from the room.\n\nRegards.`
                )
              }
            >
              Email User
            </button>
          </div>
          {contactHint && <div className="collab-contact-hint">{contactHint}</div>}
        </section>

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
              <div>
                <h3>Team Chat</h3>
                <span>{messages.length} messages</span>
              </div>
              <div className="chat-tabs">
                <button
                  className={`chat-tab-btn ${activeChatTab === "live" ? "active" : ""}`}
                  onClick={() => setActiveChatTab("live")}
                  type="button"
                >
                  Live
                </button>
                <button
                  className={`chat-tab-btn ${activeChatTab === "history" ? "active" : ""}`}
                  onClick={() => setActiveChatTab("history")}
                  type="button"
                >
                  History
                </button>
              </div>
            </div>

            {activeChatTab === "live" ? (
              <>
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
              </>
            ) : (
              <div className="chat-history">
                <p className="history-note">History view is UI-ready. Backend can provide persisted records.</p>
                {Object.entries(historyByDay).map(([day, entries]) => (
                  <section key={day} className="history-day-group">
                    <h4>{day}</h4>
                    {entries.map((entry) => (
                      <article key={entry.id} className="history-row">
                        <div>
                          <strong>{entry.sender}</strong>
                          <p>{entry.text}</p>
                        </div>
                        <small>{entry.time}</small>
                      </article>
                    ))}
                  </section>
                ))}
              </div>
            )}
          </aside>
        </div>
      </section>
    </div>
  );
}