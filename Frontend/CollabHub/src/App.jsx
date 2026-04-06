import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './Context/AuthContext';
import ParticleBackground from './components/ParticleBackground';
import Navbar from './components/NavBar';
import Footer from './components/Footer';
import CustomCursor from './components/CustomCursor';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './Pages/Home';
import Login from './Pages/Login';
import Register from './Pages/Register';
import CreateProject from './Pages/CreateProject';
import MyProjects from './Pages/MyProject';
import Profile from './Pages/Profile';
import ProjectDetail from './Pages/ProjectDetail';
import UserProfile from './Pages/UserProfile';
import FAQ from './Pages/FAQ';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="app">
          <CustomCursor />
          <ParticleBackground />
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/project/:id" element={<ProjectDetail />} />
              <Route path="/user/:id" element={<UserProfile />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/create-project" element={
                <ProtectedRoute><CreateProject /></ProtectedRoute>
              } />
              <Route path="/my-projects" element={
                <ProtectedRoute><MyProjects /></ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute><Profile /></ProtectedRoute>
              } />
              <Route path="/faq" element={<FAQ />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
