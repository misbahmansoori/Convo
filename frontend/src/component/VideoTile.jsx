import React, { useEffect, useRef } from "react";
import MicOffIcon from "@mui/icons-material/MicOff";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import styles from "../styles/videoComponent.module.css";

export default function VideoTile({
  socketId,
  stream,
  videoRef,
  username,
  isLocal = false,
  audioEnabled = true,
  videoEnabled = true,
  onLocalVideoReady,
}) {
  const internalRef = useRef(null);

  useEffect(() => {
    if (isLocal) {
      onLocalVideoReady?.();
      return;
    }

    if (!stream) return;

    const el = internalRef.current;
    if (el) {
      el.srcObject = stream;
      el.play().catch((e) => {
        if (e.name !== "AbortError") console.log(e);
      });
    }
  }, [stream, isLocal, onLocalVideoReady]);

  const displayName = username || `Guest ${socketId?.slice(0, 6) || ""}`;

  const remoteHasVideo =
    stream?.getVideoTracks().some((t) => t.enabled && t.readyState === "live") ?? false;

  const showAvatar = isLocal ? !videoEnabled : !remoteHasVideo;

  return (
    <div
      className={`${styles.videoCard} ${isLocal ? styles.videoCardLocal : ""}`}
      data-socket={socketId}
    >
      {isLocal ? (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`${styles.tileVideo} ${showAvatar ? styles.tileVideoHidden : ""}`}
          />
          {showAvatar && (
            <div className={styles.avatarOverlay}>
              <span>{displayName.charAt(0).toUpperCase()}</span>
            </div>
          )}
        </>
      ) : remoteHasVideo ? (
        <video
          ref={internalRef}
          autoPlay
          playsInline
          className={styles.tileVideo}
        />
      ) : (
        <div className={styles.avatarPlaceholder}>
          <span>{displayName.charAt(0).toUpperCase()}</span>
        </div>
      )}

      <div className={styles.tileOverlay}>
        <span className={styles.tileUsername}>
          {displayName}
          {isLocal && " (You)"}
        </span>
        <div className={styles.tileStatus}>
          {!audioEnabled && (
            <span className={styles.statusBadge} title="Mic off">
              <MicOffIcon fontSize="small" />
            </span>
          )}
          {!videoEnabled && (
            <span className={styles.statusBadge} title="Camera off">
              <VideocamOffIcon fontSize="small" />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
