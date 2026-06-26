import axios, { HttpStatusCode } from "axios";
import { createContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import server from "../environment";

// Global Authentication Context
// Stores user information and auth-related functions.
export const AuthContext = createContext({});

// Axios instance for user authentication APIs.
const client = axios.create({
  baseURL: `${server}/api/v1/users`,
});

// Context Provider
// Makes authentication state available throughout the app.
export const AuthProvider = ({ children }) => {
  // Stores currently logged-in user data.
  const [userData, setUserData] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      setUserData(JSON.parse(storedUser));
    }
  }, []);

  // Register new user.
  const handleRegister = async (name, username, password) => {
    try {
      const request = await client.post("/register", {
        name,
        username,
        password,
      });

      if (request.status === HttpStatusCode.Created) {
        // Automatically login after registration
        const loginRequest = await client.post("/login", {
          username,
          password,
        });

        if (loginRequest.status === HttpStatusCode.Ok) {
          localStorage.setItem("token", loginRequest.data.token);
          localStorage.setItem("user", JSON.stringify(loginRequest.data.user));

          setUserData(loginRequest.data.user);

          navigate("/", { replace: true });

          return "Account created successfully!";
        }
      }
    } catch (err) {
      throw err;
    }
  };

  // Login existing user.
  const handleLogin = async (username, password) => {
    try {
      const request = await client.post("/login", {
        username,
        password,
      });

      if (request.status === HttpStatusCode.Ok) {
        // Store JWT token in browser
        // so user remains authenticated after refresh.
        localStorage.setItem("token", request.data.token);
        localStorage.setItem("user", JSON.stringify(request.data.user));
        setUserData(request.data.user);

        navigate("/home");

        return request.data.message || "Login Successful!";
      }
    } catch (err) {
      throw err;
    }
  };

  // Save meeting code to user activity history.
  const addToUserHistory = async (meetingCode) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      await client.post(
        "/add_to_activity",
        { meetingCode, token },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
    } catch (err) {
      console.error("Failed to save meeting history:", err);
    }
  };

  // Fetch all past meetings for the logged-in user.
  const getHistoryOfUser = async () => {
    const token = localStorage.getItem("token");
    if (!token) return [];

    try {
      const request = await client.get("/get_all_activity", {
        headers: { Authorization: `Bearer ${token}` },
        params: { token },
      });

      if (request.status === HttpStatusCode.Ok) {
        return request.data.activities || [];
      }
    } catch (err) {
      console.error("Failed to fetch meeting history:", err);
      throw err;
    }

    return [];
  };

  // Share authentication state and functions
  // with all child components.
  const data = {
    userData,
    setUserData,
    handleRegister,
    handleLogin,
    addToUserHistory,
    getHistoryOfUser,
  };

  // Provide auth data globally to the app.
  return <AuthContext.Provider value={data}>{children}</AuthContext.Provider>;
};
