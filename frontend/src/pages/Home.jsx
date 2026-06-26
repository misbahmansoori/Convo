import React, { useContext, useState } from "react";
import withAuth from "../utils/withAuth";
import { useNavigate } from "react-router-dom";
import "../styles/home.css";
import { v4 as uuid } from "uuid";

import { Button, IconButton, TextField } from "@mui/material";

import RestoreIcon from "@mui/icons-material/Restore";
import LogoutIcon from "@mui/icons-material/Logout";
import VideoCallIcon from "@mui/icons-material/VideoCall";
import ChatIcon from "@mui/icons-material/Chat";
import ScreenShareIcon from "@mui/icons-material/ScreenShare";
import SecurityIcon from "@mui/icons-material/Security";

import { AuthContext } from "../contexts/AuthContext";

function HomeComponent() {
  const navigate = useNavigate();

  const [meetingCode, setMeetingCode] = useState("");

  const { addToUserHistory } = useContext(AuthContext);

  // Join meeting and save it in user history
  const handleJoinVideoCall = async () => {
    if (!meetingCode.trim()) return;

    try {
      await addToUserHistory(meetingCode);
    } catch (e) {
      console.error(e);
    }

    navigate(`/${meetingCode.trim()}`);
  };

  const handleCreateMeeting = async () => {
    const meetingId = uuid();

    try {
      await addToUserHistory(meetingId);
    } catch (err) {
      console.error(err);
    }

    navigate(`/${meetingId}`);
  };
  return (
    <div className="homeContainer">
      {/* Decorative Background Blur */}
      <div className="homeBlur blurOne"></div>
      <div className="homeBlur blurTwo"></div>

      {/* =========================
          Navbar
      ========================== */}
      <nav className="homeNavbar">
        <h2 className="logo">Convo</h2>

        <div className="navActions">
          <Button
            startIcon={<RestoreIcon />}
            onClick={() => navigate("/history")}
          >
            History
          </Button>

          <Button
            startIcon={<LogoutIcon />}
            color="error"
            onClick={() => {
              localStorage.removeItem("token");
              navigate("/");
            }}
          >
            Logout
          </Button>
        </div>
      </nav>

      {/* =========================
          Hero Section
      ========================== */}
      <section className="homeHero">
        <div className="heroCard">
          <h1>Start or Join a Meeting</h1>

          <p>
            Create a new meeting instantly or join an existing one using a
            meeting code.
          </p>

          {/* Create Meeting */}
          <div className="newMeetingSection">
            <Button
              variant="contained"
              size="large"
              startIcon={<VideoCallIcon />}
              onClick={handleCreateMeeting}
              className="newMeetingBtn"
            >
              New Meeting
            </Button>
          </div>

          <div className="divider">
            <span>OR</span>
          </div>

          {/* Join Meeting */}

          <div className="meetingInputSection">
            <TextField
              fullWidth
              label="Meeting Code"
              variant="outlined"
              value={meetingCode}
              onChange={(e) => setMeetingCode(e.target.value)}
              sx={{
                "& .MuiInputBase-input": {
                  color: "#fff",
                },
                "& .MuiInputLabel-root": {
                  color: "#94a3b8",
                },
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#475569",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#8b5cf6",
                },
                "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline":
                  {
                    borderColor: "#8b5cf6",
                  },
              }}
            />

            <Button
              variant="contained"
              size="large"
              onClick={handleJoinVideoCall}
              className="joinBtn"
            >
              Join Meeting
            </Button>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="featureGrid">
          <div className="featureCard">
            <VideoCallIcon />
            <h3>HD Meetings</h3>
            <p>Crystal clear WebRTC video calls.</p>
          </div>

          <div className="featureCard">
            <ChatIcon />
            <h3>Live Chat</h3>
            <p>Instant messaging during meetings.</p>
          </div>

          <div className="featureCard">
            <ScreenShareIcon />
            <h3>Screen Share</h3>
            <p>Present your ideas with ease.</p>
          </div>

          <div className="featureCard">
            <SecurityIcon />
            <h3>Secure Rooms</h3>
            <p>Protected meeting access.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default withAuth(HomeComponent);
