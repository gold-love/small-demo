const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

async function run() {
  try {
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'gold@gmail.com',
      password: 'password123'
    });
    const token = loginRes.data.token;
    console.log("Logged in:", loginRes.data.name);

    const pendingRes = await axios.get('http://localhost:5000/api/approvals/pending', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Pending Expenses:", pendingRes.data.length);

    const allRes = await axios.get('http://localhost:5000/api/approvals/all', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("All Expenses:", allRes.data.length);

  } catch (e) {
    console.error("Error:", e.response ? e.response.data : e.message);
  }
}
run();
