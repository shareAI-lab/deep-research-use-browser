export async function setItem(key, value) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ [key]: value }, () => {
      if (chrome.runtime.lastError) {
        console.error("Chrome存储错误:", chrome.runtime.lastError);
        reject(chrome.runtime.lastError);
      } else {
        resolve();
      }
    });
  });
}

export async function getItem(key) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get([key], (result) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(result[key]);
      }
    });
  });
}

export async function getDeepSeekApiKey() {
  const apiKey = await getItem("deepSeekApiKey");
  return apiKey || "";
}

export async function setDeepSeekApiKey(apiKey) {
  return setItem("deepSeekApiKey", apiKey);
}

export const setOpenAiUrl = (url) => {
  return setItem("openAiUrl", url);
};

export const getOpenAiUrl = () => {
  return getItem("openAiUrl");
};

export async function setOpenaiApiKey(apiKey) {
  return setItem("openaiApiKey", apiKey);
}

export async function getOpenaiApiKey() {
  const apiKey = await getItem("openaiApiKey");
  return apiKey || "";
}

export async function setOllamaConfig(url, apiKey) {
  return setItem("ollamaConfig", { url, apiKey });
}

export async function getOllamaConfig() {
  const config = await getItem("ollamaConfig");
  return config || {};
}

export async function setLmstudioConfig(url, apiKey) {
  return setItem("lmstudioConfig", { url, apiKey });
}

export async function getLmstudioConfig() {
  const config = await getItem("lmstudioConfig");
  return config || {};
}

export async function setOllamaModels(models) {
  const formattedModels = models.reduce((acc, model) => {
    const key = model.name;
    acc[key] = {
      id: model.name,
      provider: "ollama",
      supportsImage: false,
      details: model.details || {},
      size: model.size,
      modified_at: model.modified_at,
    };
    return acc;
  }, {});

  return setItem("ollamaModels", formattedModels);
}

export async function getOllamaModels() {
  const models = await getItem("ollamaModels");
  return models || {};
}

export async function setCustomModelIds(modelIds) {
  return setItem("customModelIds", modelIds);
}

export async function getCustomModelIds() {
  const modelIds = await getItem("customModelIds");
  return modelIds || [];
}

export async function setCustomApiKey(modelId, apiKey) {
  return setItem(`customApiKey_${modelId}`, apiKey);
}

export const setCustomConfig = async (url, apiKey) => {
  return setItem("customConfig", { url, apiKey });
};

export const getCustomConfig = async () => {
  const config = await getItem("customConfig");
  return config || {};
};

export async function setCustomModels(models) {
  const formattedModels = models.reduce((acc, modelId) => {
    acc[modelId] = {
      id: modelId,
      provider: "custom",
      supportsImage: false,
    };
    return acc;
  }, {});

  return setItem("customModels", formattedModels);
}

export async function getCustomModels() {
  const models = await getItem("customModels");
  return models || {};
}

export async function setLmstudioModels(models) {
  const formattedModels = models.data.reduce((acc, model) => {
    const key = model.id;
    acc[key] = {
      id: model.id,
      provider: "lmstudio",
      supportsImage: false,
      details: {
        object: model.object,
        owned_by: model.owned_by,
      },
    };
    return acc;
  }, {});

  return setItem("lmstudioModels", formattedModels);
}

export async function getLmstudioModels() {
  const models = await getItem("lmstudioModels");
  return models || {};
}

export async function setSearchSourceStorage(source) {
  return setItem("searchSource", source);
}

export async function getSearchSourceStorage() {
  const source = await getItem("searchSource");
  return source || "https://www.bing.com/search?q=";
}

export async function setCurrentSearchSource(source) {
  return setItem("currentSearchSource", source);
}

export async function getCurrentSearchSource() {
  return getItem("currentSearchSource");
}

export async function setGetPageCount(count) {
  const currentCount = await getGetPageCount();
  const newCount = Number(currentCount || 0) + Number(count || 0);
  return setItem("getPageCount", newCount);
}

export async function getGetPageCount() {
  const count = await getItem("getPageCount");
  return count || 0;
}

export async function removeGetPageCount() {
  return setItem("getPageCount", null);
}

export async function setModelAndUrlConig() {
  return setItem("isModelConfig", true);
}

export async function getModelAndUrlConig() {
  const isModelConfig = await getItem("isModelConfig");
  return isModelConfig || false;
}
