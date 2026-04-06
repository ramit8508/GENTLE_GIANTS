import { useState, useEffect } from 'react';
import { useAuth } from '../Context/AuthContext';
import { authAPI } from '../services/api';
import TagSelector from '../components/TagSelector';
import { TECH_STACK_OPTIONS } from '../constants/options';

export default function Profile() {
  const { updateProfile, enhanceBio } = useAuth();
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', skills: [], bio: '', github: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Fetch user data on mount by calling updateProfile with empty body
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await authAPI.me();
        setUser(res.data.user);
      } catch (err) {
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const startEditing = () => {
    setForm({
      name: user?.name || '',
      skills: user?.skills || [],
      bio: user?.bio || '',
      github: user?.github || '',
    });
    setEditing(true);
    setSuccess('');
    setError('');
  };

  const cancelEditing = () => {
    setEditing(false);
    setSuccess('');
    setError('');
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      const payload = {};
      if (form.name) payload.name = form.name;
      if (form.skills && form.skills.length > 0) payload.skills = form.skills;
      if (form.bio) payload.bio = form.bio;
      if (form.github) payload.github = form.github;
      const res = await updateProfile(payload);
      setUser(res.user);
      setEditing(false);
      setSuccess('Profile updated successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page">
        <div className="loading-screen"><div className="spinner"></div></div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="form-page">
        <div className="form-card">
          <div className="form-header">
            <div className="auth-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <h1>{editing ? 'Edit Profile' : 'My Profile'}</h1>
            <p>{editing ? 'Update your information below' : 'Your account details'}</p>
          </div>

          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          {/* ===== View Mode ===== */}
          {!editing && user && (
            <div className="profile-view">
              <div className="profile-field">
                <span className="profile-label">Username</span>
                <span className="profile-value">{user.name}</span>
              </div>

              <div className="profile-field">
                <span className="profile-label">Email</span>
                <span className="profile-value">{user.email}</span>
              </div>

              <div className="profile-field">
                <span className="profile-label">Skills</span>
                <div className="project-tags">
                  {user.skills?.length > 0
                    ? user.skills.map((s, i) => <span key={i} className="tag tag-tech">{s}</span>)
                    : <span className="profile-empty">No skills added</span>
                  }
                </div>
              </div>

              <div className="profile-field">
                <span className="profile-label">Bio</span>
                <span className="profile-value">{user.bio || <span className="profile-empty">No bio added</span>}</span>
              </div>

              <div className="profile-field">
                <span className="profile-label">GitHub</span>
                {user.github ? (
                  <a href={user.github} target="_blank" rel="noreferrer" className="profile-value">{user.github}</a>
                ) : (
                  <span className="profile-empty">Not set</span>
                )}
              </div>

              <button className="btn btn-primary btn-full" onClick={startEditing}>
                Edit Profile
              </button>
            </div>
          )}

          {/* ===== Edit Mode ===== */}
          {editing && (
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="name">Username</label>
                <input id="name" type="text" name="name" placeholder="New username" value={form.name} onChange={handleChange} />
              </div>

              <TagSelector 
                label="Skills"
                placeholder="Update your skills..."
                options={TECH_STACK_OPTIONS}
                selectedTags={form.skills} 
                onChange={(selected) => setForm({ ...form, skills: selected })}
              />

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label htmlFor="bio" style={{ margin: 0 }}>Bio</label>
                  <button 
                    type="button" 
                    className="btn-ai"
                    onClick={async () => {
                      if (!form.bio) return;
                      const btn = document.getElementById('ai-btn-enhance');
                      const originalText = btn.innerText;
                      btn.disabled = true;
                      btn.innerText = 'Enhancing...';
                      try {
                        const result = await enhanceBio(form.bio);
                        setForm({ ...form, bio: result });
                      } catch (err) {
                        setError('AI Enhancement failed');
                      } finally {
                        btn.disabled = false;
                        btn.innerText = originalText;
                      }
                    }}
                    id="ai-btn-enhance"
                    style={{ padding: '4px 12px', fontSize: '0.75rem' }}
                  >
                    ✨ AI Enhance
                  </button>
                </div>
                <textarea id="bio" name="bio" placeholder="A bit about yourself..." rows="3" value={form.bio} onChange={handleChange} />
              </div>

              <div className="form-group">
                <label htmlFor="github">GitHub URL</label>
                <input id="github" type="url" name="github" placeholder="https://github.com/you" value={form.github} onChange={handleChange} />
              </div>

              <div className="profile-actions">
                <button type="button" className="btn btn-outline" onClick={cancelEditing}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <span className="spinner-sm"></span> : 'Save Changes'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
