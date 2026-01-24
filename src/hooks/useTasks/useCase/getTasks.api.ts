import axios from "axios";

export async function getTasks(projectId?: number) {
  if (!projectId) return [];
  const res = await axios.get(`/api/task?projectId=${projectId}`);
  return res.data;
}
