import React from "react";
import { Button, IconButton, TextField } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import styles from "../styles/videoComponent.module.css";

export default function ChatRoom({
  showModal,
  messages,
  message,
  setMessage,
  sendMessage,
  onClose,
}) {
  if (!showModal) return null;

  const handleSend = () => {
    sendMessage();
  };

  return (
    <div className={styles.chatRoom}>
      <div className={styles.chatContainer}>
        <div className={styles.chatHeader}>
          <h2>In-call chat</h2>
          <IconButton onClick={onClose} size="small" sx={{ color: "white" }}>
            <CloseIcon />
          </IconButton>
        </div>

        <div className={styles.chattingDisplay}>
          {messages.length > 0 ? (
            messages.map((item, index) => (
              <div key={index} className={styles.messageBubble}>
                <strong>{item.sender}</strong>
                <p>{item.data}</p>
              </div>
            ))
          ) : (
            <p className={styles.chatEmpty}>No messages yet. Say hello!</p>
          )}
        </div>

        <div className={styles.chattingArea}>
          <TextField
            fullWidth
            size="small"
            placeholder="Type a message..."
            variant="outlined"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            sx={{
              "& .MuiOutlinedInput-root": {
                color: "white",
                borderRadius: "12px",
              },
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "rgba(255,255,255,0.12)",
              },
            }}
          />
          <Button variant="contained" onClick={handleSend}>
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
