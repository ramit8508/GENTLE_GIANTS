import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { projectAPI } from '../services/api';

export default function MyProjects() {
  const [data, setData] = useState({ createdProjects: [], joinedProjects: [], pendingRequests: [], removedFromProjects: [], pendingInvitations: [] });
  const [activeTab, setActiveTab] = useState('created');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMyProjects = async () => {
    setLoading(true);
    try {
      const res = await projectAPI.getMyProjects();
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyProjects();
  }, []);

  const handleRespond = async (projectId, userId, action) => {
    try {
      await projectAPI.respondJoin(projectId, userId, action);
      fetchMyProjects();
      if(action === 'accept') {
        setActiveTab('joined');
      } else {
        setActiveTab('pending');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed');
    }
  };

  const handleRespondInvite = async (projectId, action) => {
    try {
      await projectAPI.respondInvite(projectId, action);
      fetchMyProjects();
      if(action === 'accept') {
        setActiveTab('joined');
      } else {
        setActiveTab('invitations');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed');
    }
  };


  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
      await projectAPI.delete(id);
      fetchMyProjects();
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  const handleRemoveMember = async (projectId, userId, userName) => {
    if (!confirm(`Are you sure you want to remove ${userName} from the project?`)) return;
    try {
      await projectAPI.removeMember(projectId, userId);
      fetchMyProjects();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove member');
    }
  };

  const tabs = [
    { key: 'created', label: 'Created', count: data.createdProjects?.length || 0 },
    { key: 'joined', label: 'Joined', count: data.joinedProjects?.length || 0 },
    { key: 'pending', label: 'Pending', count: data.pendingRequests?.length || 0 },
    { key: 'invitations', label: 'Invitations', count: data.pendingInvitations?.length || 0 },
    { key: 'removed', label: 'Removed', count: data.removedFromProjects?.length || 0 },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <h1>My Projects</h1>
        <p>Manage your projects, teams, and requests</p>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`tab ${activeTab === tab.key ? 'tab-active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
            <span className="tab-badge">{tab.count}</span>
          </button>
        ))}
      </div>

      {loading && (
        <div className="loading-screen">
          <div className="spinner"></div>
        </div>
      )}

      {error && <div className="alert alert-error">{error}</div>}

      {/* Created Tab */}
      {!loading && activeTab === 'created' && (
        <div className="projects-list stagger-children">
          {data.createdProjects?.length === 0 && (
            <div className="empty-state fade-in">
              <h3>No projects created yet</h3>
              <p>Start by creating your first project!</p>
            </div>
          )}
          {data.createdProjects?.map(project => (
            <div key={project._id} className="project-card project-card-detailed">
              <div className="project-card-top">
                <div>
                  <Link to={`/project/${project._id}`} state={{ project }} style={{ textDecoration: 'none', color: 'inherit', opacity: 1 }}><h3 className="project-title">{project.title}</h3></Link>
                  <div className="project-info-sections" style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className="info-group">
                      <h4 style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '8px' }}>Skills Required</h4>
                      <div className="project-tags">
                        {project.tech_stack?.map((t, i) => (
                          <span key={i} className="tag tag-tech">{t}</span>
                        ))}
                      </div>
                    </div>
                    <div className="info-group">
                      <h4 style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '8px' }}>Roles Needed</h4>
                      <div className="project-tags">
                        {project.roles_needed?.map((r, i) => (
                          <span key={i} className="tag tag-role">{r}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(project._id)}>
                  Delete
                </button>
              </div>

              <div style={{ marginTop: '12px' }}>
                <Link
                  to={`/project/${project._id}/collaboration`}
                  state={{ projectTitle: project.title, owner: project.created_by }}
                  className="btn btn-primary btn-sm"
                >
                  Open Collaboration Room
                </Link>
              </div>

              {/* Members */}
              <div className="project-section">
                <h4>Team Members</h4>
                {project.members?.length > 0 ? (
                  <div className="members-list">
                    {project.members.map((m, i) => (
                      <div key={i} className="member-item" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Link
                          to={`/user/${m.user?._id || i}`}
                          state={{ user: { ...m.user, role: m.role } }}
                          className="member-chip member-chip-link"
                          style={{ textDecoration: 'none', color: 'inherit', flex: 1 }}
                        >
                          {m.user?.name || 'Unknown'} — {m.role}
                        </Link>
                        <button 
                          className="btn btn-danger btn-xs" 
                          style={{ padding: '2px 6px' }}
                          onClick={() => handleRemoveMember(project._id, m.user?._id, m.user?.name)}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
                    No members yet
                  </p>
                )}
              </div>

              {/* Join Requests */}
              {project.join_requests?.filter(r => r.status === 'pending').length > 0 && (
                <div className="project-section requests-section">
                  <div className="requests-header">
                    <h4>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                        <circle cx="8.5" cy="7" r="4"/>
                        <line x1="20" y1="8" x2="20" y2="14"/>
                        <line x1="23" y1="11" x2="17" y2="11"/>
                      </svg>
                      Join Requests
                    </h4>
                    <span className="requests-count">{project.join_requests.filter(r => r.status === 'pending').length}</span>
                  </div>
                  <div className="requests-list">
                    {project.join_requests.filter(r => r.status === 'pending').map((req, i) => (
                      <div key={i} className="request-card">
                        <div className="request-user">
                          <div className="request-avatar">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                              <circle cx="12" cy="7" r="4"/>
                            </svg>
                          </div>
                          <div className="request-info">
                            <span className="request-name">{req.user?.name || 'Unknown User'}</span>
                            <span className="request-label">Wants to join this project</span>
                          </div>
                        </div>
                        <div className="request-actions">
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleRespond(project._id, req.user?._id || req.user, 'accept')}
                          >
                            ✓ Accept
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleRespond(project._id, req.user?._id || req.user, 'reject')}
                          >
                            ✕ Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Joined Tab */}
      {!loading && activeTab === 'joined' && (
        <div className="projects-list">
          {data.joinedProjects?.length === 0 && (
            <div className="empty-state">
              <h3>Haven't joined any projects</h3>
              <p>Browse projects and request to join!</p>
            </div>
          )}
          {data.joinedProjects?.map(project => (
            <div key={project._id} className="project-card">
              <div className="project-card-header">
                <Link to={`/project/${project._id}`} state={{ project }} style={{ textDecoration: 'none', color: 'inherit', opacity: 1 }}><h3 className="project-title">{project.title}</h3></Link>
                <span className="project-author">by {project.created_by?.name || 'Unknown'}</span>
              </div>
              <div className="project-tags">
                {project.tech_stack?.map((t, i) => (
                  <span key={i} className="tag tag-tech">{t}</span>
                ))}
                {project.roles_needed?.map((r, i) => (
                  <span key={i} className="tag tag-role">{r}</span>
                ))}
              </div>
              <div style={{ marginTop: '14px' }}>
                <Link
                  to={`/project/${project._id}/collaboration`}
                  state={{ projectTitle: project.title, owner: project.created_by }}
                  className="btn btn-primary btn-sm"
                >
                  Open Collaboration Room
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pending Tab */}
      {!loading && activeTab === 'pending' && (
        <div className="projects-list">
          {data.pendingRequests?.length === 0 && (
            <div className="empty-state">
              <h3>No pending requests</h3>
              <p>Your join requests will appear here</p>
            </div>
          )}
          {data.pendingRequests?.map(project => (
            <div key={project._id} className="project-card">
              <div className="project-card-header">
                <Link to={`/project/${project._id}`} style={{ textDecoration: 'none', color: 'inherit', opacity: 1 }}><h3 className="project-title">{project.title}</h3></Link>
                <span className="project-author">by {project.created_by?.name || 'Unknown'}</span>
              </div>
              <div className="project-tags">
                {project.tech_stack?.map((t, i) => (
                  <span key={i} className="tag tag-tech">{t}</span>
                ))}
              </div>
              <span className="status-badge status-pending">Pending Request sent</span>
            </div>
          ))}
        </div>
      )}

      {/* Invitations Tab */}
      {!loading && activeTab === 'invitations' && (
        <div className="projects-list">
          {data.pendingInvitations?.length === 0 && (
            <div className="empty-state">
              <h3>No invitations</h3>
              <p>You have no project invitations.</p>
            </div>
          )}
          {data.pendingInvitations?.map(project => (
            <div key={project._id} className="project-card" style={{ border: '1px solid var(--accent)' }}>
              <div className="project-card-header">
                <Link to={`/project/${project._id}`} style={{ textDecoration: 'none', color: 'inherit', opacity: 1 }}><h3 className="project-title">{project.title}</h3></Link>
                <span className="project-author">Invited by {project.created_by?.name || 'Unknown'}</span>
              </div>
              <div className="project-tags">
                {project.tech_stack?.map((t, i) => (
                  <span key={i} className="tag tag-tech">{t}</span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleRespondInvite(project._id, 'accept')}
                >
                  ✓ Accept Invite
                </button>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => handleRespondInvite(project._id, 'reject')}
                >
                  ✕ Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Removed Tab */}
      {!loading && activeTab === 'removed' && (
        <div className="projects-list">
          {data.removedFromProjects?.length === 0 && (
            <div className="empty-state">
              <h3>No removals</h3>
              <p>You haven't been removed from any projects.</p>
            </div>
          )}
          {data.removedFromProjects?.map(project => (
            <div key={project._id} className="project-card" style={{ border: '2px solid var(--accent-red)', position: 'relative' }}>
              <div className="project-card-header">
                <h3 className="project-title" style={{ color: 'var(--accent-red)' }}>{project.title}</h3>
                <span className="project-author">by {project.created_by?.name || 'Unknown'}</span>
              </div>
              
              <div style={{ 
                marginTop: '16px', 
                padding: '12px', 
                background: 'rgba(204, 0, 0, 0.05)', 
                borderLeft: '4px solid var(--accent-red)',
                color: 'var(--accent-red)',
                fontWeight: '600',
                fontSize: '0.9rem'
              }}>
                You have been removed from this project by the owner.
              </div>

              <div className="project-tags" style={{ marginTop: '16px', opacity: 0.6 }}>
                {project.tech_stack?.map((t, i) => (
                  <span key={i} className="tag tag-tech">{t}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
