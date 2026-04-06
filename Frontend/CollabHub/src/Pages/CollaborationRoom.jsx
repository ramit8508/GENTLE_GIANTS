import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";
import { io } from "socket.io-client";

const WS_BASE = import.meta.env.VITE_WS_URL || "ws://localhost:3000/ws/chat";
const TODO_WS_BASE = import.meta.env.VITE_TODO_WS_URL || "http://localhost:3000";
const ICE_SERVERS = [{ urls: "stun:stun.l.google.com:19302" }];
const BACKEND_TOKEN_KEY = "collabhub_backend_access_token";

const formatTime = (value) => {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return "";
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
};

const buildMessage = (msg, currentUserId) => ({
  id: msg.id || `${Date.now()}_${Math.random().toString(16).slice(2)}`,
  sender: msg.sender?.name || "System",
  mine: String(msg.sender?.id || "") === String(currentUserId),
  text: msg.content || "",
  time: formatTime(msg.createdAt),
});

export default function CollaborationRoom() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const { user } = useAuth();

  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [drawOpen, setDrawOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [screenShared, setScreenShared] = useState(false); // UI-only for now
  const [activeChatTab, setActiveChatTab] = useState("live");
  const [contactHint, setContactHint] = useState("");
  const [connectionState, setConnectionState] = useState("Connecting...");
  const [inCall, setInCall] = useState(false);
  const [callParticipants, setCallParticipants] = useState([]);
  const [remoteStreams, setRemoteStreams] = useState([]);
  const [conferenceNotice] = useState("Conference room opened. Use live chat below to coordinate.");
  const [drawTool, setDrawTool] = useState("pen");
  const [drawColor, setDrawColor] = useState("#2b2118");
  const [drawSize, setDrawSize] = useState(4);
  const [todoOpen, setTodoOpen] = useState(false);
  const [linksOpen, setLinksOpen] = useState(false);
  const [todos, setTodos] = useState([]);
  const [todoDraft, setTodoDraft] = useState("");
  const [todoConnectionState, setTodoConnectionState] = useState("Connecting...");
  const [aiSuggestingTodos, setAiSuggestingTodos] = useState(false);
  const [savedLinks, setSavedLinks] = useState([]);
  const [linkTitleDraft, setLinkTitleDraft] = useState("");
  const [linkUrlDraft, setLinkUrlDraft] = useState("");
  const [linkNoteDraft, setLinkNoteDraft] = useState("");
  const [progressDraft, setProgressDraft] = useState("");
  const [teamProgress, setTeamProgress] = useState([]);

  const wsRef = useRef(null);
  const todoSocketRef = useRef(null);
  const chatEndRef = useRef(null);
  const drawCanvasRef = useRef(null);
  const drawCtxRef = useRef(null);
  const drawLocalVideoRef = useRef(null);
  const drawRemoteVideoRef = useRef(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef(null);
  const drawActionsRef = useRef([]);
  const localVideoRef = useRef(null);
  const remotePrimaryRef = useRef(null);
  const localStreamRef = useRef(null);
  const peerConnectionsRef = useRef(new Map());
  const knownParticipantsRef = useRef(new Map());
  const joinedCallRef = useRef(false);
  const reconnectTimerRef = useRef(null);
  const shouldReconnectRef = useRef(true);

  const roomTitle = useMemo(() => {
    if (location.state?.projectTitle) {
      return `Project Collaboration: ${location.state.projectTitle}`;
    }
    return `Project Collaboration #${id}`;
  }, [id, location.state]);

  const ownerName = location.state?.owner?.name || "Project Owner";

  const remotePrimary = remoteStreams[0] || null;

  const appendSystemMessage = (text) => {
    const msg = {
      id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
      sender: "System",
      mine: false,
      text,
      time: formatTime(),
    };
    setMessages((prev) => [...prev, msg]);
  };

  const isJoinLeaveNotice = (text) => {
    const raw = String(text || "").toLowerCase();
    return raw.includes("joined the room") || raw.includes("left the room");
  };

  const cleanupPeerConnection = (userId) => {
    const pc = peerConnectionsRef.current.get(userId);
    if (pc) {
      pc.onicecandidate = null;
      pc.ontrack = null;
      pc.onconnectionstatechange = null;
      pc.close();
      peerConnectionsRef.current.delete(userId);
    }
    setRemoteStreams((prev) => prev.filter((entry) => String(entry.userId) !== String(userId)));
  };

  const closeAllPeerConnections = () => {
    Array.from(peerConnectionsRef.current.keys()).forEach((userId) => cleanupPeerConnection(userId));
  };

  const stopLocalStream = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
  };

  const sendWs = (payload) => {
    const socket = wsRef.current;
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(payload));
    }
  };

  const sendTodoEvent = (event, payload) => {
    const socket = todoSocketRef.current;
    if (socket?.connected) {
      socket.emit(event, payload);
    }
  };

  const getCanvasPoint = (event) => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const toRelativePoint = (point) => {
    const canvas = drawCanvasRef.current;
    if (!canvas || !point) return point;
    return {
      x: canvas.width ? point.x / canvas.width : 0,
      y: canvas.height ? point.y / canvas.height : 0,
    };
  };

  const fromRelativePoint = (point) => {
    const canvas = drawCanvasRef.current;
    if (!canvas || !point) return point;

    if (point.x > 1 || point.y > 1) {
      return point;
    }

    return {
      x: point.x * canvas.width,
      y: point.y * canvas.height,
    };
  };

  const syncCanvasSize = () => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const snapshot = canvas.toDataURL("image/png");
    const img = new Image();
    img.src = snapshot;

    const width = Math.max(320, Math.floor(parent.clientWidth));
    const height = Math.max(360, Math.floor(parent.clientHeight));
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    drawCtxRef.current = ctx;
    if (!ctx) return;

    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, width, height);

    img.onload = () => {
      ctx.drawImage(img, 0, 0, width, height);
    };
  };

  const beginDraw = (event) => {
    const ctx = drawCtxRef.current;
    if (!ctx) return;
    event.preventDefault();

    isDrawingRef.current = true;
    lastPointRef.current = getCanvasPoint(event);
  };

  const moveDraw = (event) => {
    const ctx = drawCtxRef.current;
    if (!ctx || !isDrawingRef.current) return;
    event.preventDefault();

    const current = getCanvasPoint(event);
    const previous = lastPointRef.current || current;

    const stroke = {
      from: previous,
      to: current,
      color: drawColor,
      size: Number(drawSize),
      tool: drawTool,
    };

    applyDrawStroke(stroke);
    drawActionsRef.current.push(stroke);
    sendWs({ type: "draw:stroke", roomId: id, ...stroke });

    lastPointRef.current = current;
  };

  const endDraw = () => {
    isDrawingRef.current = false;
    lastPointRef.current = null;
  };

  const applyDrawStroke = ({ from, to, color, size, tool }) => {
    const ctx = drawCtxRef.current;
    if (!ctx || !from || !to) return;

    const fromPx = fromRelativePoint(from);
    const toPx = fromRelativePoint(to);

    ctx.beginPath();
    ctx.moveTo(fromPx.x, fromPx.y);
    ctx.lineTo(toPx.x, toPx.y);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = Number(size) || 4;
    ctx.strokeStyle = tool === "eraser" ? "#ffffff" : (color || "#2b2118");
    ctx.stroke();
  };

  const clearDrawCanvas = (broadcast = true) => {
    const canvas = drawCanvasRef.current;
    const ctx = drawCtxRef.current;
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawActionsRef.current = [];
    if (broadcast) {
      sendWs({ type: "draw:clear", roomId: id });
    }
  };

  const ensureLocalMedia = async () => {
    if (localStreamRef.current) return localStreamRef.current;
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
    localStreamRef.current = stream;
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }
    return stream;
  };

  const syncLocalTracks = () => {
    const stream = localStreamRef.current;
    if (!stream) return;
    stream.getAudioTracks().forEach((track) => {
      track.enabled = !isMuted;
    });
    stream.getVideoTracks().forEach((track) => {
      track.enabled = !cameraOff;
    });
  };

  const getOrCreatePeerConnection = async (targetUserId) => {
    let pc = peerConnectionsRef.current.get(targetUserId);
    if (pc) return pc;

    pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    const stream = await ensureLocalMedia();
    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream);
    });

    pc.onicecandidate = (event) => {
      if (!event.candidate) return;
      sendWs({
        type: "call:ice-candidate",
        roomId: id,
        targetUserId,
        candidate: event.candidate,
      });
    };

    pc.ontrack = (event) => {
      const streamTrack = event.streams?.[0] || new MediaStream([event.track]);
      if (!streamTrack) return;
      setRemoteStreams((prev) => {
        const next = prev.filter((entry) => String(entry.userId) !== String(targetUserId));
        next.push({ userId: targetUserId, stream: streamTrack });
        return next;
      });
    };

    pc.onconnectionstatechange = () => {
      if (["failed", "closed", "disconnected"].includes(pc.connectionState)) {
        cleanupPeerConnection(targetUserId);
      }
    };

    peerConnectionsRef.current.set(targetUserId, pc);
    return pc;
  };

  const createOfferForUser = async (targetUserId) => {
    if (!targetUserId || String(targetUserId) === String(user?._id)) return;
    const pc = await getOrCreatePeerConnection(targetUserId);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    sendWs({
      type: "call:offer",
      roomId: id,
      targetUserId,
      sdp: pc.localDescription,
    });
  };

  const leaveCall = (reason = "manual") => {
    if (joinedCallRef.current) {
      sendWs({ type: "call:leave", roomId: id, reason });
    }
    joinedCallRef.current = false;
    setInCall(false);
    setCallParticipants([]);
    closeAllPeerConnections();
    stopLocalStream();
  };

  const startCall = async () => {
    try {
      await ensureLocalMedia();
      syncLocalTracks();
      sendWs({ type: "call:join", roomId: id, callType: "video" });
    } catch (error) {
      appendSystemMessage("Camera or microphone permission denied.");
    }
  };

  const handleSocketMessage = async (data) => {
    if (data.type === "connected") {
      setConnectionState("Connected");
      return;
    }

    if (data.type === "history") {
      const items = (data.messages || []).map((msg) => buildMessage(msg, user?._id));
      setMessages(items);
      return;
    }

    if (data.type === "system") {
      if (!isJoinLeaveNotice(data.message)) {
        appendSystemMessage(data.message || "System update");
      }
      return;
    }

    if (data.type === "new_message") {
      const msg = buildMessage(data.message, user?._id);
      setMessages((prev) => [...prev, msg]);
      return;
    }

    if (data.type === "error") {
      appendSystemMessage(data.message || "Realtime error");
      return;
    }

    if (data.type === "call:joined") {
      joinedCallRef.current = true;
      setInCall(true);
      const participants = data.participants || [];
      setCallParticipants(participants);
      knownParticipantsRef.current = new Map(participants.map((p) => [String(p.userId), p]));
      return;
    }

    if (data.type === "call:participant_joined") {
      const next = {
        userId: data.userId,
        name: data.name || "Member",
        isMuted: false,
        isVideoEnabled: true,
      };
      knownParticipantsRef.current.set(String(next.userId), next);
      setCallParticipants(Array.from(knownParticipantsRef.current.values()));

      if (joinedCallRef.current) {
        await createOfferForUser(data.userId);
      }
      return;
    }

    if (data.type === "call:participant_left") {
      knownParticipantsRef.current.delete(String(data.userId));
      setCallParticipants(Array.from(knownParticipantsRef.current.values()));
      cleanupPeerConnection(data.userId);
      return;
    }

    if (data.type === "call:participant_updated") {
      const existing = knownParticipantsRef.current.get(String(data.userId));
      if (existing) {
        knownParticipantsRef.current.set(String(data.userId), {
          ...existing,
          isMuted: data.isMuted,
          isVideoEnabled: data.isVideoEnabled,
        });
        setCallParticipants(Array.from(knownParticipantsRef.current.values()));
      }
      return;
    }

    if (data.type === "call:offer") {
      const fromUserId = data.fromUserId;
      const pc = await getOrCreatePeerConnection(fromUserId);
      await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      sendWs({
        type: "call:answer",
        roomId: id,
        targetUserId: fromUserId,
        sdp: pc.localDescription,
      });
      return;
    }

    if (data.type === "call:answer") {
      const fromUserId = data.fromUserId;
      const pc = peerConnectionsRef.current.get(fromUserId);
      if (!pc) return;
      await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
      return;
    }

    if (data.type === "call:ice-candidate") {
      const fromUserId = data.fromUserId;
      const pc = await getOrCreatePeerConnection(fromUserId);
      if (data.candidate) {
        await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
      }
      return;
    }

    if (data.type === "draw:stroke") {
      const stroke = {
        from: data.from,
        to: data.to,
        color: data.color,
        size: data.size,
        tool: data.tool,
      };
      drawActionsRef.current.push(stroke);
      if (drawOpen) {
        applyDrawStroke(stroke);
      }
      return;
    }

    if (data.type === "draw:sync") {
      const actions = Array.isArray(data.actions) ? data.actions : [];
      drawActionsRef.current = actions.map((action) => ({
        from: action.from,
        to: action.to,
        color: action.color,
        size: action.size,
        tool: action.tool,
      }));

      if (drawOpen) {
        clearDrawCanvas(false);
        drawActionsRef.current.forEach((stroke) => applyDrawStroke(stroke));
      }
      return;
    }

    if (data.type === "draw:clear") {
      drawActionsRef.current = [];
      if (drawOpen) {
        const canvas = drawCanvasRef.current;
        const ctx = drawCtxRef.current;
        if (canvas && ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = "#fff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
      }
      return;
    }

    if (data.type === "call:ended") {
      appendSystemMessage("Call ended.");
      leaveCall("remote_end");
    }
  };

  useEffect(() => {
    if (!id || !user?._id) return;
    shouldReconnectRef.current = true;

    const connect = () => {
      setConnectionState("Connecting...");
      const token = sessionStorage.getItem(BACKEND_TOKEN_KEY);
      const wsUrl = token
        ? `${WS_BASE}?roomId=${encodeURIComponent(id)}&token=${encodeURIComponent(token)}`
        : `${WS_BASE}?roomId=${encodeURIComponent(id)}`;
      const socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        setConnectionState("Connected");
        sendWs({ type: "join", roomId: id });
      };

      socket.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          await handleSocketMessage(data);
        } catch {
          appendSystemMessage("Failed to parse realtime event.");
        }
      };

      socket.onerror = () => {
        setConnectionState("Connection error");
      };

      socket.onclose = (event) => {
        setConnectionState("Disconnected");
        if (!shouldReconnectRef.current || event.code === 4001) {
          return;
        }
        if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = setTimeout(() => {
          connect();
        }, 1500);
      };
    };

    connect();

    return () => {
      shouldReconnectRef.current = false;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      leaveCall("unmount");
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [id, user?._id]);

  useEffect(() => {
    syncLocalTracks();
    if (inCall) {
      sendWs({ type: "call:mute-toggle", roomId: id, isMuted });
      sendWs({ type: "call:video-toggle", roomId: id, isVideoEnabled: !cameraOff });
    }
  }, [isMuted, cameraOff, inCall, id]);

  useEffect(() => {
    if (remotePrimaryRef.current) {
      remotePrimaryRef.current.srcObject = remotePrimary?.stream || null;
      if (remotePrimaryRef.current.srcObject) {
        remotePrimaryRef.current.play().catch(() => {});
      }
    }
    if (drawRemoteVideoRef.current) {
      drawRemoteVideoRef.current.srcObject = remotePrimary?.stream || null;
      if (drawRemoteVideoRef.current.srcObject) {
        drawRemoteVideoRef.current.play().catch(() => {});
      }
    }
  }, [remotePrimary, drawOpen, inCall]);

  useEffect(() => {
    if (localStreamRef.current) {
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
        localVideoRef.current.play().catch(() => {});
      }
      if (drawLocalVideoRef.current) {
        drawLocalVideoRef.current.srcObject = localStreamRef.current;
        drawLocalVideoRef.current.play().catch(() => {});
      }
    }
  }, [inCall, drawOpen]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages]);

  useEffect(() => {
    if (!drawOpen) return;

    const init = () => {
      syncCanvasSize();
      clearDrawCanvas(false);
      drawActionsRef.current.forEach((stroke) => applyDrawStroke(stroke));
    };

    init();
    window.addEventListener("resize", syncCanvasSize);
    return () => {
      window.removeEventListener("resize", syncCanvasSize);
    };
  }, [drawOpen]);

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

    sendWs({ type: "send_message", roomId: id, content: text });
    setDraft("");
  };

  const addTodo = (event) => {
    event.preventDefault();
    const text = todoDraft.trim();
    if (!text) return;

    sendTodoEvent("todo:create", { roomId: id, text });
    setTodoDraft("");
  };

  const toggleTodo = (todoId, completed) => {
    sendTodoEvent("todo:toggle", {
      roomId: id,
      todoId,
      completed,
    });
  };

  const addSharedLink = (event) => {
    event.preventDefault();

    const title = linkTitleDraft.trim();
    const url = linkUrlDraft.trim();
    const note = linkNoteDraft.trim();
    if (!title || !url) return;

    sendTodoEvent("link:create", {
      roomId: id,
      title,
      url,
      note,
    });

    setLinkTitleDraft("");
    setLinkUrlDraft("");
    setLinkNoteDraft("");
  };

  const requestAiTodos = () => {
    setAiSuggestingTodos(true);
    sendTodoEvent("todo:ai-generate", { roomId: id });
    window.setTimeout(() => {
      setAiSuggestingTodos(false);
    }, 2600);
  };

  const shareProgress = (event) => {
    event.preventDefault();
    const text = progressDraft.trim();
    if (!text) return;

    sendTodoEvent("todo:progress-update", {
      roomId: id,
      text,
    });

    setProgressDraft("");
  };

  useEffect(() => {
    if (!id || !user?._id) return;

    const token = sessionStorage.getItem(BACKEND_TOKEN_KEY) || localStorage.getItem(BACKEND_TOKEN_KEY);
    const socket = io(TODO_WS_BASE, {
      path: "/ws/todo",
      auth: token ? { token } : undefined,
      query: token ? { roomId: id, token } : { roomId: id },
      withCredentials: false,
    });

    todoSocketRef.current = socket;
    setTodoConnectionState("Connecting...");

    socket.on("connect", () => {
      setTodoConnectionState("Connected");
      socket.emit("todo:join", { roomId: id });
    });

    socket.on("disconnect", () => {
      setTodoConnectionState("Disconnected");
    });

    socket.on("connect_error", (err) => {
      setTodoConnectionState("Connection error");
      if (err?.message) {
        appendSystemMessage(`Todo: ${err.message}`);
      }
    });

    socket.on("todo:list", (payload) => {
      setTodos(Array.isArray(payload?.todos) ? payload.todos : []);
    });

    socket.on("link:list", (payload) => {
      setSavedLinks(Array.isArray(payload?.links) ? payload.links : []);
    });

    socket.on("todo:created", (payload) => {
      if (!payload?.todo) return;
      setAiSuggestingTodos(false);
      setTodos((prev) => [...prev, payload.todo]);
    });

    socket.on("todo:updated", (payload) => {
      if (!payload?.todo) return;
      setTodos((prev) => prev.map((item) => (item.id === payload.todo.id ? payload.todo : item)));
    });

    socket.on("todo:progress-list", (payload) => {
      setTeamProgress(Array.isArray(payload?.progress) ? payload.progress : []);
    });

    socket.on("link:created", (payload) => {
      if (!payload?.link) return;
      setSavedLinks((prev) => [...prev, payload.link]);
    });

    socket.on("todo:error", (payload) => {
      setAiSuggestingTodos(false);
      if (payload?.message) {
        appendSystemMessage(`Todo: ${payload.message}`);
      }
    });

    return () => {
      socket.disconnect();
      if (todoSocketRef.current === socket) {
        todoSocketRef.current = null;
      }
    };
  }, [id, user?._id]);

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
          <div className="collab-header-controls">
            <div className="collab-statuses">
              <span className="status-chip status-live">{connectionState}</span>
              <span className="status-chip">{callParticipants.length || 1} Participants</span>
              <span className="status-chip">Todo {todoConnectionState}</span>
            </div>
            <div className="collab-header-actions">
              <button className="btn btn-sm todo-toggle-btn" type="button" onClick={() => setTodoOpen((v) => !v)}>
                {todoOpen ? "Close Todo List" : "Todo List"}
              </button>
              <button className="btn btn-sm links-toggle-btn" type="button" onClick={() => setLinksOpen((v) => !v)}>
                {linksOpen ? "Close Important Links & Notes" : "Important Links & Notes"}
              </button>
            </div>
          </div>
        </header>

        {todoOpen && (
          <section className="todo-panel" aria-live="polite">
            <div className="todo-panel-head">
              <div>
                <h3>Shared Project Todo</h3>
                <p>{todos.length} tasks synced for all collaborators</p>
              </div>
              <button className="btn btn-sm todo-ai-btn" type="button" onClick={requestAiTodos} disabled={aiSuggestingTodos}>
                {aiSuggestingTodos ? "Generating..." : "AI Suggest Next Todos"}
              </button>
            </div>

            <form className="todo-progress-composer" onSubmit={shareProgress}>
              <input
                type="text"
                value={progressDraft}
                onChange={(e) => setProgressDraft(e.target.value)}
                placeholder="Tell AI what you completed so far (example: finished auth API and navbar bugs)."
                maxLength={300}
              />
              <button className="btn btn-outline" type="submit">Share Progress</button>
            </form>

            <div className="todo-progress-list" role="list">
              {teamProgress.length === 0 ? (
                <p className="todo-progress-empty">No progress updates yet from collaborators.</p>
              ) : (
                teamProgress.map((entry) => (
                  <article key={entry.id || `${entry.userId}_${entry.updatedAt || entry.text}`} className="todo-progress-item" role="listitem">
                    <strong>{entry.name}</strong>
                    <p>{entry.text}</p>
                  </article>
                ))
              )}
            </div>

            <form className="todo-composer" onSubmit={addTodo}>
              <input
                type="text"
                value={todoDraft}
                onChange={(e) => setTodoDraft(e.target.value)}
                placeholder="Add a task visible to everyone in this room..."
                maxLength={240}
              />
              <button className="btn btn-primary" type="submit">Add</button>
            </form>

            <div className="todo-list" role="list">
              {todos.length === 0 ? (
                <p className="todo-empty">No tasks yet. Add the first shared todo.</p>
              ) : (
                todos.map((todo) => (
                  <article key={todo.id} className={`todo-item ${todo.completed ? "done" : "pending"}`} role="listitem">
                    <label className="todo-main">
                      <input
                        type="checkbox"
                        checked={Boolean(todo.completed)}
                        onChange={(e) => toggleTodo(todo.id, e.target.checked)}
                      />
                      <span>{todo.text}</span>
                    </label>
                    <small>
                      {todo.completed
                        ? `Completed by ${todo.completedBy?.name || "Collaborator"}`
                        : `Not done - added by ${todo.createdBy?.name || "Collaborator"}`}
                    </small>
                    {todo.source === "ai" && <span className="todo-ai-chip">AI Suggestion</span>}
                  </article>
                ))
              )}
            </div>

          </section>
        )}

        {linksOpen && (
          <section className="links-panel" aria-live="polite">
            <div className="links-panel-head">
              <h3>Important Links & Notes</h3>
              <p>{savedLinks.length} links shared with collaborators</p>
            </div>

            <form className="links-composer" onSubmit={addSharedLink}>
              <input
                type="text"
                value={linkTitleDraft}
                onChange={(e) => setLinkTitleDraft(e.target.value)}
                placeholder="Link title (example: Node.js Docs)"
                maxLength={120}
              />
              <input
                type="url"
                value={linkUrlDraft}
                onChange={(e) => setLinkUrlDraft(e.target.value)}
                placeholder="https://nodejs.org/docs"
                maxLength={2048}
              />
              <input
                type="text"
                value={linkNoteDraft}
                onChange={(e) => setLinkNoteDraft(e.target.value)}
                placeholder="Note (optional): why this link matters"
                maxLength={300}
              />
              <button className="btn btn-primary" type="submit">Save Link</button>
            </form>

            <div className="links-list" role="list">
              {savedLinks.length === 0 ? (
                <p className="links-empty">No links shared yet.</p>
              ) : (
                savedLinks.map((link) => (
                  <article key={link.id} className="links-item" role="listitem">
                    <div>
                      <strong>{link.title}</strong>
                      <a href={link.url} target="_blank" rel="noreferrer">{link.url}</a>
                      {link.note && <p className="links-note">{link.note}</p>}
                    </div>
                    <small>Saved by {link.createdBy?.name || "Collaborator"}</small>
                  </article>
                ))
              )}
            </div>
          </section>
        )}

        <section className="collab-contact-card">
          <div>
            <h3>Collaborator Contact</h3>
            <p>
              Connected with <strong>{ownerName}</strong>.
            </p>
          </div>
          <div className="collab-contact-actions">
            <button className="btn btn-outline btn-sm" onClick={() => setContactHint("Use room chat or live call controls to coordinate in-app.")}>
              Start In-App Coordination
            </button>
          </div>
          {conferenceNotice && <p className="collab-contact-center-note">{conferenceNotice}</p>}
          {contactHint && <div className="collab-contact-hint">{contactHint}</div>}
        </section>

        {drawOpen ? (
          <section className="draw-fullpage">
            <aside className="draw-fullpage-tools">
              <h3>Whiteboard Tools</h3>
              <button
                className={`btn btn-sm ${drawTool === "pen" ? "btn-primary" : "btn-outline"}`}
                onClick={() => setDrawTool("pen")}
              >
                Pen
              </button>
              <button
                className={`btn btn-sm ${drawTool === "eraser" ? "btn-primary" : "btn-outline"}`}
                onClick={() => setDrawTool("eraser")}
              >
                Eraser
              </button>
              <label className="draw-tool-label" htmlFor="draw-color">Color</label>
              <input
                id="draw-color"
                type="color"
                value={drawColor}
                onChange={(e) => setDrawColor(e.target.value)}
                disabled={drawTool === "eraser"}
              />
              <label className="draw-tool-label" htmlFor="draw-size">Brush Size: {drawSize}px</label>
              <input
                id="draw-size"
                type="range"
                min="1"
                max="24"
                value={drawSize}
                onChange={(e) => setDrawSize(Number(e.target.value))}
              />
              <button className="btn btn-danger btn-sm" onClick={clearDrawCanvas}>Clear Board</button>
              <button className="btn btn-outline btn-sm" onClick={() => setDrawOpen(false)}>Close Whiteboard</button>
            </aside>

            <div className="draw-fullpage-canvas-wrap">
              <div className="draw-top-strip">
                <div className="draw-mini-video-card">
                  <span>Teammate</span>
                  {remotePrimary ? (
                    <video ref={drawRemoteVideoRef} autoPlay playsInline className="draw-mini-video" />
                  ) : (
                    <div className="draw-mini-video draw-mini-placeholder">No remote video</div>
                  )}
                </div>
                <div className="draw-mini-video-card">
                  <span>You</span>
                  <video ref={drawLocalVideoRef} autoPlay muted playsInline className="draw-mini-video" />
                </div>
                <button className="btn btn-sm draw-back-btn" onClick={() => setDrawOpen(false)}>
                  Back to Full Screen
                </button>
              </div>
              <canvas
                ref={drawCanvasRef}
                className="draw-fullpage-canvas"
                onPointerDown={beginDraw}
                onPointerMove={moveDraw}
                onPointerUp={endDraw}
                onPointerLeave={endDraw}
              />
            </div>
          </section>
        ) : (

        <div className={`collab-main ${drawOpen ? "draw-open" : ""}`}>
          <section className="call-stage">
            <div className="remote-video">
              <div className="video-label">Teammate Video</div>
              {remotePrimary ? (
                <video ref={remotePrimaryRef} autoPlay playsInline className="video-feed" />
              ) : (
                <p>No remote video yet</p>
              )}
            </div>

            <div className="local-video">
              <div className="video-label">Your Video</div>
              <video ref={localVideoRef} autoPlay muted playsInline className="video-feed" />
            </div>

            <div className="call-controls">
              {!inCall ? (
                <button className="btn btn-sm call-control-btn call-control-start" onClick={startCall}>
                  Start Call
                </button>
              ) : (
                <button className="btn btn-sm call-control-btn call-control-leave" onClick={() => leaveCall("manual") }>
                  Leave Call
                </button>
              )}
              <button className={`btn btn-sm call-control-btn ${isMuted ? "call-control-active" : "call-control-idle"}`} onClick={() => setIsMuted((v) => !v)}>
                {isMuted ? "Unmute" : "Mute"}
              </button>
              <button className={`btn btn-sm call-control-btn ${cameraOff ? "call-control-active" : "call-control-idle"}`} onClick={() => setCameraOff((v) => !v)}>
                {cameraOff ? "Camera Off" : "Camera On"}
              </button>
              <button className={`btn btn-sm call-control-btn ${screenShared ? "call-control-active" : "call-control-idle"}`} onClick={() => setScreenShared((v) => !v)}>
                {screenShared ? "Stop Share" : "Share Screen"}
              </button>
              <button className={`btn btn-sm call-control-btn ${drawOpen ? "call-control-active" : "call-control-idle"}`} onClick={() => setDrawOpen((v) => !v)}>
                {drawOpen ? "Close Draw" : "Open Draw"}
              </button>
            </div>
          </section>

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
                  <div ref={chatEndRef} />
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
        )}
      </section>
    </div>
  );
}