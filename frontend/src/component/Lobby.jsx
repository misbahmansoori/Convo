import React from "react";
import { Button, TextField } from "@mui/material";
import styles from "../styles/videoComponent.module.css";

export default function Lobby({
  username,
  setUsername,
  connect,
  localVideoref,
}) {
  const handleConnect = () => {
    if (!username.trim()) return;
    connect();
  };

  return (
    <div className={styles.lobbyContainer}>
      <div className={styles.lobbyCard}>
        <h1>Convo</h1>
        <h2>Ready to join?</h2>
        <p>Enter your name and check your camera before connecting.</p>

        <TextField
          fullWidth
          label="Display name"
          variant="outlined"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleConnect()}
          sx={{
            mt: 2,
            "& .MuiOutlinedInput-root": {
              color: "white",
              borderRadius: "12px",
            },
            "& .MuiInputLabel-root": { color: "#94a3b8" },
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: "rgba(255,255,255,0.15)",
            },
          }}
        />

        <div className={styles.lobbyPreviewWrap}>
          <video
            ref={localVideoref}
            className={styles.lobbyPreview}
            autoPlay
            muted
            playsInline
          />
          <span className={styles.lobbyPreviewLabel}>Camera preview</span>
        </div>

        <Button
          className={styles.connectBtn}
          variant="contained"
          onClick={handleConnect}
          disabled={!username.trim()}
        >
          Join meeting
        </Button>
      </div>
    </div>
  );
}
