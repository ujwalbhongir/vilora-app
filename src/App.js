import React, { useState, useEffect } from 'react';
import LogoImage from './logo.png';
import { auth } from './firebase-config';
import {
  onAuthStateChanged,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from 'firebase/auth';

// --- Import the dashboard from its separate file ---
import ChatDashboard from './components/Dashboard.js';

// --- SVG Icons with enhanced styling ---
const ChatIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="url(#gradient1)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <defs>
      <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#10B981" />
        <stop offset="100%" stopColor="#34D399" />
      </linearGradient>
    </defs>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const HomeworkIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="url(#gradient2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <defs>
      <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#8B5CF6" />
        <stop offset="100%" stopColor="#A78BFA" />
      </linearGradient>
    </defs>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const ProofreadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="url(#gradient3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <defs>
      <linearGradient id="gradient3" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#FBBF24" />
      </linearGradient>
    </defs>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    <path d="m15 5 3 3" />
  </svg>
);

const TravelIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="url(#gradient4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <defs>
      <linearGradient id="gradient4" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#EF4444" />
        <stop offset="100%" stopColor="#F87171" />
      </linearGradient>
    </defs>
    <path d="M22 2L11 13" />
    <path d="M22 2L15 22L11 13L2 9L22 2z" />
  </svg>
);

// --- Helper Components for this file ---
const ViloraLogo = ({ className }) => (
  <div className={className}>
    <img src={LogoImage} alt="Vilora" className="w-16 h-16 mt-2 drop-shadow-2xl" />
  </div>
);

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C42.021,35.596,44,30.138,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
  </svg>
);

