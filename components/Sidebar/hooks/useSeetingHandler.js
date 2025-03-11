import { useState } from "react";
import {
  getDeepSeekApiKey,
  getOpenaiApiKey,
  getOllamaConfig,
  getCustomConfig,
  getLmstudioConfig,
  getOpenAiUrl,
} from "../../../public/storage";

const useSeetingHandler = () => {
  const [settings, setSettings] = useState({
    deepseek: {
      baseUrl: "https://api.deepseek.com",
      apiKey: "",
    },
    openai: {
      baseUrl: "https://api.openai.com",
      apiKey: "",
    },
    ollama: {
      baseUrl: "http://localhost:11434",
      apiKey: "",
    },
    lmstudio: {
      baseUrl: "http://localhost:1234",
      apiKey: "",
    },
    custom: {
      baseUrl: "",
      apiKey: "",
    },
  });

  const fetchDeepSeekConfig = async () => {
    try {
      const configs = await Promise.all([getDeepSeekApiKey(), getOpenaiApiKey()]);
      const lmstudioConfig = await getLmstudioConfig();
      const ollamaConfig = await getOllamaConfig();
      const customConfig = await getCustomConfig();
      const openaiUrl = await getOpenAiUrl();
      setSettings((prev) => ({
        deepseek: {
          baseUrl: "https://api.deepseek.com" || "",
          apiKey: configs[0] || "",
        },
        openai: {
          baseUrl: openaiUrl || "https://api.openai.com",
          apiKey: configs[1] || "",
        },
        ollama: {
          baseUrl: ollamaConfig.url || "http://localhost:11434",
          apiKey: ollamaConfig.apiKey || "",
        },
        lmstudio: {
          baseUrl: lmstudioConfig.url || "http://localhost:1234",
          apiKey: lmstudioConfig.apiKey || "",
        },
        custom: {
          baseUrl: customConfig.url || "",
          apiKey: customConfig.apiKey || "",
        },
      }));
    } catch (error) {
      console.error("获取 DeepSeek 配置失败:", error);
    }
  };

  return { settings, setSettings, fetchDeepSeekConfig };
};

export { useSeetingHandler };
