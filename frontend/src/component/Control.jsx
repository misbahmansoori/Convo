import React from "react";
import { Badge, IconButton } from "@mui/material";

import VideocamIcon from "@mui/icons-material/Videocam";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import CallEndIcon from "@mui/icons-material/CallEnd";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import ScreenShareIcon from "@mui/icons-material/ScreenShare";
import StopScreenShareIcon from "@mui/icons-material/StopScreenShare";
import ChatIcon from "@mui/icons-material/Chat";

import styles from "../styles/videoComponent.module.css";

export default function Controls({
  video,
  audio,
  screen,
  screenAvailable,
  newMessages,
  showModal,
  setModal,
  handleVideo,
  handleAudio,
  handleScreen,
  handleEndCall,
  clearNotifications,
}) {
  return (
    <div className={styles.buttonContainers}>
      <IconButton onClick={handleAudio} aria-label="Toggle microphone">
        {audio ? <MicIcon /> : <MicOffIcon />}
      </IconButton>

      <IconButton onClick={handleVideo} aria-label="Toggle camera">
        {video ? <VideocamIcon /> : <VideocamOffIcon />}
      </IconButton>

      {screenAvailable && (
        <IconButton onClick={handleScreen} aria-label="Toggle screen share">
          {screen ? <StopScreenShareIcon /> : <ScreenShareIcon />}
        </IconButton>
      )}

      <IconButton
        onClick={() => {
          setModal(!showModal);
          if (!showModal) clearNotifications?.();
        }}
        aria-label="Toggle chat"
      >
        <Badge
          badgeContent={newMessages}
          max={99}
          color="warning"
          invisible={!newMessages}
        >
          <ChatIcon />
        </Badge>
      </IconButton>

      <IconButton
        className={styles.endCall}
        onClick={handleEndCall}
        aria-label="End call"
      >
        <CallEndIcon />
      </IconButton>
    </div>
  );
}
