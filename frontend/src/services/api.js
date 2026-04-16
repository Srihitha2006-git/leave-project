import axios from "axios";

const api = axios.create({
  baseURL: "https://leave-project.onrender.com/api"
});

export default api;