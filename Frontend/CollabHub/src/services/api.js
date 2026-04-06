import axios from "axios";

const STORAGE_KEY = "collabhub_mock_storage_v1";
const SESSION_KEY = "collabhub_mock_session";
const BACKEND_SESSION_KEY = "collabhub_backend_session";

const createId = () => `${Date.now()}_${Math.random().toString(16).slice(2)}`;

const getNowISO = () => new Date().toISOString();

const defaultSeed = () => {
  const demoUserId = createId();
  const demoUser = {
    _id: demoUserId,
    name: "Demo User",
    email: "demo@gmail.com",
    password: "Password1",
    is_verified: true,
    skills: ["React", "Node.js"],
    github: "https://github.com/demo",
    bio: "Building collab-first products.",
  };

  const demoProjectId = createId();
  const demoProject = {
    _id: demoProjectId,
    title: "CollabHub Landing Revamp",
    description: "Redesign the landing page with a fresh visual identity and better onboarding flow.",
    tech_stack: ["React", "CSS"],
    roles_needed: ["UI/UX Designer", "Frontend Developer"],
    created_by: { _id: demoUserId, name: demoUser.name, email: demoUser.email },
    members: [{ user: { _id: demoUserId, name: demoUser.name }, role: "Owner" }],
    join_requests: [],
    invitations: [],
    removed: [],
    created_at: getNowISO(),
  };

  return {
    users: [demoUser],
    projects: [demoProject],
  };
};

const readStore = () => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const seed = defaultSeed();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }
  try {
    return JSON.parse(raw);
  } catch {
    const seed = defaultSeed();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }
};

const writeStore = (store) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
};

const getSessionUserId = () => localStorage.getItem(SESSION_KEY);
const setSessionUserId = (id) => {
  if (!id) {
    localStorage.removeItem(SESSION_KEY);
  } else {
    localStorage.setItem(SESSION_KEY, id);
  }
};

const ok = (data) => Promise.resolve({ data });
const error = (status, message) => Promise.reject({ response: { status, data: { message } } });

const getSafeUser = (user) => {
  if (!user) return null;
  const { password, ...safe } = user;
  return safe;
};

const findUserById = (store, id) => store.users.find((u) => String(u._id) === String(id));

const findProjectById = (store, id) => store.projects.find((p) => String(p._id) === String(id));

const normalizeProjectForClient = (project) => ({
  ...project,
  created_by: project.created_by || null,
  members: project.members || [],
  join_requests: project.join_requests || [],
  invitations: project.invitations || [],
  removed: project.removed || [],
});

const normalizeBackendProjectForClient = (project) => {
  if (!project) return null;

  const createdBy = project.createdBy || project.created_by || null;
  const normalizedCreator = createdBy
    ? {
        _id: createdBy._id || createdBy.id || createdBy,
        name: createdBy.name || "Unknown",
        email: createdBy.email || "",
      }
    : null;

  return {
    ...project,
    created_by: normalizedCreator,
    members: (project.members || []).map((m) => ({
      ...m,
      role: m.role || "Member",
      user:
        typeof m.user === "object"
          ? {
              _id: m.user?._id || m.user?.id,
              name: m.user?.name || "Unknown",
            }
          : { _id: m.user, name: "Unknown" },
    })),
    join_requests: (project.join_requests || []).map((r) => ({
      ...r,
      user:
        typeof r.user === "object"
          ? {
              _id: r.user?._id || r.user?.id,
              name: r.user?.name || "Unknown",
            }
          : { _id: r.user, name: "Unknown" },
      status: r.status || "pending",
    })),
    invitations: (project.invitations || []).map((i) => ({
      ...i,
      userId: i.userId || i.user?._id || i.user,
      status: i.status || "pending",
    })),
    removed: (project.removed || project.removed_members || []).map((r) => String(r.user || r)),
  };
};

const useBackend = (import.meta.env.VITE_USE_BACKEND ?? "true") === "true";
const backendClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api",
  withCredentials: true,
});

const unwrapApiData = (response) => {
  const payload = response?.data;
  if (payload && typeof payload === "object" && "data" in payload) {
    return payload.data;
  }
  return payload;
};

