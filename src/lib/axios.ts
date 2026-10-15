import { baseApiRoute } from "@/constants";
import axios from "axios";

const api = axios.create({
  baseURL: baseApiRoute,
  withCredentials: true,
});

export { api };
