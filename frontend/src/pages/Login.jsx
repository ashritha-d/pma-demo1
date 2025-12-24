import React, { useState } from "react";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault(); // prevent page reload

    try {
      const response = await fetch("http://127.0.0.1:5000/login", {
        method: "POST",
        credentials: "include", // important for session cookies
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

 if (data.success) {
        setMessage(`✅ Logged in as ${data.user}`);
        window.location.href = "/index"; // redirect to your Home component
      } else {
        setMessage("❌ " + data.message);
      }
    } catch (err) {
      console.error("Login error:", err);
      setMessage("❌ Server Error: " + err.message);
    }
  };
    return (
    <div className="container">
      <div className="form-box">
        <h2>Login</h2>

        {message && <div className="flash-message">{message}</div>}

        <form onSubmit={handleLogin}>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
          />
          <button type="submit">Login</button>
        </form>

        <div className="link">
          Don’t have an account? <a href="/register">Sign in</a>
        </div>
      </div>
    </div>
  );
};

export default Login;