const unwrapBackendPayload = (response) => {
  const payload = response?.data;
  if (!payload || typeof payload !== "object") return payload;

  // Preferred shape: { data: ... }
  if ("data" in payload && payload.data !== undefined && payload.data !== null && typeof payload.data !== "string") {
    return payload.data;
  }

  // Current backend project controllers often send ApiResponse args in wrong order,
  // producing: { data: "message", message: <actual object/array> }
  if ("message" in payload && payload.message !== undefined && payload.message !== null && typeof payload.message !== "string") {
    return payload.message;
  }

  return payload.data ?? payload.message ?? payload;
};

const isFallbackCandidate = (err) => {
  const status = err?.response?.status;
  return !status || status >= 500 || status === 404;
};

const runBackendWithFallback = async (backendFn, mockFn) => {
  if (!useBackend) return mockFn();
  try {
    return await backendFn();
  } catch (err) {
    if (mockFn && isFallbackCandidate(err)) {
      return mockFn();
    }
    throw err;
  }
};

const API = {
  interceptors: {
    response: {
      _handlers: {},
      use(onFulfilled, onRejected) {
        const id = createId();
        this._handlers[id] = { onFulfilled, onRejected };
        return id;
      },
      eject(id) {
        delete this._handlers[id];
      },
    },
  },
};

// ─── Auth API ──────────────────────────────────────────────────────────────
const mockAuthAPI = {
  register: async (data) => {
    const store = readStore();
    const exists = store.users.some((u) => u.email.toLowerCase() === data.email.toLowerCase());
    if (exists) return error(409, "Email already registered");

    const user = {
      _id: createId(),
      name: data.name,
      email: data.email,
      password: data.password,
      is_verified: true,
      skills: data.skills || [],
      github: data.github || "",
      bio: data.bio || "",
    };
    store.users.push(user);
    writeStore(store);
    setSessionUserId(user._id);
    return ok({
      user: getSafeUser(user),
      message: "User registered successfully",
    });
  },
  login: async (data) => {
    const store = readStore();
    const user = store.users.find((u) => u.email.toLowerCase() === data.email.toLowerCase());
    if (!user || user.password !== data.password) {
      return error(401, "Invalid email or password");
    }
    setSessionUserId(user._id);
    return ok({ user: getSafeUser(user) });
  },
  logout: async () => {
    setSessionUserId(null);
    return ok({ success: true });
  },
  me: async () => {
    const store = readStore();
    const userId = getSessionUserId();
    if (!userId) return error(401, "Not authenticated");
    const user = findUserById(store, userId);
    if (!user) return error(401, "Session expired");
    return ok({ user: getSafeUser(user) });
  },
  updateProfile: async (data) => {
    const store = readStore();
    const userId = getSessionUserId();
    if (!userId) return error(401, "Not authenticated");
    const user = findUserById(store, userId);
    if (!user) return error(404, "User not found");
    user.name = data.name ?? user.name;
    user.skills = data.skills ?? user.skills;
    user.bio = data.bio ?? user.bio;
    user.github = data.github ?? user.github;
    writeStore(store);
    return ok({ user: getSafeUser(user) });
  },
  getUsers: async () => {
    const store = readStore();
    return ok({ users: store.users.map(getSafeUser) });
  },
  getUserById: async (id) => {
    const store = readStore();
    const user = findUserById(store, id);
    if (!user) return error(404, "User not found");
    return ok({ user: getSafeUser(user) });
  },
};

// ─── AI API ────────────────────────────────────────────────────────────────
const mockAiAPI = {
  match: async ({ project, users }) => {
    const picks = (users || []).slice(0, 4).map((u) => ({
      id: u._id || u.id,
      name: u.name || "Anonymous",
      percentage: Math.floor(70 + Math.random() * 25),
      reason: "Strong overlap in skills and collaboration preferences.",
    }));
    return ok({ result: picks }).then((res) => res.data);
  },
  improveIdea: async ({ idea }) => {
    const title = idea.split(" ").slice(0, 4).join(" ") || "New Project";
    return ok({
      title,
      description: `${idea}\n\nEnhanced with clearer goals and collaboration steps.`,
      keyFeatures: ["Clear scope", "Defined milestones", "Collaboration-ready"],
      techStack: ["React", "Node.js"],
      rolesNeeded: ["Frontend Developer", "Backend Developer"],
    }).then((res) => res.data);
  },
  enhanceProfile: async ({ bio }) => {
    const enhanced = `${bio}\n\nI enjoy building in teams, shipping iteratively, and sharing knowledge.`.trim();
    return ok({ result: enhanced }).then((res) => res.data);
  },
};

