const removeThinkTags = (response) => {
  const thinkRegex = /<think>[\s\S]*?<\/think>/g;
  return response.replace(thinkRegex, "").trim();
};

const removeThinkingTags = (response) => {
  const thinkingRegex = /```thinking[\s\S]*?```/g;
  return response.replace(thinkingRegex, "").trim();
};

const createContext = (
  query,
  apikey,
  baseUrl,
  depth = 0,
  maxDepth = 1,
  onStatusUpdate = () => {}
) => {
  const context = {
    query,
    apikey,
    baseUrl,
    depth,
    maxDepth,
    statusList: [],
    updateStatus: (status) => {
      context.statusList.push(status);
      onStatusUpdate?.(context.statusList);
    },
  };
  return context;
};

// 确保值是字符串
const ensureString = (value) => (typeof value === "string" ? value : JSON.stringify(value || ""));

// 安全地处理数组中的每个元素，确保它们是字符串
const safeMapToString = (arr) =>
  Array.isArray(arr) ? arr.map((item) => ensureString(item)).filter(Boolean) : [ensureString(arr)];

// 安全地连接数组元素
const safeJoin = (arr, separator = "\n\n") => safeMapToString(arr).join(separator);

export {
  createContext,
  ensureString,
  removeThinkingTags,
  removeThinkTags,
  safeJoin,
  safeMapToString,
};
