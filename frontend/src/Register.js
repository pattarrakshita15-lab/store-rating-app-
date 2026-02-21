import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [address, setAddress] = useState(""); // added address
  const navigate = useNavigate();

  const handleRegister = async () => {
    if (!name || !email || !password || !address) {
      return alert("All fields are required");
    }

    try {
      const res = await axios.post("http://localhost:5000/register", {
        name,
        email,
        password,
        address,
      });

      alert(res.data.message); // show backend message
      navigate("/"); // redirect to login
    } catch (err) {
      alert(err.response?.data?.message || "Registration Failed");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Register</h2>
      <input placeholder="Name" onChange={(e) => setName(e.target.value)} />
      <br />
      <input placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
      <br />
      <input
        type="password"
        placeholder="Password"
        onChange={(e) => setPassword(e.target.value)}
      />
      <br />
      <input
        placeholder="Address"
        onChange={(e) => setAddress(e.target.value)}
      />
      <br />
      <button onClick={handleRegister}>Register</button>
      <p>
        Already have an account? <Link to="/">Login</Link>
      </p>
    </div>
  );
}

export default Register;