/*
=================================================
SOCKET MANAGER FLOW

1. User joins room
   -> join-call

2. Server stores socket in room
   -> connections

3. Notify everyone
   -> user-joined

4. Exchange WebRTC signaling data
   -> signal

5. Send chat messages
   -> chat-message

6. User disconnects
   -> user-left

=================================================
*/

//By socket.io connection will stay alive
import { Server } from "socket.io";

// In-memory storage (temporary data)
// NOTE: If server restarts, all this data is lost.
// In production, Redis or a database would be a better choice.
const connections = {}; //It stores which users are in which room
const participants = {}; // room path -> { socketId: username }
const messages = {}; //Stores chat history
const timeOnline = {}; //When user connected

const connectToSocket = (server) => {
  //Creates socket.io server
  const io = new Server(server, {
    cors: {
      origin: "*",
      method: ["GET", "POST"],
      allowedHeaders: ["*"],
      credentials: true,
    },
  });

  //wheneve user open website -> socket will be created -> and this part of code will run
  io.on("connection", (socket) => {
    // Fired when a user joins a meeting room.
    // path acts as the room ID.
    // Example:
    // socket.emit("join-call", "room123")
    socket.on("join-call", (path, username) => {
      if (connections[path] === undefined) {
        connections[path] = [];
      }

      if (participants[path] === undefined) {
        participants[path] = {};
      }

      connections[path].push(socket.id);
      participants[path][socket.id] =
        username?.trim() || `Guest ${socket.id.slice(0, 6)}`;

      timeOnline[socket.id] = new Date();

      const participantMap = { ...participants[path] };

      for (let a = 0; a < connections[path].length; a++) {
        io.to(connections[path][a]).emit(
          "user-joined",
          socket.id,
          participants[path][socket.id],
          connections[path],
          participantMap,
        );
      }

      //Previous messages
      // Send old chat messages to the newly joined user
      // so they can see previous conversation history.
      if (messages[path] !== undefined) {
        for (let a = 0; a < messages[path].length; ++a) {
          io.to(socket.id).emit(
            "chat-message",
            messages[path][a]["data"],
            messages[path][a]["sender"],
            messages[path][a]["socket-id-sender"],
          );
        }
      }
    });

    // WebRTC signaling event.
    //
    // Socket.io is used only to exchange:
    // 1. SDP Offers
    // 2. SDP Answers
    // 3. ICE Candidates
    //
    // After signaling is complete,
    // audio/video flows directly between peers.
    socket.on("signal", (toId, message) => {
      io.to(toId).emit("signal", socket.id, message);
    });

    //Chat message event
    socket.on("chat-message", (data, sender) => {
      // Find which room the current socket belongs to.
      // Example:
      // room1 -> [A, B]
      // room2 -> [C, D]
      //
      // If socket.id = D
      // matchingRoom = room2
      const [matchingRoom, found] = Object.entries(connections).reduce(
        ([room, isFound], [roomKey, roomValue]) => {
          if (!isFound && roomValue.includes(socket.id)) {
            return [roomKey, true];
          }
          return [room, isFound];
        },
        ["", false],
      );

      if (found === true) {
        if (messages[matchingRoom] === undefined) {
          messages[matchingRoom] = [];
        }

        messages[matchingRoom].push({
          sender: sender,
          data: data,
          "socket-id-sender": socket.id,
        });

        console.log("message", matchingRoom, ":", sender, data);

        //Broadcasting the message to wveryone after storing this into the conections
        connections[matchingRoom].forEach((elem) => {
          io.to(elem).emit("chat-message", data, sender, socket.id);
        });
      }
    });

    //Disconnection flow
    // Triggered automatically when:
    // - User closes tab
    // - User refreshes page
    // - Internet disconnects
    // - Browser crashes
    socket.on("disconnect", () => {
      // Calculate how long the user stayed connected.
      // Currently not used anywhere.
      var diffTime = Math.abs(timeOnline[socket.id] - new Date());
      var key;

      for (const [k, v] of Object.entries(connections)) {
        for (let a = 0; a < v.length; ++a) {
          if (v[a] === socket.id) {
            key = k;

            for (let a = 0; a < connections[key].length; ++a) {
              // Notify remaining users that this participant left.
              // Frontend can remove the user's video stream.
              io.to(connections[key][a]).emit("user-left", socket.id);
            }

            var index = connections[key].indexOf(socket.id);

            connections[key].splice(index, 1);

            if (participants[key]) {
              delete participants[key][socket.id];
              if (Object.keys(participants[key]).length === 0) {
                delete participants[key];
              }
            }

            // Delete room if no participants remain.
            if (connections[key].length === 0) {
              delete connections[key];
            }
          }
        }
      }
    });
  });
};

export default connectToSocket;