// --- Login/Signup Page Component with enhanced styling ---
function LoginPage({ onClose, setNotification }) {
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (isSigningUp) {
      if (password !== confirmPassword) {
        setNotification("Passwords do not match!");
        return;
      }
      try {
        await createUserWithEmailAndPassword(auth, email, password);
        setNotification('Sign up successful!');
        onClose();
      } catch (error) {
        setNotification(error.message);
      }
    } else {
      try {
        await signInWithEmailAndPassword(auth, email, password);
        setNotification('Login successful!');
        onClose();
      } catch (error) {
        setNotification(error.message);
      }
    }
  };

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      setNotification("Google sign-in successful!");
      onClose();
    } catch (error) {
      setNotification(error.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex justify-center items-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-900 via-black to-gray-900 border border-gray-700/50 p-8 rounded-2xl shadow-2xl text-white w-full max-w-md relative backdrop-blur-sm">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl transition-colors duration-200 hover:rotate-90 transform"
        >
          &times;
        </button>
        
        <div className="flex flex-col items-center mb-8">
          <ViloraLogo className="w-16 h-16" />
          <h2 
            className="text-3xl font-bold text-center mt-4 bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent" 
            style={{ fontFamily: "'Inter', sans-serif", fontWeight: '700', letterSpacing: '-0.02em' }}
          >
            {isSigningUp ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="text-gray-400 text-sm mt-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            {isSigningUp ? 'Join the AI revolution' : 'Continue your journey'}
          </p>
        </div>
        
        <form onSubmit={handleEmailSubmit} className="space-y-5">
          <div className="relative">
            <input 
              type="email" 
              placeholder="Email Address" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              className="w-full p-4 bg-gray-800/50 border border-gray-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-400 transition-all duration-300 backdrop-blur-sm"
              style={{ fontFamily: "'Inter', sans-serif" }}
            />
          </div>
          
          <div className="relative">
            <input 
              type="password" 
              placeholder="Password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              className="w-full p-4 bg-gray-800/50 border border-gray-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-400 transition-all duration-300 backdrop-blur-sm"
              style={{ fontFamily: "'Inter', sans-serif" }}
            />
          </div>
          
          {isSigningUp && (
            <div className="relative">
              <input 
                type="password" 
                placeholder="Confirm Password" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                required 
                className="w-full p-4 bg-gray-800/50 border border-gray-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-400 transition-all duration-300 backdrop-blur-sm"
                style={{ fontFamily: "'Inter', sans-serif" }}
              />
            </div>
          )}
          
          <button 
            type="submit" 
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 px-4 rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg hover:shadow-green-500/25"
            style={{ fontFamily: "'Inter', sans-serif", fontWeight: '600' }}
          >
            {isSigningUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>
        
        <div className="relative flex py-6 items-center">
          <div className="flex-grow border-t border-gray-600/50"></div>
          <span className="flex-shrink mx-4 text-gray-400 text-sm" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            OR
          </span>
          <div className="flex-grow border-t border-gray-600/50"></div>
        </div>
        
        <button 
          type="button" 
          onClick={handleGoogleSignIn} 
          className="w-full flex justify-center items-center gap-3 bg-white/10 backdrop-blur-sm text-white font-semibold py-4 px-4 rounded-xl border border-gray-600/50 hover:bg-white/20 transition-all duration-300 transform hover:scale-[1.02]"
          style={{ fontFamily: "'Inter', sans-serif", fontWeight: '500' }}
        >
          <GoogleIcon />
          Continue with Google
        </button>
        
        <p className="text-center text-gray-400 text-sm mt-6" style={{ fontFamily: "'Inter', sans-serif" }}>
          {isSigningUp ? 'Already have an account?' : "Don't have an account?"}
          <button 
            onClick={() => setIsSigningUp(!isSigningUp)} 
            className="font-semibold text-green-400 hover:text-green-300 ml-1 transition-colors duration-200"
          >
            {isSigningUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  );
}

// --- Landing Page Section with enhanced typography ---
function LandingSection({ onWebAppClick }) {
  return (
    <section className="min-h-screen flex flex-col justify-center items-center text-center text-white p-4 relative z-10">
      <div className="absolute top-8">
        <ViloraLogo className="h-16 w-16 mb-2 mx-auto" />
        <h2 
          className="text-2xl font-light tracking-[0.3em] bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent" 
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          VILORA
        </h2>
        <p 
          className="text-xs text-gray-400 tracking-[0.4em] mt-1" 
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          PERSONAL AI
        </p>
      </div>
      
      <div className="space-y-6 max-w-4xl">
        <h1 
          className="text-5xl md:text-7xl font-light mb-8 leading-tight bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent" 
          style={{ 
            fontFamily: "'Playfair Display', serif", 
            fontWeight: '300',
            letterSpacing: '-0.02em'
          }}
        >
          VILORA
        </h1>
        
        <p 
          className="text-xl md:text-2xl text-gray-300 mb-8 font-light tracking-wide" 
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          The Personal AI Assistant
        </p>
      </div>
      
      <button 
        onClick={onWebAppClick} 
        className="group bg-gradient-to-r from-gray-800/50 to-gray-900/50 backdrop-blur-md border border-gray-600/50 hover:border-green-400/50 transition-all duration-500 text-white font-semibold py-4 px-10 rounded-2xl flex items-center space-x-3 mb-12 transform hover:scale-105 hover:shadow-xl hover:shadow-green-500/20" 
        style={{ fontFamily: "'Inter', sans-serif", fontWeight: '500', letterSpacing: '0.02em' }}
      >
        <span>Launch Web App</span>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" 
          viewBox="0 0 20 20" 
          fill="currentColor"
        >
          <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"></path>
          <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z"></path>
        </svg>
      </button>
      
      <p 
        className="max-w-lg text-lg text-gray-300 leading-relaxed" 
        style={{ fontFamily: "'Crimson Text', serif", fontStyle: 'italic' }}
      >
        Vilora — The revolutionary AI chatbot developed by{' '}
        <span className="text-green-400 font-medium">Ujwal Bhongir</span>.
      </p>
      
      <div className="absolute bottom-8 animate-bounce">
        <p 
          className="text-sm text-gray-400 mb-2 tracking-wide" 
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          scroll down for features
        </p>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-6 w-6 mx-auto text-green-400" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </section>
  );
}

// --- Features Section with enhanced design ---
const featuresData = [
    { 
      icon: <ChatIcon />, 
      title: 'Open for Questions', 
      description: 'Vilora is here for you 24/7. This AI Assistant can generate humanlike responses, making you feel like you are chatting with an old friend. It can even recommend a book to read or a movie to watch!',
      color: 'from-green-500 to-emerald-600'
    },
    { 
      icon: <HomeworkIcon />, 
      title: 'Homework Helper', 
      description: 'Get comprehensive help with your homework, from essays and compositions to complex math questions. Vilora adapts to your learning style and provides step-by-step guidance.',
      color: 'from-purple-500 to-indigo-600'
    },
    { 
      icon: <ProofreadIcon />, 
      title: 'Professional Proofreader', 
      description: 'Vilora is a top-tier proofreader that analyzes written work and offers intelligent suggestions to help you create professional-grade documents with perfect grammar and style.',
      color: 'from-amber-500 to-orange-600'
    },
    { 
      icon: <TravelIcon />, 
      title: 'Smart Travel Agent', 
      description: 'Plan the perfect trip with personalized itineraries based on your preferences. Get detailed budget analysis to ensure your travel is both enjoyable and cost-effective.',
      color: 'from-red-500 to-pink-600'
    },
];

function FeaturesSection() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % featuresData.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + featuresData.length) % featuresData.length);
  };

  const currentFeature = featuresData[currentIndex];

  return (
    <section className="min-h-screen flex flex-col justify-center items-center text-white p-4 relative z-10">
      <div className="text-center w-full max-w-5xl">
        <h2 
          className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent" 
          style={{ fontFamily: "'Inter', sans-serif", fontWeight: '800', letterSpacing: '-0.02em' }}
        >
          Ask Anything.
          <span className="text-gray-500 font-light"> Anytime</span>
        </h2>
        
        <p 
          className="text-gray-300 mb-16 text-lg leading-relaxed max-w-2xl mx-auto" 
          style={{ fontFamily: "'Inter', sans-serif", fontWeight: '400' }}
        >
          Ask your questions — short, long or anything in between. <br />
          The more precise you ask, the better the answer.
        </p>
        
        <div className="flex items-center justify-between w-full">
          <button 
            onClick={handlePrev} 
            className="p-4 rounded-full hover:bg-white/10 transition-all duration-300 transform hover:scale-110 hover:shadow-lg backdrop-blur-sm border border-gray-700/50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div className="text-center flex-grow px-8">
            <div className="mb-8 h-20 flex justify-center items-center transform transition-all duration-500 hover:scale-110">
              {currentFeature.icon}
            </div>
            
            <h3 
              className={`text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r ${currentFeature.color} bg-clip-text text-transparent`} 
              style={{ fontFamily: "'Inter', sans-serif", fontWeight: '700', letterSpacing: '-0.01em' }}
            >
              {currentFeature.title}
            </h3>
            
            <p 
              className="text-gray-300 max-w-2xl mx-auto leading-relaxed text-lg" 
              style={{ fontFamily: "'Inter', sans-serif", fontWeight: '400', lineHeight: '1.7' }}
            >
              {currentFeature.description}
            </p>
          </div>
          
          <button 
            onClick={handleNext} 
            className="p-4 rounded-full hover:bg-white/10 transition-all duration-300 transform hover:scale-110 hover:shadow-lg backdrop-blur-sm border border-gray-700/50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        
        {/* Feature indicators */}
        <div className="flex justify-center space-x-3 mt-12">
          {featuresData.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentIndex 
                  ? `bg-gradient-to-r ${currentFeature.color} shadow-lg` 
                  : 'bg-gray-600 hover:bg-gray-500'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// --- Main App Component with enhanced styling ---
export default function App() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [notification, setNotification] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification('');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleOpenLogin = () => setIsLoginOpen(true);
  const handleCloseLogin = () => setIsLoginOpen(false);
  
  const handleLogout = async () => {
    await signOut(auth);
    setNotification("You have been logged out.");
  };

  return (
    <>
      {/* Google Fonts Import */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
      <link 
        href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Playfair+Display:wght@300;400;500;600;700&family=JetBrains+Mono:wght@300;400;500;600;700&family=Crimson+Text:ital,wght@0,400;0,600;1,400;1,600&display=swap" 
        rel="stylesheet" 
      />
      
      <div className="bg-black min-h-screen relative overflow-hidden">
        {/* Enhanced background effects */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[200%] h-[80%] bg-gradient-to-t from-green-500/20 via-emerald-500/10 to-transparent rounded-[100%] blur-3xl filter opacity-40 animate-pulse"></div>
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl filter opacity-30 animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl filter opacity-25 animate-pulse" style={{ animationDelay: '2s' }}></div>
        
        {isLoginOpen && <LoginPage onClose={handleCloseLogin} setNotification={setNotification} />}

        <main>
          {user ? (
            <ChatDashboard onLogout={handleLogout} user={user} />
          ) : (
            <>
              <LandingSection onWebAppClick={handleOpenLogin} />
              <FeaturesSection />
            </>
          )}
        </main>

        {/* Enhanced Notification Toast */}
        {notification && (
          <div className="fixed top-8 left-1/2 -translate-x-1/2 bg-gradient-to-r from-gray-800 to-gray-900 text-white px-6 py-4 rounded-2xl shadow-2xl z-50 border border-gray-700/50 backdrop-blur-md animate-slide-down">
            <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: '500' }}>
              {notification}
            </p>
          </div>
        )}
      </div>
      
      <style jsx>{`
        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
        
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
        
        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.1);
        }
        
        ::-webkit-scrollbar-thumb {
          background: rgba(34, 197, 94, 0.3);
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(34, 197, 94, 0.5);
        }
      `}</style>
    </>
  );
}