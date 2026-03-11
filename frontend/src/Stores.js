import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Stores() {
  const [stores, setStores] = useState([]);
  const [search, setSearch] = useState("");
  const [newName, setNewName] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  useEffect(() => {
    if (!token) {
      navigate("/");
    } else {
      fetchStores();
    }
  }, []);

  const fetchStores = async () => {
    try {
      const res = await axios.get("http://localhost:5000/stores", {
        headers: { Authorization: token },
      });
      setStores(res.data);
    } catch (err) {
      setError("Session expired. Please login again.");
      localStorage.clear();
      navigate("/");
    }
  };

  const addStore = async () => {
    if (!newName || !newAddress) {
      alert("Enter name and address");
      return;
    }

    try {
      await axios.post(
        "http://localhost:5000/admin/add-store",
        { name: newName, address: newAddress },
        { headers: { Authorization: token } }
      );

      setNewName("");
      setNewAddress("");
      fetchStores();
    } catch (err) {
      alert("Only admin can add stores");
    }
  };

  const rateStore = async (storeId, rating) => {
    try {
      await axios.post(
        "http://localhost:5000/rate",
        { store_id: storeId, rating },
        { headers: { Authorization: token } }
      );
      fetchStores();
    } catch {
      alert("Rating failed");
    }
  };

  const logout = () => {
    localStorage.clear();
    navigate("/");
  };

  const filteredStores = stores.filter(
    (store) =>
      store.name.toLowerCase().includes(search.toLowerCase()) ||
      store.address.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: "20px" }}>
      <h2>Stores</h2>

      <button onClick={logout} style={{ float: "right" }}>
        Logout
      </button>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* ADMIN ADD STORE SECTION */}
      {role === "admin" && (
        <>
          <h3>Add New Store (Admin Only)</h3>
          <input
            placeholder="Store Name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <input
            placeholder="Address"
            value={newAddress}
            onChange={(e) => setNewAddress(e.target.value)}
          />
          <button onClick={addStore}>Add Store</button>
          <hr />
        </>
      )}

      {/* SEARCH */}
      <input
        type="text"
        placeholder="Search..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <table border="1" style={{ width: "100%", marginTop: "10px" }}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Address</th>
            <th>Overall Rating</th>
            <th>My Rating</th>
            <th>Rate</th>
          </tr>
        </thead>
        <tbody>
          {filteredStores.map((store) => (
            <tr key={store.id}>
              <td>{store.name}</td>
              <td>{store.address}</td>
              <td>{store.overall_rating || "No Ratings"}</td>
              <td>{store.my_rating || "Not Rated"}</td>
              <td>
                <select
                  value={store.my_rating ? String(store.my_rating) : ""}
                  onChange={(e) =>
                    rateStore(store.id, Number(e.target.value))
                  }
                >
                  <option value="">Rate</option>
                  <option value="1">1 ⭐</option>
                  <option value="2">2 ⭐⭐</option>
                  <option value="3">3 ⭐⭐⭐</option>
                  <option value="4">4 ⭐⭐⭐⭐</option>
                  <option value="5">5 ⭐⭐⭐⭐⭐</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Stores;