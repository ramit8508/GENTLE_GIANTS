import { Link } from "react-router-dom";

export default function Footer() {
    return (
        <footer className="footer">
      <div className="footer-inner">
        <div className="footer-top">
          <div className="footer-brand">
            <span className="footer-logo">Collabhub</span>
            <p className="footer-tagline">Find teams. Build together.</p>
          </div>
          <div className="footer-links">
            <div className="footer-col">
              <h4>Platform</h4>
              <Link to="/">Explore Projects</Link>
              <Link to="/create-project">Create Project</Link>
              <Link to="/my-projects">My Projects</Link>
            </div>


            <div className="footer-col">
              <h4>Account</h4>
              <Link to="/profile">Profile</Link>
              <Link to="/faq">FAQ</Link>
            </div>

          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} CollabHub. All rights reserved.</span>
          <span className="footer-built">Created by Team GENTLE_GIANTS</span>
        </div>
      </div>
    </footer>
    );
}
