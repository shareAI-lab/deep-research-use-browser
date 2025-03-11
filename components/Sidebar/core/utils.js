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

export { removeThinkTags, removeThinkingTags, createContext };
