import { baseApiRoute } from "@/constants";
import axios from "axios";

const api = axios.create({
  baseURL: baseApiRoute,
});

export { api };
