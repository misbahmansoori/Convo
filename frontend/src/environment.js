const server =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD
    ? "https://apnacollegebackend.onrender.com"
    : "http://localhost:8000");

export default server;
