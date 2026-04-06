import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import { projectAPI } from '../services/api';
import { useState, useEffect } from 'react';

export default function ProjectDetail() {
  const { id } = useParams();
  const { isLoggedIn, user, getUsers } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [recommendations, setRecommendations] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [allUsers, setAllUsers] = useState([]); // Store all users for AI matching

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await projectAPI.getById(id);
        setProject(res.data.project);
      } catch {
        setProject(null);
      } finally {
        setFetching(false);
      }
    };
    fetchProject();
  }, [id]);

  const isCreator = user && project && (
    String(user._id) === String(project.created_by?._id) || String(user._id) === String(project.created_by)
  );

  const isMember = user && project?.members?.some(
    m => String(m.user?._id || m.user) === String(user._id)
  );

  if (fetching) {
    return (
      <div className="page">
        <div className="loading-screen"><div className="spinner"></div></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="page">
        <div className="detail-page">
          <div className="empty-state">
            <h3>Project Not Found</h3>
            <p>This project may have been removed or the link is invalid.</p>
            <button className="btn btn-primary" onClick={() => navigate('/')}>Back to Explore</button>
          </div>
        </div>
      </div>
    );
  }

  const handleJoin = async () => {
    setMessage('');
    setLoading(true);
    try {
      const res = await projectAPI.requestJoin(project._id);
      setMessage(res.data.message);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (userId) => {
    try {
      const res = await projectAPI.inviteMember(project._id, userId);
      setMessage(res.data.message);
    } catch (err) {
       setMessage(err.response?.data?.message || 'Invite failed');
    }
  };

  const sendEmail = (subject, body) => {
    const ownerEmail = project?.created_by?.email;
    if (!ownerEmail) {
      setMessage('Owner email is not available yet. Backend can attach verified contact details.');
      return;
    }
    const link = `mailto:${ownerEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = link;
  };

  const handleRequestCall = () => {
    sendEmail(
      `Call request for project: ${project?.title || 'CollabHub project'}`,
      `Hi ${project?.created_by?.name || 'there'},%0D%0A%0D%0AI want to discuss collaboration details for your project.%0D%0A%0D%0AThanks.`
    );
    setMessage('Call request draft opened in your email client.');
  };

  return (
    <div className="page">
      <div className="detail-page">
        <button className="btn btn-outline btn-sm back-btn" onClick={() => navigate(-1)}>
          ← Back
        </button>

        <div className="detail-card">
          <div className="detail-meta">
            <span className="project-author">
              by {project.created_by?.name || 'Unknown'}
            </span>
          </div>

          <h1 className="detail-title">{project.title}</h1>

          {project.description && (
            <p className="detail-description">{project.description}</p>
          )}

          {project.tech_stack?.length > 0 && (
            <div className="detail-section">
              <h4>Tech Stack</h4>
              <div className="project-tags">
                {project.tech_stack.map((t, i) => (
                  <span key={i} className="tag tag-tech">{t}</span>
                ))}
              </div>
            </div>
          )}

          {project.roles_needed?.length > 0 && (
            <div className="detail-section">
              <h4>Roles Needed</h4>
              <div className="project-tags">
                {project.roles_needed.map((r, i) => (
                  <span key={i} className="tag tag-role">{r}</span>
                ))}
              </div>
            </div>
          )}

          {project.members?.length > 0 && (
            <div className="detail-section">
              <h4>Team Members</h4>
              <div className="members-list">
                {project.members.map((m, i) => (
                  <button 
                    key={i} 
                    className="member-chip member-chip-btn"
                    onClick={() => navigate(`/user/${m.user?._id || m.user}`, { state: { user: m.user } })}
                    title="View Profile"
                  >
                    {m.user?.name || 'Unknown'} — {m.role}
                  </button>
                ))}
              </div>
            </div>
          )}

          {message && (
            <div className={`alert ${message.includes('lacking') || message.includes('already') || message.includes('failed') ? 'alert-error' : 'alert-success'}`}>
              {message}
            </div>
          )}

          {isLoggedIn && !isCreator && (
            <div className="detail-section" style={{ borderTop: '1px solid var(--border)', paddingTop: '20px', marginTop: '16px' }}>
              <h4>Contact Project Owner</h4>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button className="btn btn-outline btn-sm" onClick={handleRequestCall}>
                  Call User (Send Mail)
                </button>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() =>
                    sendEmail(
                      `Collaboration query: ${project?.title || 'Project'}`,
                      `Hi ${project?.created_by?.name || 'there'},%0D%0A%0D%0AI would like to connect regarding your project collaboration.%0D%0A%0D%0AThanks.`
                    )
                  }
                >
                  Email User
                </button>
              </div>
            </div>
          )}

          {isLoggedIn && isCreator && (
            <div className="detail-section" style={{ borderTop: '1px solid var(--border)', paddingTop: '24px', marginTop: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h4 style={{ margin: 0 }}>✨ AI Recommended Teammates</h4>
                <button 
                  className="btn-ai" 
                  style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                  id="ai-btn-match"
                  onClick={async () => {
                    const btn = document.getElementById('ai-btn-match');
                    btn.disabled = true;
                    btn.innerText = 'Analyzing...';
                    setAiLoading(true);
                    setRecommendations([]);
                    try {
                      const { aiAPI } = await import('../services/api');
                      const usersRes = await getUsers();
                      setAllUsers(usersRes.users);
                      const matchRes = await aiAPI.match({ project, users: usersRes.users });
                      setRecommendations(matchRes.result);
                    } catch (err) {
                      setMessage('Failed to get recommendations');
                    } finally {
                      btn.disabled = false;
                      btn.innerText = '✨ Refresh Recommendations';
                      setAiLoading(false);
                    }
                  }}
                >
                  Get AI Recommendations
                </button>
              </div>

              {aiLoading && (
                <div className="ai-loading">
                  <div className="spinner-sm"></div>
                  <p style={{ fontSize: '0.9rem' }}>Searching for the best matches...</p>
                </div>
              )}

              <div className="stagger-children">
                {recommendations.map((rec, i) => (
                  <div key={i} className="ai-recommendation-card fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
                    <div className="ai-match-header">
                      <div className="ai-match-info">
                        <strong 
                          className="clickable-name"
                          onClick={() => {
                            const fullUser = allUsers.find(u => u._id === rec.id || u.id === rec.id);
                            navigate(`/user/${rec.id}`, { state: { user: fullUser || rec } });
                          }}
                          title="View Profile"
                        >
                          {rec.name}
                        </strong>
                        {rec.percentage > 0 && (
                          <span className="ai-percentage">{rec.percentage}% Match</span>
                        )}
                      </div>
                      <span className="ai-badge">Match</span>
                    </div>
                    <p className="ai-reason">{rec.reason}</p>
                    {rec.percentage > 0 && (
                      <div className="ai-progress-container">
                        <div 
                          className="ai-progress-bar" 
                          style={{ width: `${rec.percentage}%` }}
                        ></div>
                      </div>
                    )}
                    <button 
                      className="btn btn-primary btn-sm" 
                      style={{ marginTop: '16px', display: 'block', width: '100%' }}
                      onClick={() => handleInvite(rec.id)}
                    >
                      ✉️ Send Invite
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isLoggedIn && isCreator && (
            <div style={{ marginTop: '16px', display: 'grid', gap: '10px' }}>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0 }}>
                This is your project. Manage it from <a href="/my-projects">My Projects</a>.
              </p>
              <button
                className="btn btn-primary"
                onClick={() =>
                  navigate(`/project/${project._id}/collaboration`, {
                    state: { projectTitle: project.title, owner: project.created_by },
                  })
                }
              >
                Open Collaboration Room
              </button>
            </div>
          )}

          {isLoggedIn && isMember && !isCreator && (
            <div style={{ marginTop: '16px', display: 'grid', gap: '10px' }}>
              <div className="alert alert-success" style={{ marginBottom: 0 }}>
                You are already a member of this project
              </div>
              <button
                className="btn btn-primary"
                onClick={() =>
                  navigate(`/project/${project._id}/collaboration`, {
                    state: { projectTitle: project.title, owner: project.created_by },
                  })
                }
              >
                Open Collaboration Room
              </button>
            </div>
          )}

          {isLoggedIn && !isCreator && !isMember && (
            <button
              className="btn btn-primary btn-full"
              onClick={handleJoin}
              disabled={loading}
            >
              {loading ? <span className="spinner-sm"></span> : 'Request to Join'}
            </button>
          )}

          {!isLoggedIn && (
            <p className="detail-login-hint">
              <a href="/login">Sign In</a> to Request to Join this project
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
