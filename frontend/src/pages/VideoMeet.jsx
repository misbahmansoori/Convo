// ======================================================
// VIDEO MEETING COMPONENT
//
// Responsibilities:
// 1. Request camera/microphone permissions
// 2. Show local video preview
// 3. Connect to Socket.io server
// 4. Create and manage WebRTC peer connections
// 5. Handle chat messages
// 6. Handle screen sharing
// 7. Send and receive audio/video streams
// ======================================================

import React, { useEffect, useRef, useState, useContext } from "react";
import io from "socket.io-client";
import { Badge, IconButton, TextField } from "@mui/material";
import { Button } from "@mui/material";
import VideocamIcon from "@mui/icons-material/Videocam";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import styles from "../styles/videoComponent.module.css";
import CallEndIcon from "@mui/icons-material/CallEnd";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import ScreenShareIcon from "@mui/icons-material/ScreenShare";
import StopScreenShareIcon from "@mui/icons-material/StopScreenShare";
import ChatIcon from "@mui/icons-material/Chat";
import server from "../environment";
import { AuthContext } from "../contexts/AuthContext";

const server_url = server;

// Stores RTCPeerConnection objects.
//
// Example:
// connections = {
//    "socket123": RTCPeerConnection,
//    "socket456": RTCPeerConnection
// }
//
// NOTE:
// Backend connections object stores room members.
// Frontend connections object stores Peer Connections.
var connections = {};

