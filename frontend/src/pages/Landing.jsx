import "../styles/landing.css";
import { Link, useNavigate } from "react-router-dom";
import { useContext, React } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { generateMeetingCode } from "../utils/meetingCode";

// MUI Icons
import VideoCallIcon from "@mui/icons-material/VideoCall";
import ChatIcon from "@mui/icons-material/Chat";
import ScreenShareIcon from "@mui/icons-material/ScreenShare";
import SecurityIcon from "@mui/icons-material/Security";

export default function Landing() {
  const { userData, setUserData } = useContext(AuthContext);
  const navigate = useNavigate();

  const isLoggedIn = !!localStorage.getItem("token");

  const handleGuestJoin = () => {
    const meetingCode = generateMeetingCode();
    navigate(`/${meetingCode}`);
  };
  return (
    <div className="landingPageContainer">
      {/* Decorative Background Blurs */}
      <div className="landingBlur blurOne"></div>
      <div className="landingBlur blurTwo"></div>

      {/* Navbar */}
      <nav className="landingNavbar">
        <div className="navHeader">
          <h2>Convo</h2>
        </div>

        <div className="navList">
          {!isLoggedIn ? (
            <>
              <button className="navBtnSecondary" onClick={handleGuestJoin}>
                Join as Guest
              </button>

              <Link to="/auth">
                <button className="navBtn">Get Started</button>
              </Link>
            </>
          ) : (
            <>
              <button className="navBtn" onClick={() => navigate("/home")}>
                Dashboard
              </button>

              <button
                className="navBtnSecondary"
                onClick={() => {
                  localStorage.removeItem("token");
                  localStorage.removeItem("user");
                  setUserData(null);
                  navigate("/", { replace: true });
                }}
              >
                Logout
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="landingHero">
        <div className="heroContent">
          {/* Hero Badge */}
          <span className="heroBadge">Secure Video Meetings Platform</span>

          {/* Hero Heading */}
          <h1>
            {!isLoggedIn ? (
              <>
                Connect, Collaborate &<span> Communicate</span>
              </>
            ) : (
              <>
                Welcome Back,
                <span> {userData?.name || "User"} 👋</span>
              </>
            )}
          </h1>

          {/* Hero Description */}
          <p>
            {!isLoggedIn
              ? "Experience crystal-clear video meetings, real-time chat, screen sharing and secure meeting rooms — all in one place."
              : "You're already signed in. Continue to your dashboard to start a new meeting or join an existing one."}
          </p>

          {/* CTA Buttons */}
          <div className="heroButtons">
            {!isLoggedIn ? (
              <>
                <Link to="/auth">
                  <button className="primaryBtn">Get Started</button>
                </Link>

                <button className="secondaryBtn" onClick={handleGuestJoin}>
                  Join as Guest
                </button>
              </>
            ) : (
              <button className="primaryBtn" onClick={() => navigate("/home")}>
                Go to Dashboard
              </button>
            )}
          </div>

          {/* Features */}
          <div className="featureGrid">
            <div className="featureCard">
              <VideoCallIcon />
              <h3>HD Meetings</h3>
              <p>Real-time WebRTC video calls.</p>
            </div>

            <div className="featureCard">
              <ChatIcon />
              <h3>Live Chat</h3>
              <p>Instant messaging during meetings.</p>
            </div>

            <div className="featureCard">
              <ScreenShareIcon />
              <h3>Screen Sharing</h3>
              <p>Present ideas effortlessly.</p>
            </div>

            <div className="featureCard">
              <SecurityIcon />
              <h3>Secure Access</h3>
              <p>Protected rooms with authentication.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
