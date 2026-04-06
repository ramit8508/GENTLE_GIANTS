import { useState } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import TagSelector from "../components/TagSelector";
import { TECH_STACK_OPTIONS } from '../constants/options';

const GITHUB_URL_REGEX = /^https:\/\/github\.com\/[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,38}[a-zA-Z0-9])?$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(form) {
  const errors = {};

  // Name
  if (!form.name.trim()) {
    errors.name = "Name is required.";
  } else if (form.name.trim().length < 2) {
    errors.name = "Name must be at least 2 characters.";
  } else if (form.name.trim().length > 50) {
    errors.name = "Name must be under 50 characters.";
  }

  // Email
  if (!form.email.trim()) {
    errors.email = "Email is required.";
  } else if (!EMAIL_REGEX.test(form.email)) {
    errors.email = "Enter a valid email address.";
  } else if (!form.email.toLowerCase().endsWith("@gmail.com")) {
    errors.email = "Only Gmail addresses are allowed.";
  }

  // Password
  if (!form.password) {
    errors.password = "Password is required.";
  } else if (form.password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  } else if (!/[A-Z]/.test(form.password)) {
    errors.password = "Password must contain at least one uppercase letter.";
  } else if (!/[0-9]/.test(form.password)) {
    errors.password = "Password must contain at least one number.";
  }

  // GitHub (optional but validated if provided)
  if (form.github && !GITHUB_URL_REGEX.test(form.github)) {
    errors.github = "Enter a valid GitHub profile URL (e.g. https://github.com/username).";
  }

  // Skills
  if (form.skills.length === 0) {
    errors.skills = "Please select at least one skill.";
  }

  // Bio
  if (form.bio && form.bio.length > 300) {
    errors.bio = `Bio must be under 300 characters (${form.bio.length}/300).`;
  }

  return errors;
}

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    skills: [],
    github: "",
    bio: "",
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register, isLoggedIn, loading: loadingAuth } = useAuth();
  const navigate = useNavigate();

  if (loadingAuth) return <div className="loading-screen"><div className="spinner"></div></div>;
  if (isLoggedIn) return <Navigate to="/" replace />;

  const handleChange = (e) => {
    const updated = { ...form, [e.target.name]: e.target.value };
    setForm(updated);
    // Re-validate the changed field if it's been touched
    if (touched[e.target.name]) {
      const newErrors = validate(updated);
      setErrors((prev) => ({ ...prev, [e.target.name]: newErrors[e.target.name] }));
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const newErrors = validate(form);
    setErrors((prev) => ({ ...prev, [name]: newErrors[name] }));
  };

  const handleSkillsChange = (selected) => {
    const updated = { ...form, skills: selected };
    setForm(updated);
    if (touched.skills) {
      const newErrors = validate(updated);
      setErrors((prev) => ({ ...prev, skills: newErrors.skills }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");

    // Mark all fields as touched and run full validation
    const allTouched = Object.keys(form).reduce((acc, key) => ({ ...acc, [key]: true }), {});
    setTouched(allTouched);
    const validationErrors = validate(form);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return;

    setLoading(true);
    try {
      await register(form);
      navigate("/");
    } catch (err) {
      setSubmitError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fieldError = (name) =>
    touched[name] && errors[name] ? (
      <span className="field-error">{errors[name]}</span>
    ) : null;

  return (
    <div className="auth-page">
      <div className="auth-card auth-card-wide-lg">
        <div className="auth-header">
          <h1>Create Account</h1>
          <p>Sign up to start collaborating on CollabHub</p>
        </div>

        {submitError && <div className="alert alert-error">{submitError}</div>}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input
                id="name"
                type="text"
                name="name"
                placeholder="Your name"
                value={form.name}
                onChange={handleChange}
                onBlur={handleBlur}
                className={touched.name && errors.name ? "input-error" : ""}
                aria-describedby="name-error"
              />
              {fieldError("name")}
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                name="email"
                placeholder="you@gmail.com"
                value={form.email}
                onChange={handleChange}
                onBlur={handleBlur}
                className={touched.email && errors.email ? "input-error" : ""}
                aria-describedby="email-error"
              />
              {fieldError("email")}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                name="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                onBlur={handleBlur}
                className={touched.password && errors.password ? "input-error" : ""}
                aria-describedby="password-error"
              />
              {fieldError("password")}
              {/* Password strength indicator */}
              {form.password && (
                <PasswordStrength password={form.password} />
              )}
            </div>

            <div className="form-group">
              <label htmlFor="github">GitHub Profile <span className="label-optional">(optional)</span></label>
              <input
                id="github"
                type="url"
                name="github"
                placeholder="https://github.com/username"
                value={form.github}
                onChange={handleChange}
                onBlur={handleBlur}
                className={touched.github && errors.github ? "input-error" : ""}
                aria-describedby="github-error"
              />
              {fieldError("github")}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <TagSelector
                label="Skills"
                placeholder="Update your skills..."
                options={TECH_STACK_OPTIONS}
                selectedTags={form.skills}
                onChange={handleSkillsChange}
                onBlur={() => {
                  setTouched((prev) => ({ ...prev, skills: true }));
                  const newErrors = validate(form);
                  setErrors((prev) => ({ ...prev, skills: newErrors.skills }));
                }}
              />
              {fieldError("skills")}
            </div>

            <div className="form-group">
              <label htmlFor="bio">
                Bio <span className="label-optional">(optional)</span>
              </label>
              <textarea
                id="bio"
                name="bio"
                placeholder="Tell us about yourself"
                value={form.bio}
                onChange={handleChange}
                onBlur={handleBlur}
                className={touched.bio && errors.bio ? "input-error" : ""}
                style={{ minHeight: "120px" }}
                maxLength={300}
              />
              <span className={`char-count ${form.bio.length > 270 ? "char-count-warn" : ""}`}>
                {form.bio.length}/300
              </span>
              {fieldError("bio")}
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? <span className="spinner-sm"></span> : "Sign Up"}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

// --- Password strength sub-component ---
function PasswordStrength({ password }) {
  const checks = [
    { label: "8+ characters", pass: password.length >= 8 },
    { label: "Uppercase letter", pass: /[A-Z]/.test(password) },
    { label: "Number", pass: /[0-9]/.test(password) },
    { label: "Special character", pass: /[^A-Za-z0-9]/.test(password) },
  ];

  const score = checks.filter((c) => c.pass).length;

  // Color and label mapping for each strength level
  const strengthLevels = {
    0: { label: "", color: "#ccc" },
    1: { label: "Weak", color: "#e53e3e" },
    2: { label: "Fair", color: "#dd6b20" },
    3: { label: "Good", color: "#d69e2e" },
    4: { label: "Strong", color: "#38a169" },
  };

  const current = strengthLevels[score];

  return (
    <div className="password-strength">
      <div className="strength-bar">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="strength-segment"
            style={{
              backgroundColor: i <= score ? current.color : "#ccc",
            }}
          />
        ))}
      </div>
      {score > 0 && (
        <span className="strength-label" style={{ color: current.color }}>
          {current.label}
        </span>
      )}
      <ul className="strength-checklist">
        {checks.map((c) => (
          <li key={c.label} className={c.pass ? "check-pass" : "check-fail"}>
            {c.pass ? "✓" : "✗"} {c.label}
          </li>
        ))}
      </ul>
    </div>
  );
}