// ─── Project API ───────────────────────────────────────────────────────────
const mockProjectAPI = {
  create: async (data) => {
    const store = readStore();
    const userId = getSessionUserId();
    if (!userId) return error(401, "Login required");
    const user = findUserById(store, userId);
    if (!user) return error(401, "Session expired");

    const project = {
      _id: createId(),
      title: data.title,
      description: data.description,
      tech_stack: data.techStack || data.tech_stack || [],
      roles_needed: data.rolesNeeded || data.roles_needed || [],
      created_by: { _id: user._id, name: user.name, email: user.email },
      members: [{ user: { _id: user._id, name: user.name }, role: "Owner" }],
      join_requests: [],
      invitations: [],
      removed: [],
      created_at: getNowISO(),
    };
    store.projects.unshift(project);
    writeStore(store);
    return ok({ project: normalizeProjectForClient(project) });
  },
  getAll: async () => {
    const store = readStore();
    const projects = store.projects.map(normalizeProjectForClient);
    return ok({ projects });
  },
  getById: async (id) => {
    const store = readStore();
    const project = findProjectById(store, id);
    if (!project) return error(404, "Project not found");
    return ok({ project: normalizeProjectForClient(project) });
  },
  search: async (params) => {
    const store = readStore();
    const query = typeof params === "string" ? { q: params } : params;
    const q = (query.q || "").toLowerCase();
    const tech = query.tech_stack || [];
    const roles = query.roles || [];
    const projects = store.projects.filter((p) => {
      const matchesQuery = !q || p.title.toLowerCase().includes(q) || (p.description || "").toLowerCase().includes(q);
      const matchesTech = tech.length === 0 || tech.some((t) => p.tech_stack?.includes(t));
      const matchesRoles = roles.length === 0 || roles.some((r) => p.roles_needed?.includes(r));
      return matchesQuery && matchesTech && matchesRoles;
    });
    return ok({ projects: projects.map(normalizeProjectForClient) });
  },
  update: async (id, data) => {
    const store = readStore();
    const userId = getSessionUserId();
    if (!userId) return error(401, "Login required");
    const project = findProjectById(store, id);
    if (!project) return error(404, "Project not found");
    if (String(project.created_by?._id) !== String(userId)) {
      return error(403, "Only the owner can update this project");
    }
    project.title = data.title ?? project.title;
    project.description = data.description ?? project.description;
    project.tech_stack = data.techStack ?? data.tech_stack ?? project.tech_stack;
    project.roles_needed = data.rolesNeeded ?? data.roles_needed ?? project.roles_needed;
    writeStore(store);
    return ok({ project: normalizeProjectForClient(project) });
  },
  delete: async (id) => {
    const store = readStore();
    const userId = getSessionUserId();
    if (!userId) return error(401, "Login required");
    const project = findProjectById(store, id);
    if (!project) return error(404, "Project not found");
    if (String(project.created_by?._id) !== String(userId)) {
      return error(403, "Only the owner can delete this project");
    }
    store.projects = store.projects.filter((p) => String(p._id) !== String(id));
    writeStore(store);
    return ok({ success: true });
  },
  requestJoin: async (projectId) => {
    const store = readStore();
    const userId = getSessionUserId();
    if (!userId) return error(401, "Login required");
    const user = findUserById(store, userId);
    const project = findProjectById(store, projectId);
    if (!project) return error(404, "Project not found");
    if (String(project.created_by?._id) === String(userId)) {
      return error(400, "You are the project owner");
    }
    const alreadyMember = project.members?.some((m) => String(m.user?._id || m.user) === String(userId));
    if (alreadyMember) return error(400, "You are already a member");
    const existing = project.join_requests?.find((r) => String(r.user?._id || r.user) === String(userId));
    if (existing && existing.status === "pending") return error(400, "Request already sent");

    project.join_requests = project.join_requests || [];
    project.join_requests.push({ user: { _id: user._id, name: user.name }, status: "pending" });
    writeStore(store);
    return ok({ message: "Join request sent" });
  },
  respondJoin: async (id, userid, action) => {
    const store = readStore();
    const userId = getSessionUserId();
    if (!userId) return error(401, "Login required");
    const project = findProjectById(store, id);
    if (!project) return error(404, "Project not found");
    if (String(project.created_by?._id) !== String(userId)) {
      return error(403, "Only the owner can respond");
    }
    const req = project.join_requests?.find((r) => String(r.user?._id || r.user) === String(userid));
    if (!req) return error(404, "Request not found");
    req.status = action === "accept" ? "accepted" : "rejected";
    if (action === "accept") {
      const memberExists = project.members?.some((m) => String(m.user?._id || m.user) === String(userid));
      if (!memberExists) {
        project.members = project.members || [];
        project.members.push({ user: { _id: req.user?._id || userid, name: req.user?.name || "Member" }, role: "Member" });
      }
    }
    writeStore(store);
    return ok({ success: true });
  },
  getMyProjects: async () => {
    const store = readStore();
    const userId = getSessionUserId();
    if (!userId) return error(401, "Login required");

    const createdProjects = store.projects.filter((p) => String(p.created_by?._id) === String(userId));
    const joinedProjects = store.projects.filter((p) => p.members?.some((m) => String(m.user?._id || m.user) === String(userId)) && String(p.created_by?._id) !== String(userId));
    const pendingRequests = store.projects.filter((p) => p.join_requests?.some((r) => String(r.user?._id || r.user) === String(userId) && r.status === "pending"));
    const pendingInvitations = store.projects.filter((p) => p.invitations?.some((i) => String(i.userId) === String(userId) && i.status === "pending"));
    const removedFromProjects = store.projects.filter((p) => p.removed?.some((r) => String(r) === String(userId)));

    return ok({
      createdProjects: createdProjects.map(normalizeProjectForClient),
      joinedProjects: joinedProjects.map(normalizeProjectForClient),
      pendingRequests: pendingRequests.map(normalizeProjectForClient),
      pendingInvitations: pendingInvitations.map(normalizeProjectForClient),
      removedFromProjects: removedFromProjects.map(normalizeProjectForClient),
    });
  },
  removeMember: async (projectId, userId) => {
    const store = readStore();
    const currentUserId = getSessionUserId();
    if (!currentUserId) return error(401, "Login required");
    const project = findProjectById(store, projectId);
    if (!project) return error(404, "Project not found");
    if (String(project.created_by?._id) !== String(currentUserId)) {
      return error(403, "Only the owner can remove members");
    }
    project.members = (project.members || []).filter((m) => String(m.user?._id || m.user) !== String(userId));
    project.removed = project.removed || [];
    if (!project.removed.some((r) => String(r) === String(userId))) {
      project.removed.push(userId);
    }
    writeStore(store);
    return ok({ success: true });
  },
  inviteMember: async (projectId, userId) => {
    const store = readStore();
    const currentUserId = getSessionUserId();
    if (!currentUserId) return error(401, "Login required");
    const project = findProjectById(store, projectId);
    if (!project) return error(404, "Project not found");
    if (String(project.created_by?._id) !== String(currentUserId)) {
      return error(403, "Only the owner can invite members");
    }
    project.invitations = project.invitations || [];
    const existing = project.invitations.find((i) => String(i.userId) === String(userId));
    if (existing && existing.status === "pending") return error(400, "Invite already sent");
    project.invitations.push({ userId, status: "pending" });
    writeStore(store);
    return ok({ message: "Invite sent" });
  },
  respondInvite: async (projectId, action) => {
    const store = readStore();
    const currentUserId = getSessionUserId();
    if (!currentUserId) return error(401, "Login required");
    const project = findProjectById(store, projectId);
    if (!project) return error(404, "Project not found");
    const invite = project.invitations?.find((i) => String(i.userId) === String(currentUserId));
    if (!invite) return error(404, "Invite not found");
    invite.status = action === "accept" ? "accepted" : "rejected";
    if (action === "accept") {
      const user = findUserById(store, currentUserId);
      if (user) {
        const memberExists = project.members?.some((m) => String(m.user?._id || m.user) === String(currentUserId));
        if (!memberExists) {
          project.members = project.members || [];
          project.members.push({ user: { _id: user._id, name: user.name }, role: "Member" });
        }
      }
    }
    writeStore(store);
    return ok({ success: true });
  },
};