// STUN server configuration.
//
// Why needed?
// Most users are behind NAT routers.
// STUN helps discover the user's public IP address
// so peers can find each other.
//
// Without STUN:
// WebRTC connections may fail.
const peerConfigConnections = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export default function VideoMeetComponent() {
  // Stores Socket.io connection object.
  //
  // useRef is used because changing socket object
  // should NOT trigger component re-render.
  var socketRef = useRef(); //Stores socket connections
  let socketIdRef = useRef(); //Stores socket ID

  // Reference to local video HTML element.
  //
  // Used to display our own camera stream.
  let localVideoref = useRef();

  // ======================================================
  // UI + MEDIA STATE MANAGEMENT
  // ======================================================

  // Does browser allow camera access?
  let [videoAvailable, setVideoAvailable] = useState(true);
  let [audioAvailable, setAudioAvailable] = useState(true);

  // Is camera currently enabled?
  let [video, setVideo] = useState(true);

  // Is microphone currently enabled?
  let [audio, setAudio] = useState(true);

  // Is screen sharing currently active?
  let [screen, setScreen] = useState();

  let [showModal, setModal] = useState(true);

  let [screenAvailable, setScreenAvailable] = useState();

  // Stores all chat messages for current meeting.
  let [messages, setMessages] = useState([]);

  let [message, setMessage] = useState("");

  let [newMessages, setNewMessages] = useState(3);

  let [askForUsername, setAskForUsername] = useState(true);

  // References to remote participants' video elements.
  const videoRef = useRef([]);

  // Stores all participant video streams.
  let [videos, setVideos] = useState([]);

  let [error, setError] = useState("");

  // Runs when component loads.
  useEffect(() => {
    console.log("HELLO");
    getPermissions();
  }, []);

  // Attach local media tracks to a peer connection.
  const addLocalStreamToConnection = (connection, stream) => {
    if (!connection || !stream) return;

    stream.getTracks().forEach((track) => {
      connection.addTrack(track, stream);
    });
  };

  // Update existing peer connections when local media changes.
  const updatePeerConnectionsWithStream = (stream) => {
    for (let id in connections) {
      if (id === socketIdRef.current) continue;

      const connection = connections[id];
      stream.getTracks().forEach((track) => {
        const sender = connection
          .getSenders()
          .find((existingSender) => existingSender.track?.kind === track.kind);

        if (sender) {
          sender.replaceTrack(track);
        } else {
          connection.addTrack(track, stream);
        }
      });

      // Create SDP Offer.
      //
      // Offer = "I want to start/update
      // a WebRTC connection."
      connection.createOffer().then((description) => {
        console.log(description);
        connection
          .setLocalDescription(description)
          .then(() => {
            socketRef.current.emit(
              "signal",
              id,
              JSON.stringify({ sdp: connection.localDescription }),
            );
          })
          .catch((e) => console.log(e));
      });
    }
  };

  // Requests screen sharing permission.
  //
  // Browser shows:
  // "Choose what to share"
  //
  // Returns screen stream if accepted.
  let getDislayMedia = () => {
    if (screen) {
      if (navigator.mediaDevices.getDisplayMedia) {
        navigator.mediaDevices
          .getDisplayMedia({ video: true, audio: true })
          .then(getDislayMediaSuccess)
          .then((stream) => {})
          .catch((e) => console.log(e));
      }
    }
  };

  const { userData } = useContext(AuthContext);
  const [username, setUsername] = useState(userData?.username || "");

  useEffect(() => {
    if (userData) {
      setUsername(userData.name); // or userData.username
    }
  }, [userData]);

  // Requests camera, microphone and screen-sharing permissions.
  //
  // Also creates initial local MediaStream
  // and displays local video preview.
  const getPermissions = async () => {
    try {
      const userMediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      setVideoAvailable(true);
      setAudioAvailable(true);
      console.log("Video permission granted");
      console.log("Audio permission granted");

      if (navigator.mediaDevices.getDisplayMedia) {
        setScreenAvailable(true);
      } else {
        setScreenAvailable(false);
      }

      // Store local stream globally so it can be
      // accessed by WebRTC peer connections later.
      window.localStream = userMediaStream;
      if (localVideoref.current) {
        // Attach stream to video element.
        //
        // Without this line:
        // Stream exists but local preview is invisible.
        localVideoref.current.srcObject = userMediaStream;
      }
    } catch (error) {
      console.log(error);

      try {
        const videoOnlyStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });

        setVideoAvailable(true);
        setAudioAvailable(false);
        window.localStream = videoOnlyStream;
        if (localVideoref.current) {
          localVideoref.current.srcObject = videoOnlyStream;
        }
      } catch (videoError) {
        setVideoAvailable(false);

        try {
          const audioOnlyStream = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: true,
          });

          setAudioAvailable(true);
          window.localStream = audioOnlyStream;
        } catch (audioError) {
          setAudioAvailable(false);
        }
      }
    }
  };

  // Whenever camera or microphone state changes,
  // request updated media stream.
  useEffect(() => {
    if (videoAvailable === undefined || audioAvailable === undefined) return;
    if (window.localStream) return;

    getUserMedia();
    console.log("SET STATE HAS ", video, audio);
  }, [video, audio, videoAvailable, audioAvailable]);

  // Called when user joins meeting.
  //
  // Steps:
  // 1. Enable selected camera/mic settings
  // 2. Connect to Socket.io server
  // 3. Start WebRTC flow
  let getMedia = () => {
    setVideo(videoAvailable);
    setAudio(audioAvailable);
    connectToSocketServer();
  };

  // Executed after browser successfully returns a MediaStream.
  //
  // Responsibilities:
  // 1. Replace old stream
  // 2. Show local preview
  // 3. Attach stream to peer connections
  // 4. Create SDP Offers
  // 5. Trigger WebRTC renegotiation
  let getUserMediaSuccess = (stream) => {
    try {
      // Stop previous media tracks before replacing stream.
      //
      // Prevents duplicate camera/microphone usage.
      window.localStream.getTracks().forEach((track) => track.stop());
    } catch (e) {
      console.log(e);
    }

    window.localStream = stream;
    localVideoref.current.srcObject = stream;
    // Update all active peer connections
    // with the new media stream.
    updatePeerConnectionsWithStream(stream);

    stream.getTracks().forEach(
      (track) =>
        // Runs when media track stops.
        //
        // Examples:
        // - User stops screen sharing
        // - Camera disconnected
        // - Media track ends
        (track.onended = () => {
          setVideo(false);
          setAudio(false);

          try {
            let tracks = localVideoref.current.srcObject.getTracks();
            tracks.forEach((track) => track.stop());
          } catch (e) {
            console.log(e);
          }

          // Create dummy black video + silent audio.
          //
          // Keeps WebRTC connection alive
          // when real media stream disappears.
          let blackSilence = (...args) =>
            new MediaStream([black(...args), silence()]);
          window.localStream = blackSilence();
          localVideoref.current.srcObject = window.localStream;

          updatePeerConnectionsWithStream(window.localStream);
        }),
    );
  };

  // ======================================================
  // Requests camera/microphone stream based on current
  // user settings (video ON/OFF, audio ON/OFF).
  //
  // Flow:
  // User enables camera/mic
  //        ↓
  // Browser returns MediaStream
  //        ↓
  // getUserMediaSuccess()
  // ======================================================
  let getUserMedia = () => {
    // Only request media if at least one device
    // (camera or microphone) should be active.
    if ((video && videoAvailable) || (audio && audioAvailable)) {
      navigator.mediaDevices
        .getUserMedia({ video: video, audio: audio })
        // MediaStream successfully received
        .then(getUserMediaSuccess)
        .then((stream) => {})
        .catch((e) => console.log(e));
    } else {
      // If both camera and microphone are disabled,
      // stop all currently active media tracks.
      try {
        let tracks = localVideoref.current.srcObject.getTracks();
        tracks.forEach((track) => track.stop());
      } catch (e) {}
    }
  };

  // ======================================================
  // Executed after user successfully selects a screen
  // for screen sharing.
  //
  // Responsibilities:
  // 1. Replace camera stream with screen stream
  // 2. Show shared screen locally
  // 3. Update all peer connections
  // 4. Create new SDP Offer
  // 5. Renegotiate WebRTC connection
  // ======================================================
  let getDislayMediaSuccess = (stream) => {
    console.log("HERE");
    // Stop previous media stream before replacing it.
    // Example:
    // Camera Stream → Screen Share Stream
    try {
      window.localStream.getTracks().forEach((track) => track.stop());
    } catch (e) {
      console.log(e);
    }

    // Store screen share stream globally.
    window.localStream = stream;

    // Show screen share preview locally.
    localVideoref.current.srcObject = stream;

    // Update every active peer connection.
    updatePeerConnectionsWithStream(stream);

    // Triggered when screen sharing stops.
    //
    // Example:
    // User clicks "Stop Sharing"
    stream.getTracks().forEach(
      (track) =>
        (track.onended = () => {
          // Update UI state.
          setScreen(false);

          // Stop screen sharing tracks.
          try {
            let tracks = localVideoref.current.srcObject.getTracks();
            tracks.forEach((track) => track.stop());
          } catch (e) {
            console.log(e);
          }

          // Create dummy black video + silent audio.
          //
          // Why?
          // Prevents WebRTC connection from suddenly
          // losing all media tracks.
          let blackSilence = (...args) =>
            new MediaStream([black(...args), silence()]);
          window.localStream = blackSilence();
          localVideoref.current.srcObject = window.localStream;

          // Restore camera/microphone stream after
          // screen sharing ends.
          getUserMedia();
        }),
    );
  };

  // ======================================================
  // Handles signaling messages received from Socket.io.
  //
  // Possible messages:
  // 1. SDP Offer
  // 2. SDP Answer
  // 3. ICE Candidate
  //
  // Socket.io acts only as a signaling server.
  // Actual audio/video never passes through it.
  // ======================================================
  let gotMessageFromServer = (fromId, message) => {
    // Convert received JSON string into JavaScript object.
    var signal = JSON.parse(message);

    // Ignore messages sent by ourselves.
    //
    // We only process signaling data
    // coming from other participants.
    if (fromId !== socketIdRef.current) {
      if (signal.sdp) {
        // Save the remote peer's SDP.
        //
        // Local Description  = My SDP
        // Remote Description = Other User's SDP
        connections[fromId]
          .setRemoteDescription(new RTCSessionDescription(signal.sdp))
          .then(() => {
            // Offer received.
            //
            // This means another participant wants
            // to establish or renegotiate a connection.
            if (signal.sdp.type === "offer") {
              connections[fromId]
                // Create SDP Answer in response
                // to the received Offer.
                .createAnswer()
                .then((description) => {
                  connections[fromId]
                    // Store generated Answer as
                    // local description.
                    .setLocalDescription(description)
                    .then(() => {
                      // Send Answer back through
                      // Socket.io signaling server.
                      socketRef.current.emit(
                        "signal",
                        fromId,
                        JSON.stringify({
                          sdp: connections[fromId].localDescription,
                        }),
                      );
                    })
                    .catch((e) => console.log(e));
                })
                .catch((e) => console.log(e));
            }
          })
          .catch((e) => console.log(e));
      }

      // ICE Candidate received.
      //
      // ICE Candidates help peers discover
      // possible network routes between them.
      //
      // Without ICE:
      // Offer/Answer exchange may succeed,
      // but actual connection may fail.
      if (signal.ice) {
        connections[fromId]
          // Add remote ICE Candidate to the
          // current RTCPeerConnection.
          //
          // Helps establish direct peer-to-peer path.
          .addIceCandidate(new RTCIceCandidate(signal.ice))
          .catch((e) => console.log(e));
      }
    }
  };

  // ======================================================
  // Connects frontend to Socket.io server.
  //
  // Responsibilities:
  // 1. Connect to signaling server
  // 2. Join meeting room
  // 3. Create WebRTC peer connections
  // 4. Exchange SDP Offers/Answers
  // 5. Exchange ICE Candidates
  // 6. Receive remote video streams
  // ======================================================
  let connectToSocketServer = () => {
    // Create Socket.io connection with backend signaling server.
    socketRef.current = io.connect(server_url, { secure: false });

    // Listen for WebRTC signaling messages
    // (Offer, Answer, ICE Candidate).
    socketRef.current.on("signal", gotMessageFromServer);

    socketRef.current.on("connect", () => {
      // Join meeting room using current URL path.
      // Users with same meeting code join same room.
      const roomId = window.location.pathname.slice(1);
      socketRef.current.emit("join-call", roomId);
      socketIdRef.current = socketRef.current.id; // Save current user's socket ID.

      // Listen for incoming chat messages.
      socketRef.current.on("chat-message", addMessage);

      socketRef.current.on("user-left", (id) => {
        setVideos((videos) => videos.filter((video) => video.socketId !== id));
      });

      socketRef.current.on("user-joined", (id, clients) => {
        clients.forEach((socketListId) => {
          // Create WebRTC connection
          // for each participant in room.
          connections[socketListId] = new RTCPeerConnection(
            peerConfigConnections,
          );

          // Send ICE candidates through
          // Socket.io signaling server.
          connections[socketListId].onicecandidate = function (event) {
            if (event.candidate != null) {
              socketRef.current.emit(
                "signal",
                socketListId,
                JSON.stringify({ ice: event.candidate }),
              );
            }
          };

          // Triggered when remote participant's
          // media stream is received.
          connections[socketListId].ontrack = (event) => {
            const remoteStream = event.streams[0];
            if (!remoteStream) return;

            console.log("BEFORE:", videoRef.current);
            console.log("FINDING ID: ", socketListId);
            // Avoid duplicate video elements.
            // Update existing stream if user already exists.
            let videoExists = videoRef.current.find(
              (video) => video.socketId === socketListId,
            );

            if (videoExists) {
              console.log("FOUND EXISTING");

              setVideos((videos) => {
                const updatedVideos = videos.map((video) =>
                  video.socketId === socketListId
                    ? { ...video, stream: remoteStream }
                    : video,
                );
                videoRef.current = updatedVideos;
                return updatedVideos;
              });
            } else {
              // Store new participant's video
              // information for rendering.
              console.log("CREATING NEW");
              let newVideo = {
                socketId: socketListId,
                stream: remoteStream,
                autoplay: true,
                playsinline: true,
              };

              setVideos((videos) => {
                const updatedVideos = [...videos, newVideo];
                videoRef.current = updatedVideos;
                return updatedVideos;
              });
            }
          };

          // Add the local video stream
          if (window.localStream !== undefined && window.localStream !== null) {
            addLocalStreamToConnection(
              connections[socketListId],
              window.localStream,
            );
          } else {
            let blackSilence = (...args) =>
              new MediaStream([black(...args), silence()]);
            window.localStream = blackSilence();
            addLocalStreamToConnection(
              connections[socketListId],
              window.localStream,
            );
          }
        });

        if (id === socketIdRef.current) {
          for (let id2 in connections) {
            if (id2 === socketIdRef.current) continue;

            try {
              addLocalStreamToConnection(connections[id2], window.localStream);
            } catch (e) {}

            connections[id2].createOffer().then((description) => {
              connections[id2]
                .setLocalDescription(description)
                .then(() => {
                  socketRef.current.emit(
                    "signal",
                    id2,
                    JSON.stringify({ sdp: connections[id2].localDescription }),
                  );
                })
                .catch((e) => console.log(e));
            });
          }
        }
      });
    });
  };

  // Creates a disabled silent audio track.
  // Used when no real microphone stream exists.
  let silence = () => {
    let ctx = new AudioContext();
    let oscillator = ctx.createOscillator();
    let dst = oscillator.connect(ctx.createMediaStreamDestination());
    oscillator.start();
    ctx.resume();
    return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false });
  };

  // Creates a disabled silent audio track.
  // Used when no real microphone stream exists.
  let black = ({ width = 640, height = 480 } = {}) => {
    let canvas = Object.assign(document.createElement("canvas"), {
      width,
      height,
    });
    canvas.getContext("2d").fillRect(0, 0, width, height);
    let stream = canvas.captureStream();
    return Object.assign(stream.getVideoTracks()[0], { enabled: false });
  };

  let handleVideo = () => {
    const nextVideo = !video;
    setVideo(nextVideo);

    if (window.localStream) {
      window.localStream.getVideoTracks().forEach((track) => {
        track.enabled = nextVideo;
      });

      // Refresh local preview
      if (localVideoref.current) {
        localVideoref.current.srcObject = window.localStream;
      }

      // Update all peer connections
      updatePeerConnectionsWithStream(window.localStream);
    }
  };

  let handleAudio = () => {
    const nextAudio = !audio;
    setAudio(nextAudio);

    if (window.localStream) {
      window.localStream.getAudioTracks().forEach((track) => {
        track.enabled = nextAudio;
      });

      updatePeerConnectionsWithStream(window.localStream);
    }
  };

  useEffect(() => {
    if (screen !== undefined) {
      getDislayMedia();
    }
  }, [screen]);

  let handleScreen = () => {
    setScreen(!screen);
  };

  let handleEndCall = () => {
    try {
      let tracks = localVideoref.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
    } catch (e) {}
    window.location.href = "/";
  };

  let openChat = () => {
    setModal(true);
    setNewMessages(0);
  };

  let closeChat = () => {
    setModal(false);
  };

  let handleMessage = (e) => {
    setMessage(e.target.value);
  };

  // Add incoming chat message to local state.
  // Also updates unread message count.
  const addMessage = (data, sender, socketIdSender) => {
    setMessages((prevMessages) => [
      ...prevMessages,
      { sender: sender, data: data },
    ]);
    if (socketIdSender !== socketIdRef.current) {
      setNewMessages((prevNewMessages) => prevNewMessages + 1);
    }
  };

  // Send chat message to all participants
  // through Socket.io server.
  let sendMessage = () => {
    console.log(socketRef.current);
    socketRef.current.emit("chat-message", message, username);
    setMessage("");

    // this.setState({ message: "", sender: username })
  };

  // Called when user joins meeting.
  // Starts media setup and Socket.io connection.
  let connect = () => {
    if (!username.trim()) {
      setError("Username is required");
      return;
    }

    setError("");

    setAskForUsername(false);
    getMedia();
  };

  return (
    <div>
      {askForUsername ? (
        <div className={styles.lobbyContainer}>
          <div className={styles.lobbyCard}>
            <h1>Convo</h1>
            <h2>Join Meeting Room</h2>

            <p>Enter your display name before joining the meeting.</p>

            <TextField
              fullWidth
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              variant="outlined"
              error={!!error}
              helperText={error}
              sx={{
                mt: 2,

                // Input text
                "& .MuiInputBase-input": {
                  color: "#fff",
                },

                // Label
                "& .MuiInputLabel-root": {
                  color: "#fff",
                },

                // Focused label
                "& .MuiInputLabel-root.Mui-focused": {
                  color: "#afdff4",
                },

                // Border
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#fff",
                },

                // Hover border
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#90caf9",
                },

                // Focused border
                "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline":
                  {
                    borderColor: "#90caf9",
                  },

                // Error text
                "& .MuiFormHelperText-root": {
                  color: "red",
                },
              }}
            />

            <Button
              variant="contained"
              onClick={connect}
              className={styles.connectBtn}
            >
              Join Meeting
            </Button>

            <video
              className={styles.lobbyPreview}
              ref={localVideoref}
              autoPlay
              muted
              playsInline
            />
          </div>
        </div>
      ) : (
        <div className={styles.meetVideoContainer}>
          {/* Chat Panel */}
          {showModal && (
            <div className={styles.chatRoom}>
              <div className={styles.chatContainer}>
                <h2>Meeting Chat</h2>

                <div className={styles.chattingDisplay}>
                  {messages.length > 0 ? (
                    messages.map((item, index) => (
                      <div className={styles.messageBubble} key={index}>
                        <strong>{item.sender}</strong>
                        <p>{item.data}</p>
                      </div>
                    ))
                  ) : (
                    <p>No Messages Yet</p>
                  )}
                </div>

                <div className={styles.chattingArea}>
                  <TextField
                    fullWidth
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    label="Type message..."
                    variant="outlined"
                  />

                  <Button variant="contained" onClick={sendMessage}>
                    Send
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Remote Videos */}
          <div className={styles.conferenceView}>
            {videos.map((video) => (
              <div className={styles.videoCard} key={video.socketId}>
                <video
                  data-socket={video.socketId}
                  ref={(ref) => {
                    if (ref && video.stream) {
                      ref.srcObject = video.stream;
                    }
                  }}
                  autoPlay
                  playsInline
                />
              </div>
            ))}
          </div>

          {/* Local Video */}
          <video
            className={styles.meetUserVideo}
            ref={localVideoref}
            autoPlay
            muted
            playsInline
          />

          {/* Control Bar */}
          {/* =========================
    Control Bar
========================= */}
          <div className={styles.buttonContainers}>
            {/* Camera */}
            <IconButton onClick={handleVideo}>
              {video ? <VideocamIcon /> : <VideocamOffIcon />}
            </IconButton>

            {/* Microphone */}
            <IconButton onClick={handleAudio}>
              {audio ? <MicIcon /> : <MicOffIcon />}
            </IconButton>

            {/* Screen Share */}
            <IconButton onClick={handleScreen}>
              {screen ? <StopScreenShareIcon /> : <ScreenShareIcon />}
            </IconButton>

            {/* Chat */}
            <Badge badgeContent={newMessages} color="error">
              <IconButton onClick={() => setModal(!showModal)}>
                <ChatIcon />
              </IconButton>
            </Badge>

            {/* End Call */}
            <IconButton onClick={handleEndCall} className={styles.endCall}>
              <CallEndIcon />
            </IconButton>
          </div>
        </div>
      )}
    </div>
  );
}
