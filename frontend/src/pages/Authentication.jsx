import "../App.css";
import * as React from "react";
import {
  Avatar,
  Button,
  CssBaseline,
  TextField,
  Paper,
  Box,
  Typography,
  Snackbar,
  Alert,
  IconButton,
  InputAdornment,
  Divider,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { AuthContext } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#8b5cf6",
    },
    background: {
      default: "#020617",
      paper: "#111827",
    },
  },
  typography: {
    fontFamily: "'Poppins', sans-serif",
  },
});

export default function Authentication() {
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [name, setName] = React.useState("");
  const [error, setError] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [formState, setFormState] = React.useState(0);
  const [open, setOpen] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  const { handleRegister, handleLogin } = React.useContext(AuthContext);
  const navigate = useNavigate();

  // Redirect already-authenticated users away from auth page.
  React.useEffect(() => {
    if (localStorage.getItem("token")) {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  const handleAuth = async () => {
    try {
      setError("");

      if (formState === 0) {
        const result = await handleLogin(username, password);

        setMessage(result);
        setOpen(true);
      } else {
        const result = await handleRegister(name, username, password);

        setMessage(result);
        setOpen(true);
      }
    } catch (err) {
      const message = err.response?.data?.message || "Something went wrong";

      setError(message);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <Box className="auth-container">
        <Paper
          elevation={0}
          className="auth-paper"
          sx={{
            background: "rgba(17,24,39,0.95)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <Box className="auth-left">
            <Typography variant="h3" fontWeight={700}>
              Welcome Back
            </Typography>

            <Typography
              sx={{
                mt: 2,
                opacity: 0.9,
                lineHeight: 1.8,
              }}
            >
              Access your account and continue your journey with our secure
              authentication system.
            </Typography>

            <img
              src="https://cdn.dribbble.com/users/1162077/screenshots/3848914/programmer.gif"
              alt="Programming"
              className="auth-image"
            />
          </Box>

          <Box className="auth-right">
            <Box className="auth-header">
              <Avatar
                sx={{
                  width: 60,
                  height: 60,
                  background: "linear-gradient(135deg,#8b5cf6,#6366f1)",
                  mb: 2,
                }}
              >
                <LockOutlinedIcon />
              </Avatar>

              <Typography variant="h4" className="auth-title">
                {formState === 0 ? "Sign In" : "Create Account"}
              </Typography>

              <Typography className="auth-subtitle">
                {formState === 0
                  ? "Login to continue"
                  : "Create your new account"}
              </Typography>
            </Box>

            {formState === 1 && (
              <TextField
                fullWidth
                label="Full Name"
                margin="normal"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="auth-field"
              />
            )}

            <TextField
              fullWidth
              label="Username"
              margin="normal"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="auth-field"
            />

            <TextField
              fullWidth
              type={showPassword ? "text" : "password"}
              label="Password"
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-field"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}

            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleAuth}
              sx={{
                mt: 3,
                py: 1.5,
                borderRadius: "14px",
                background: "linear-gradient(135deg,#8b5cf6,#6366f1)",
                textTransform: "none",
                fontWeight: 600,
                fontSize: "1rem",
              }}
            >
              {formState === 0 ? "Sign In" : "Create Account"}
            </Button>

            <Divider sx={{ my: 4 }}>OR</Divider>

            <Typography align="center" color="text.secondary">
              {formState === 0
                ? "Don't have an account?"
                : "Already have an account?"}
            </Typography>

            <Button
              className="auth-switch"
              onClick={() => setFormState(formState === 0 ? 1 : 0)}
            >
              {formState === 0 ? "Create Account" : "Sign In"}
            </Button>
          </Box>
        </Paper>

        <Snackbar
          open={open}
          autoHideDuration={3000}
          onClose={() => setOpen(false)}
        >
          <Alert severity="success" variant="filled">
            {message}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
}
