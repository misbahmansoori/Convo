import React, { useMemo } from "react";
import VideoTile from "./VideoTile";
import styles from "../styles/videoComponent.module.css";

export default function VideoGrid({
  videos,
  localSocketId,
  localVideoRef,
  localUsername,
  participants,
  audioEnabled,
  videoEnabled,
  onLocalVideoReady,
}) {
  const remoteVideos = localSocketId
    ? videos.filter((v) => v.socketId !== localSocketId)
    : videos;

  const totalCount = 1 + remoteVideos.length;

  const gridClass =
    totalCount === 1
      ? styles.gridCount1
      : totalCount === 2
        ? styles.gridCount2
        : totalCount <= 4
          ? styles.gridCount4
          : styles.gridCountMany;

  const sortedRemote = useMemo(
    () => [...remoteVideos].sort((a, b) => a.socketId.localeCompare(b.socketId)),
    [remoteVideos],
  );

  return (
    <div className={`${styles.conferenceView} ${gridClass}`}>
      {localSocketId && (
        <VideoTile
          socketId={localSocketId}
          videoRef={localVideoRef}
          username={localUsername}
          isLocal
          audioEnabled={audioEnabled}
          videoEnabled={videoEnabled}
          onLocalVideoReady={onLocalVideoReady}
        />
      )}

      {sortedRemote.map((video) => (
        <VideoTile
          key={video.socketId}
          socketId={video.socketId}
          stream={video.stream}
          username={participants[video.socketId]}
          audioEnabled={video.stream?.getAudioTracks().some((t) => t.enabled)}
          videoEnabled={video.stream?.getVideoTracks().some((t) => t.enabled)}
        />
      ))}
    </div>
  );
}
