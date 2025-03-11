import { callOpenaiWithRetry } from "./callAi";
import { config } from "../../config";

export const check = async (
  query,
  selectedModel = "gpt-4o-mini",
  apikey,
  baseUrl = config.baseUrl
) => {
  const messages = [
    {
      role: "system",
      content: `你是一个专业的检查员，你会检查用户的问题是否为简单问候或无意义的话。
      
      用户的问题:
      ${query}

      要求：
      1. 检查用户的问题是否为简单问候（如"你好"、"早上好"等）或无意义的话（如"测试"、"123"等）。
      2. 如果是简单问候或无意义的话，请回答 true。
      3. 如果是有实质内容的问题，请回答 false。
      `,
    },
  ];

  const response = await callOpenaiWithRetry(messages, selectedModel, apikey, baseUrl);

  if (response.trim().toLowerCase() === "true") {
    return true;
  } else {
    return false;
  }
};

export const getSimpleResponse = async (query, selectedModel, apikey, baseUrl) => {
  const messages = [
    {
      role: "user",
      content: `你是一个对话助手，你需要回复用户的问题,请回复用户的问题,${query}`,
    },
  ];

  const response = await callOpenaiWithRetry(messages, selectedModel, apikey, baseUrl);
  return response;
};