const backendAuthAPI = {
  register: async (data) => {
    const payload = {
      name: data.name,
      email: data.email,
      password: data.password,
      skills: data.skills?.length ? data.skills : ["General"],
      bio: data.bio || "CollabHub user",
      github: data.github || "https://github.com/collabhub-user",
    };

    const res = await backendClient.post("/auth/register", payload);
    localStorage.setItem(BACKEND_SESSION_KEY, "1");
    const content = unwrapApiData(res) || {};
    return { data: { user: content.user || content, message: res.data?.message } };
  },
  login: async (data) => {
    const res = await backendClient.post("/auth/login", data);
    localStorage.setItem(BACKEND_SESSION_KEY, "1");
    const content = unwrapApiData(res) || {};
    return { data: { user: content.user || content } };
  },
  logout: async () => {
    try {
      await backendClient.post("/auth/logout");
    } catch (err) {
      if (err?.response?.status !== 401) throw err;
    }
    localStorage.removeItem(BACKEND_SESSION_KEY);
    return { data: { success: true } };
  },
  me: async () => {
    if (!localStorage.getItem(BACKEND_SESSION_KEY)) {
      return Promise.reject({ response: { status: 401, data: { message: "Not authenticated" } } });
    }
    const res = await backendClient.get("/auth/profile");
    const user = unwrapApiData(res);
    return { data: { user } };
  },
  updateProfile: async (data) => mockAuthAPI.updateProfile(data),
  getUsers: async () => mockAuthAPI.getUsers(),
  getUserById: async (id) => mockAuthAPI.getUserById(id),
};

