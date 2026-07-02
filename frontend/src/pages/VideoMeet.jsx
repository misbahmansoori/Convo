import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import io from "socket.io-client";
import styles from "../styles/videoComponent.module.css";
import server from "../environment";
import { peerConfigConnections } from "../utils/peerConfig";
import Controls from "../component/Control";
import ChatRoom from "../component/chatRoom";
import VideoGrid from "../component/VideoGrid";
import Lobby from "../component/Lobby";
import { sendOffer } from "../utils/socketUtils";
import useChat from "../hooks/useChat";
import { AuthContext } from "../contexts/AuthContext";

const server_url = server;

const audioConstraints = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
};

export default function VideoMeetComponent() {
  const { url: roomId } = useParams();
  const navigate = useNavigate();
  const { userData } = useContext(AuthContext);
  const socketRef = useRef();
  const socketIdRef = useRef();
  const localVideoref = useRef();
  const videoRef = useRef([]);
  const connectionsRef = useRef({});
  const initializedRef = useRef(false);
  const isFirstMediaSetup = useRef(true);
  const permissionsRunId = useRef(0);
  const isMountedRef = useRef(true);

  const attachLocalStream = useCallback((stream) => {
    if (!localVideoref.current || !isMountedRef.current) return;

    const videoTracks =
      stream?.getVideoTracks().filter((t) => t.readyState === "live" && t.enabled) ?? [];
    if (videoTracks.length > 0) {
      localVideoref.current.srcObject = new MediaStream(videoTracks);
    } else {
      localVideoref.current.srcObject = null;
    }

    localVideoref.current.play().catch((e) => {
      if (e.name !== "AbortError") console.log(e);
    });
  }, []);

  const handleLocalVideoReady = useCallback(() => {
    if (window.localStream) {
      attachLocalStream(window.localStream);
    }
  }, [attachLocalStream]);

  const replaceTrackOnPeers = async (kind, track) => {
    for (const remoteId in connectionsRef.current) {
      if (remoteId === socketIdRef.current) continue;

      const pc = connectionsRef.current[remoteId];
      const sender = pc.getSenders().find((s) => s.track?.kind === kind);
      if (sender) {
        await sender.replaceTrack(track);
        await sendOffer(pc, socketRef.current, remoteId);
      }
    }
  };

  const applyPermissionsStream = (stream, runId) => {
    if (runId !== permissionsRunId.current || !isMountedRef.current) {
      stream.getTracks().forEach((track) => track.stop());
      return;
    }
    window.localStream = stream;
    setVideoAvailable(stream.getVideoTracks().length > 0);
    setAudioAvailable(stream.getAudioTracks().length > 0);
    attachLocalStream(stream);
  };

  const [videoAvailable, setVideoAvailable] = useState(true);
  const [audioAvailable, setAudioAvailable] = useState(true);
  const [video, setVideo] = useState();
  const [audio, setAudio] = useState();
  const [screen, setScreen] = useState();
  const [showModal, setModal] = useState(true);
  const [screenAvailable, setScreenAvailable] = useState();
  const [askForUsername, setAskForUsername] = useState(true);
  const [username, setUsername] = useState("");
  const [videos, setVideos] = useState([]);
  const [localSocketId, setLocalSocketId] = useState(null);
  const [participants, setParticipants] = useState({});

  const {
    messages,
    message,
    setMessage,
    newMessages,
    addMessage,
    sendMessage,
    clearNotifications,
  } = useChat(socketRef, socketIdRef, username);

  const removePeerConnection = (remoteId) => {
    const pc = connectionsRef.current[remoteId];
    if (pc) {
      pc.close();
      delete connectionsRef.current[remoteId];
    }
    setVideos((prev) => {
      const updated = prev.filter((v) => v.socketId !== remoteId);
      videoRef.current = updated;
      return updated;
    });
  };

  const createPeerConnection = (remoteId) => {
    if (remoteId === socketIdRef.current) return null;
    if (connectionsRef.current[remoteId]) {
      return connectionsRef.current[remoteId];
    }

    const pc = new RTCPeerConnection(peerConfigConnections);
    connectionsRef.current[remoteId] = pc;

    pc.onicecandidate = (event) => {
      if (event.candidate != null) {
        socketRef.current.emit(
          "signal",
          remoteId,
          JSON.stringify({ ice: event.candidate }),
        );
      }
    };

    pc.ontrack = (event) => {
      const remoteStream = event.streams[0];
      if (!remoteStream) return;

      setVideos((prev) => {
        const exists = prev.find((v) => v.socketId === remoteId);
        if (exists) {
          const updated = prev.map((v) =>
            v.socketId === remoteId ? { ...v, stream: remoteStream } : v,
          );
          videoRef.current = updated;
          return updated;
        }
        const updated = [
          ...prev,
          {
            socketId: remoteId,
            stream: remoteStream,
            autoplay: true,
            playsinline: true,
          },
        ];
        videoRef.current = updated;
        return updated;
      });
    };

    if (window.localStream) {
      window.localStream.getTracks().forEach((track) => {
        pc.addTrack(track, window.localStream);
      });
    }

    return pc;
  };

  const updateLocalStreamOnPeers = async (newStream) => {
    const connections = connectionsRef.current;

    for (const remoteId in connections) {
      if (remoteId === socketIdRef.current) continue;

      const pc = connections[remoteId];
      const senders = pc.getSenders();

      newStream.getTracks().forEach((track) => {
        const existingSender = senders.find(
          (s) => s.track && s.track.kind === track.kind,
        );
        if (existingSender) {
          existingSender.replaceTrack(track);
        } else {
          pc.addTrack(track, newStream);
        }
      });

      senders.forEach((sender) => {
        if (
          sender.track &&
          !newStream.getTracks().some((t) => t.kind === sender.track.kind)
        ) {
          pc.removeTrack(sender);
        }
      });

      await sendOffer(pc, socketRef.current, remoteId);
    }
  };

  const getPermissions = async () => {
    const runId = ++permissionsRunId.current;
    setScreenAvailable(!!navigator.mediaDevices.getDisplayMedia);

    const isStale = () => runId !== permissionsRunId.current || !isMountedRef.current;

    if (window.localStream?.getTracks().some((t) => t.readyState === "live")) {
      if (isStale()) return;
      setVideoAvailable(window.localStream.getVideoTracks().length > 0);
      setAudioAvailable(window.localStream.getAudioTracks().length > 0);
      attachLocalStream(window.localStream);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: audioConstraints,
      });
      if (isStale()) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      applyPermissionsStream(stream, runId);
    } catch {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        if (isStale()) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        applyPermissionsStream(stream, runId);
      } catch {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: audioConstraints,
          });
          if (isStale()) {
            stream.getTracks().forEach((track) => track.stop());
            return;
          }
          applyPermissionsStream(stream, runId);
        } catch (error) {
          if (!isStale()) {
            setVideoAvailable(false);
            setAudioAvailable(false);
            console.log(error);
          }
        }
      }
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    getPermissions();

    return () => {
      isMountedRef.current = false;
      permissionsRunId.current += 1;
      Object.values(connectionsRef.current).forEach((pc) => pc.close());
      connectionsRef.current = {};
      socketRef.current?.disconnect();
      initializedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (userData?.username) {
      setUsername((prev) => prev || userData.username);
    }
  }, [userData]);

  useEffect(() => {
    if (!askForUsername && window.localStream) {
      requestAnimationFrame(() => {
        attachLocalStream(window.localStream);
      });
    }
  }, [askForUsername, attachLocalStream]);

  useEffect(() => {
    if (video === undefined || audio === undefined) return;

    if (isFirstMediaSetup.current) {
      isFirstMediaSetup.current = false;
      attachLocalStream(window.localStream);
      window.localStream?.getVideoTracks().forEach((t) => {
        t.enabled = video;
      });
      window.localStream?.getAudioTracks().forEach((t) => {
        t.enabled = audio;
      });
    }
  }, [video, audio]);

  useEffect(() => {
    if (screen !== undefined) {
      getDislayMedia();
    }
  }, [screen]);

  const getDislayMedia = () => {
    if (screen) {
      if (navigator.mediaDevices.getDisplayMedia) {
        navigator.mediaDevices
          .getDisplayMedia({ video: true, audio: false })
          .then(getDislayMediaSuccess)
          .catch((e) => console.log(e));
      }
    }
  };

  const getMedia = () => {
    setVideo(videoAvailable);
    setAudio(audioAvailable);
    connectToSocketServer();
  };

  const getUserMediaSuccess = (stream) => {
    try {
      window.localStream?.getTracks().forEach((track) => track.stop());
    } catch (e) {
      console.log(e);
    }

    window.localStream = stream;
    stream.getVideoTracks().forEach((t) => {
      t.enabled = video !== false;
    });
    stream.getAudioTracks().forEach((t) => {
      t.enabled = audio !== false;
    });
    attachLocalStream(stream);
    updateLocalStreamOnPeers(stream);

    stream.getTracks().forEach((track) => {
      track.onended = async () => {
        setVideo(false);
        setAudio(false);
        await replaceTrackOnPeers("audio", null);
        await replaceTrackOnPeers("video", null);
        attachLocalStream(window.localStream);
      };
    });
  };

  const restoreCameraAfterScreenShare = () => {
    if (!((video && videoAvailable) || (audio && audioAvailable))) return;

    navigator.mediaDevices
      .getUserMedia({
        video: video && videoAvailable,
        audio: audio ? audioConstraints : false,
      })
      .then(getUserMediaSuccess)
      .catch((e) => console.log(e));
  };

  const getDislayMediaSuccess = (stream) => {
    try {
      window.localStream.getTracks().forEach((track) => track.stop());
    } catch (e) {
      console.log(e);
    }

    window.localStream = stream;
    attachLocalStream(stream);
    updateLocalStreamOnPeers(stream);

    stream.getTracks().forEach((track) => {
      track.onended = () => {
        setScreen(false);

        try {
          localVideoref.current?.srcObject
            ?.getTracks()
            .forEach((t) => t.stop());
        } catch (e) {
          console.log(e);
        }

        restoreCameraAfterScreenShare();
      };
    });
  };

  const gotMessageFromServer = (fromId, message) => {
    if (fromId === socketIdRef.current) return;

    const pc = connectionsRef.current[fromId];
    if (!pc) return;

    const signal = JSON.parse(message);

    if (signal.sdp) {
      pc.setRemoteDescription(new RTCSessionDescription(signal.sdp))
        .then(() => {
          if (signal.sdp.type === "offer") {
            pc.createAnswer()
              .then((description) => {
                pc.setLocalDescription(description)
                  .then(() => {
                    socketRef.current.emit(
                      "signal",
                      fromId,
                      JSON.stringify({ sdp: pc.localDescription }),
                    );
                  })
                  .catch((e) => console.log(e));
              })
              .catch((e) => console.log(e));
          }
        })
        .catch((e) => console.log(e));
    }

    if (signal.ice) {
      pc.addIceCandidate(new RTCIceCandidate(signal.ice)).catch((e) =>
        console.log(e),
      );
    }
  };

  const connectToSocketServer = () => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    socketRef.current = io(server_url, {
      transports: ["websocket", "polling"],
    });

    socketRef.current.on("signal", gotMessageFromServer);
    socketRef.current.on("chat-message", addMessage);

    socketRef.current.on("user-left", (id) => {
      removePeerConnection(id);
      setParticipants((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    });

    socketRef.current.on("user-joined", (id, joinUsername, clients, participantMap) => {
      if (participantMap) {
        setParticipants(participantMap);
      } else if (joinUsername) {
        setParticipants((prev) => ({ ...prev, [id]: joinUsername }));
      }

      if (id === socketIdRef.current) {
        clients.forEach((clientId) => {
          if (clientId === socketIdRef.current) return;
          const pc = createPeerConnection(clientId);
          if (pc) {
            sendOffer(pc, socketRef.current, clientId);
          }
        });
      } else {
        createPeerConnection(id);
      }
    });

    socketRef.current.on("connect", () => {
      socketRef.current.emit("join-call", roomId, username);
      socketIdRef.current = socketRef.current.id;
      setLocalSocketId(socketRef.current.id);
      setParticipants((prev) => ({
        ...prev,
        [socketRef.current.id]: username.trim() || `Guest ${socketRef.current.id.slice(0, 6)}`,
      }));
    });
  };

  const handleVideo = () => {
    const next = !video;
    setVideo(next);
    window.localStream?.getVideoTracks().forEach((track) => {
      track.enabled = next;
    });
    attachLocalStream(window.localStream);
  };

  const handleAudio = () => {
    const next = !audio;
    setAudio(next);
    window.localStream?.getAudioTracks().forEach((track) => {
      track.enabled = next;
    });
  };

  const handleScreen = () => {
    setScreen(!screen);
  };

  const handleEndCall = () => {
    Object.values(connectionsRef.current).forEach((pc) => pc.close());
    connectionsRef.current = {};
    if (window.localStream) {
      window.localStream.getTracks().forEach((track) => track.stop());
      window.localStream = null;
    }
    socketRef.current?.disconnect();
    initializedRef.current = false;
    navigate(localStorage.getItem("token") ? "/home" : "/");
  };

  const connect = () => {
    setAskForUsername(false);
    getMedia();
  };

  return (
    <div>
      {askForUsername ? (
        <Lobby
          username={username}
          setUsername={setUsername}
          connect={connect}
          localVideoref={localVideoref}
        />
      ) : (
        <div className={styles.meetVideoContainer}>
          <div className={styles.meetHeader}>
            <span className={styles.meetHeaderDot} />
            <span>
              {username} &middot; Room {roomId} &middot;{" "}
              {1 + videos.filter((v) => v.socketId !== localSocketId).length}{" "}
              participant
              {1 + videos.filter((v) => v.socketId !== localSocketId).length !== 1 ? "s" : ""}
            </span>
          </div>

          <div
            className={`${styles.meetMain} ${showModal ? styles.meetMainChatOpen : ""}`}
          >
            <VideoGrid
              videos={videos}
              localSocketId={localSocketId}
              localVideoRef={localVideoref}
              localUsername={username}
              participants={participants}
              audioEnabled={audio}
              videoEnabled={video}
              onLocalVideoReady={handleLocalVideoReady}
            />
          </div>

          <ChatRoom
            showModal={showModal}
            messages={messages}
            message={message}
            setMessage={setMessage}
            sendMessage={sendMessage}
            onClose={() => {
              setModal(false);
              clearNotifications();
            }}
          />

          <Controls
            video={video}
            audio={audio}
            screen={screen}
            screenAvailable={screenAvailable}
            newMessages={newMessages}
            showModal={showModal}
            setModal={setModal}
            handleVideo={handleVideo}
            handleAudio={handleAudio}
            handleScreen={handleScreen}
            handleEndCall={handleEndCall}
            clearNotifications={clearNotifications}
          />
        </div>
      )}
    </div>
  );
}
