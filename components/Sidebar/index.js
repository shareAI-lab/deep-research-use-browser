import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useMemo, useState } from "react";
import {
  getCustomModels,
  getLmstudioModels,
  getModelAndUrlConig,
  getOllamaModels,
} from "../../public/storage";
import { config } from "../config/index";
import { ActivateBar } from "./components/common/activateBar";
import { DeepSearch } from "./components/deepSearch";
import { SettingPage } from "./components/settingPage";
import { pageTransition, pageVariants } from "./contants/pageTransltions";
import { useDeepSearch } from "./hooks/useDeepSearch";
import { useTimeGussing } from "./hooks/useGessingTime";
import { useSeetingHandler } from "./hooks/useSeetingHandler";

export default function Sidebar() {
  const [activatePage, setActivatePage] = useState(0);
  const [maxDepth, setMaxDepth] = useState(3);
  const [isDeepThingActive, setIsDeepThingActive] = useState(false);
  const { settings, setSettings, fetchDeepSeekConfig } = useSeetingHandler();
  const [selectedModelProvider, setSelectedModelProvider] = useState("deepseek");
  const [isModelConfig, setIsModelConfig] = useState(false);
  const { needTime, getNeedTime } = useTimeGussing();
  useEffect(() => {
    fetchDeepSeekConfig();
  }, [activatePage]);

  const currentBaseUrl = useMemo(() => {
    return settings[selectedModelProvider]?.baseUrl || config.baseUrl;
  }, [setActivatePage, settings, activatePage, selectedModelProvider]);

  const currentApiKey = useMemo(() => {
    return settings[selectedModelProvider]?.apiKey || null;
  }, [setActivatePage, settings, activatePage, selectedModelProvider]);

  const deepSearchState = useDeepSearch(maxDepth, currentApiKey, currentBaseUrl, getNeedTime);

  const getBestModelForProvider = async (provider) => {
    try {
      switch (provider) {
        case "deepseek":
          return "deepseek-chat";
        case "openai":
          return "gpt-4o-mini";
        case "ollama": {
          const ollamaModels = await getOllamaModels();
          return Object.keys(ollamaModels)[0] || "llama3";
        }
        case "lmstudio": {
          const lmstudioModels = await getLmstudioModels();
          return Object.keys(lmstudioModels)[0] || "mixtral-8x7b";
        }
        case "custom": {
          const customModels = await getCustomModels();
          return Object.keys(customModels)[0] || "custom-model";
        }
        default:
          return "deepseek-chat";
      }
    } catch (error) {
      console.error(`获取${provider}模型失败:`, error);
      return "deepseek-chat";
    }
  };

  const checkSetting = async () => {
    const providers = Object.keys(settings);

    const validProviders = providers.filter(
      (provider) => settings[provider]?.baseUrl && settings[provider]?.apiKey
    );

    if (validProviders.length > 0) {
      const preferredOrder = [
        "deepseek",
        "openai",
        ...validProviders.filter((p) => !["deepseek", "openai"].includes(p)),
      ];
      const bestProvider =
        preferredOrder.find((p) => validProviders.includes(p)) || validProviders[0];

      setSelectedModelProvider(bestProvider);

      const bestModel = await getBestModelForProvider(bestProvider);
      deepSearchState.setSelectedModel(bestModel);
    }
  };

  useEffect(() => {
    const fetchModelAndUrlConfig = async () => {
      const isModelConfigTrue = await getModelAndUrlConig();
      if (isModelConfigTrue) {
        setIsModelConfig(true);
      }
    };
    fetchModelAndUrlConfig();

    checkSetting();
  }, [settings]);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <div className="flex-1 flex  flex-col min-w-0 m-1 rounded-l-xl bg-white overflow-hidden">
        <AnimatePresence mode="wait">
          {activatePage === 0 ? (
            <motion.div
              key="deepSearch"
              className="flex-1"
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageVariants}
              transition={pageTransition}
            >
              <DeepSearch
                setSelectedModelProvider={setSelectedModelProvider}
                selectedModelProvider={selectedModelProvider}
                selectedModel={deepSearchState.selectedModel}
                setSelectedModel={deepSearchState.setSelectedModel}
                maxDepth={maxDepth}
                setMaxDepth={setMaxDepth}
                query={deepSearchState.query}
                setQuery={deepSearchState.setQuery}
                messages={deepSearchState.messages}
                isLoading={deepSearchState.isLoading}
                currentStatus={deepSearchState.currentStatus}
                onSendMessage={deepSearchState.handleSendMessage}
                isDeepThingActive={isDeepThingActive}
                setIsDeepThingActive={setIsDeepThingActive}
                setMessages={deepSearchState.setMessages}
                setActivatePage={setActivatePage}
                handleTerminate={deepSearchState.handleTerminate}
                isTerminating={deepSearchState.isTerminating}
                isModelConfig={isModelConfig}
                needTime={needTime}
              />
            </motion.div>
          ) : activatePage === 1 ? (
            <motion.div
              key="settings"
              className="flex-1"
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageVariants}
              transition={pageTransition}
            >
              <SettingPage settings={settings} setSettings={setSettings} />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <div className="flex-shrink-0 w-12 bg-gray-100">
        <ActivateBar activatePage={activatePage} setActivatePage={setActivatePage} />
      </div>
    </div>
  );
}
