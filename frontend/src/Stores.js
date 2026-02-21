import { useEffect, useState } from "react";
import axios from "axios";

function Stores() {
  const [stores, setStores] = useState([]);
  const [search, setSearch] = useState("");
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      const res = await axios.get("http://localhost:5000/stores", {
        headers: { Authorization: token },
      });

      setStores(res.data.stores || res.data);
    } catch (err) {
      alert("Error fetching stores");
    }
  };

  const rateStore = async (storeId, rating) => {
    try {
      await axios.post(
        "http://localhost:5000/rate",
        { store_id: storeId, rating },
        { headers: { Authorization: token } }
      );

      alert("Rated Successfully");
      fetchStores(); // refresh after rating
    } catch (err) {
      alert("Rating failed");
    }
  };

  // 🔍 Simple Search (Frontend)
  const filteredStores = stores.filter(
    (store) =>
      store.name.toLowerCase().includes(search.toLowerCase()) ||
      store.address.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: "20px" }}>
      <h2>Stores</h2>

      {/* 🔍 Search Box */}
      <input
        type="text"
        placeholder="Search by store name or address..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: "15px", padding: "5px", width: "300px" }}
      />

      <table border="1" style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Store Name</th>
            <th>Address</th>
            <th>Overall Rating</th>
            <th>My Rating</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {filteredStores.length === 0 ? (
            <tr>
              <td colSpan="5" style={{ textAlign: "center" }}>
                No stores available
              </td>
            </tr>
          ) : (
            filteredStores.map((store) => (
              <tr key={store.id}>
                <td>{store.name}</td>
                <td>{store.address}</td>
                <td>{store.overall_rating || "No Ratings"}</td>
                <td>{store.my_rating || "Not Rated"}</td>
                <td>
                  <select
                    value={store.my_rating || ""}
                    onChange={(e) =>
                      rateStore(store.id, Number(e.target.value))
                    }
                  >
                    <option value="" disabled>
                      Rate
                    </option>
                    <option value="1">1 ⭐</option>
                    <option value="2">2 ⭐⭐</option>
                    <option value="3">3 ⭐⭐⭐</option>
                    <option value="4">4 ⭐⭐⭐⭐</option>
                    <option value="5">5 ⭐⭐⭐⭐⭐</option>
                  </select>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Stores;