const backendAiAPI = {
  match: async ({ project, users }) => {
    const res = await backendClient.post("/ai/match", { project, users });
    return unwrapApiData(res) || res.data;
  },
  improveIdea: async ({ idea }) => {
    const res = await backendClient.post("/ai/improve-idea", { idea });
    return res.data;
  },
  enhanceProfile: async ({ bio }) => {
    const res = await backendClient.post("/ai/enhance-profile", { bio });
    return res.data;
  },
};

const backendProjectAPI = {
  create: async (data) => {
    await backendClient.post("/project/create", {
      title: data.title,
      description: data.description,
      tech_stack: data.techStack || data.tech_stack || [],
      roles_needed: data.rolesNeeded || data.roles_needed || [],
    });
    return { data: { success: true } };
  },
  getAll: async () => {
    const res = await backendClient.get("/project/");
    const rawProjects = unwrapBackendPayload(res);
    const projects = (Array.isArray(rawProjects) ? rawProjects : []).map(normalizeBackendProjectForClient);
    return { data: { projects } };
  },
  getById: async (id) => {
    const res = await backendClient.get(`/project/${id}`);
    return { data: { project: normalizeBackendProjectForClient(unwrapBackendPayload(res)) } };
  },
  search: async (params) => {
    const query = typeof params === "string" ? { q: params } : params || {};
    const res = await backendClient.get("/project/search", { params: query });
    const rawProjects = unwrapBackendPayload(res);
    const projects = (Array.isArray(rawProjects) ? rawProjects : []).map(normalizeBackendProjectForClient);
    return { data: { projects } };
  },
  update: async (id, data) => {
    const res = await backendClient.put(`/project/update/${id}`, {
      title: data.title,
      description: data.description,
      tech_stack: data.techStack ?? data.tech_stack,
      roles_needed: data.rolesNeeded ?? data.roles_needed,
    });
    const project = res?.data?.updatedProject ? normalizeBackendProjectForClient(res.data.updatedProject) : null;
    return { data: { project } };
  },
  delete: async (id) => {
    await backendClient.delete(`/project/delete/${id}`);
    return { data: { success: true } };
  },
  requestJoin: async (projectId) => {
    const res = await backendClient.post(`/project/request/${projectId}`);
    return { data: { message: res?.data?.message || "Join request sent" } };
  },
  respondJoin: async (id, userid, action) => {
    await backendClient.post(`/project/respond/${id}`, { userid, action, role: "other" });
    return { data: { success: true } };
  },
  getMyProjects: async () => {
    const res = await backendClient.get("/project/my-projects");
    const data = unwrapBackendPayload(res) || {};
    return {
      data: {
        createdProjects: (data.createdProjects || []).map(normalizeBackendProjectForClient),
        joinedProjects: (data.joinedProjects || []).map(normalizeBackendProjectForClient),
        pendingRequests: (data.pendingRequests || []).map(normalizeBackendProjectForClient),
        pendingInvitations: (data.pendingInvitations || []).map(normalizeBackendProjectForClient),
        removedFromProjects: (data.removedFromProjects || []).map(normalizeBackendProjectForClient),
      },
    };
  },
  removeMember: async (projectId, userId) => {
    await backendClient.post(`/project/remove-member/${projectId}`, { userId });
    return { data: { success: true } };
  },
  inviteMember: async (projectId, userId) => {
    const res = await backendClient.post(`/project/invite/${projectId}`, { userId });
    return { data: { message: res?.data?.message || "Invite sent" } };
  },
  respondInvite: async (projectId, action) => {
    await backendClient.post(`/project/respond-invitation/${projectId}`, { action, role: "other" });
    return { data: { success: true } };
  },
};

