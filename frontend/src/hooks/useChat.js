import { useState } from "react";

export default function useChat(socketRef, socketIdRef, username) {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [newMessages, setNewMessages] = useState(0);

  const addMessage = (data, sender, socketIdSender) => {
    setMessages((prevMessages) => [
      ...prevMessages,
      { sender, data },
    ]);

    if (socketIdSender !== socketIdRef.current) {
      setNewMessages((prev) => prev + 1);
    }
  };

  const sendMessage = () => {
    if (!message.trim()) return;

    socketRef.current.emit("chat-message", message, username);
    setMessage("");
  };

  const clearNotifications = () => {
    setNewMessages(0);
  };

  return {
    messages,
    message,
    setMessage,
    newMessages,
    addMessage,
    sendMessage,
    clearNotifications,
  };
}