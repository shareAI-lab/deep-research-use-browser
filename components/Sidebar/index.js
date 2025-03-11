import React, { useEffect, useState, useMemo } from "react";
import { SettingPage } from "./components/settingPage";
import { ActivateBar } from "./components/common/activateBar";
import { DeepSearch } from "./components/deepSearch";
import { useDeepSearch } from "./hooks/useDeepSearch";
import { AnimatePresence, motion } from "framer-motion";
import { pageVariants, pageTransition } from "./contants/pageTransltions";
import { useSeetingHandler } from "./hooks/useSeetingHandler";
import { config } from "../config/index";
import { getModelAndUrlConig } from "../../public/storage";
import { useTimeGussing } from "./hooks/useGessingTime";

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
      const modelMap = {
        deepseek: "deepseek-chat",
        openai: "gpt-4o-mini",
        ollama: "llama3",
        lmstudio: "mixtral-8x7b",
        custom: "custom-model",
      };

      deepSearchState.setSelectedModel(modelMap[bestProvider] || "gpt-4o-mini");
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