export const authAPI = {
  register: (data) => runBackendWithFallback(() => backendAuthAPI.register(data), () => mockAuthAPI.register(data)),
  login: (data) => runBackendWithFallback(() => backendAuthAPI.login(data), () => mockAuthAPI.login(data)),
  logout: () => runBackendWithFallback(() => backendAuthAPI.logout(), () => mockAuthAPI.logout()),
  me: () => runBackendWithFallback(() => backendAuthAPI.me(), () => mockAuthAPI.me()),
  updateProfile: (data) => runBackendWithFallback(() => backendAuthAPI.updateProfile(data), () => mockAuthAPI.updateProfile(data)),
  getUsers: () => runBackendWithFallback(() => backendAuthAPI.getUsers(), () => mockAuthAPI.getUsers()),
  getUserById: (id) => runBackendWithFallback(() => backendAuthAPI.getUserById(id), () => mockAuthAPI.getUserById(id)),
};

export const aiAPI = {
  match: (payload) => runBackendWithFallback(() => backendAiAPI.match(payload), () => mockAiAPI.match(payload)),
  improveIdea: (payload) => runBackendWithFallback(() => backendAiAPI.improveIdea(payload), () => mockAiAPI.improveIdea(payload)),
  enhanceProfile: (payload) => runBackendWithFallback(() => backendAiAPI.enhanceProfile(payload), () => mockAiAPI.enhanceProfile(payload)),
};

export const projectAPI = {
  create: (data) => runBackendWithFallback(() => backendProjectAPI.create(data), () => mockProjectAPI.create(data)),
  getAll: () => runBackendWithFallback(() => backendProjectAPI.getAll(), () => mockProjectAPI.getAll()),
  getById: (id) => runBackendWithFallback(() => backendProjectAPI.getById(id), () => mockProjectAPI.getById(id)),
  search: (params) => runBackendWithFallback(() => backendProjectAPI.search(params), () => mockProjectAPI.search(params)),
  update: (id, data) => runBackendWithFallback(() => backendProjectAPI.update(id, data), () => mockProjectAPI.update(id, data)),
  delete: (id) => runBackendWithFallback(() => backendProjectAPI.delete(id), () => mockProjectAPI.delete(id)),
  requestJoin: (projectId) => runBackendWithFallback(() => backendProjectAPI.requestJoin(projectId), () => mockProjectAPI.requestJoin(projectId)),
  respondJoin: (id, userid, action) => runBackendWithFallback(() => backendProjectAPI.respondJoin(id, userid, action), () => mockProjectAPI.respondJoin(id, userid, action)),
  getMyProjects: () => runBackendWithFallback(() => backendProjectAPI.getMyProjects(), () => mockProjectAPI.getMyProjects()),
  removeMember: (projectId, userId) => runBackendWithFallback(() => backendProjectAPI.removeMember(projectId, userId), () => mockProjectAPI.removeMember(projectId, userId)),
  inviteMember: (projectId, userId) => runBackendWithFallback(() => backendProjectAPI.inviteMember(projectId, userId), () => mockProjectAPI.inviteMember(projectId, userId)),
  respondInvite: (projectId, action) => runBackendWithFallback(() => backendProjectAPI.respondInvite(projectId, action), () => mockProjectAPI.respondInvite(projectId, action)),
};

if (useBackend) {
  API.interceptors = backendClient.interceptors;
}

export default API;
