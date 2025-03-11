import { deepseekModel, openaiModel } from "../../config/models";
import { Bot, ChevronDown, Scissors } from "lucide-react";
import {
  getDeepSeekApiKey,
  getOpenaiApiKey,
  getCustomConfig,
  getLmstudioModels,
  getOpenAiUrl,
  getOllamaModels,
  getCustomModels,
} from "../../../../public/storage";
import { useState, useEffect, useRef } from "react";

const ModelSelector = ({
  isModelConfig,
  setActivatePage,
  isOpen,
  setIsOpen,
  selectedModel,
  setSelectedModel,
  selectedModelProvider,
  setSelectedModelProvider,
}) => {
  const [modelList, setModelList] = useState([]);
  const [customModelsDisabled, setCustomModelsDisabled] = useState(false);
  const dropdownRef = useRef(null);

  // 处理点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setIsOpen]);

  // 初始化模型列表
  useEffect(() => {
    const initializeModelList = async () => {
      const [deepSeekKey, openaiKey, ollamaModels, customModels, lmstudioModels, openaiUrl] =
        await Promise.all([
          getDeepSeekApiKey(),
          getOpenaiApiKey(),
          getOllamaModels(),
          getCustomModels(),
          getLmstudioModels(),
          getOpenAiUrl(),
        ]);
      const customConfig = await getCustomConfig();

      const newModelList = [
        ...Object.values(deepseekModel).map((model) => ({
          ...model,
          disabled: !deepSeekKey,
        })),
        ...Object.values(openaiModel).map((model) => ({
          ...model,
          disabled: !openaiKey,
        })),
        ...Object.values(ollamaModels).map((model) => ({
          ...model,
          disabled: false,
        })),
        ...Object.values(lmstudioModels).map((model) => ({
          ...model,
          disabled: false,
        })),
        ...Object.values(customModels).map((model) => ({
          ...model,
          disabled: !customConfig?.apiKey,
        })),
      ];

      setModelList(newModelList);
      setCustomModelsDisabled(newModelList.every((model) => model.disabled));
    };

    initializeModelList();
  }, []);

  const handleModelSelect = (model) => {
    setSelectedModel(model.id);
    setSelectedModelProvider(model.provider);
    setIsOpen(false);
  };

  return (
    <div
      className="relative flex items-center"
      ref={dropdownRef}
      style={{ minWidth: "10%", maxWidth: "60%" }}
    >
      {isOpen && (
        <div className="absolute bottom-full left-0 mb-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 w-[200px] overflow-hidden">
          <div className="py-2 max-h-[800px] overflow-y-auto">
            {isModelConfig ? (
              <>
                <ModelGroup
                  title="By DeepSeek"
                  models={modelList.filter((model) => model.provider === "deepseek")}
                  selectedModel={selectedModel}
                  selectedModelProvider={selectedModelProvider}
                  onModelSelect={handleModelSelect}
                />
                <ModelGroup
                  title="By Claude"
                  models={modelList.filter((model) => model.provider === "claude")}
                  selectedModel={selectedModel}
                  selectedModelProvider={selectedModelProvider}
                  onModelSelect={handleModelSelect}
                />
                <ModelGroup
                  title="By OpenAI"
                  models={modelList.filter((model) => model.provider === "openai")}
                  selectedModel={selectedModel}
                  selectedModelProvider={selectedModelProvider}
                  onModelSelect={handleModelSelect}
                />
                <ModelGroup
                  title="By Ollama"
                  models={modelList.filter((model) => model.provider === "ollama")}
                  selectedModel={selectedModel}
                  selectedModelProvider={selectedModelProvider}
                  onModelSelect={handleModelSelect}
                />
                <ModelGroup
                  title="By LMStudio"
                  models={modelList.filter((model) => model.provider === "lmstudio")}
                  selectedModel={selectedModel}
                  selectedModelProvider={selectedModelProvider}
                  onModelSelect={handleModelSelect}
                />
                <ModelGroup
                  title="自定义模型"
                  models={modelList.filter((model) => model.provider === "custom")}
                  selectedModel={selectedModel}
                  selectedModelProvider={selectedModelProvider}
                  onModelSelect={handleModelSelect}
                  customModelsDisabled={customModelsDisabled}
                  onConfigureClick={() => setActivatePage(5)}
                />
              </>
            ) : (
              <div
                className="px-4 py-1 text-sm transition-all duration-200
                        hover:bg-indigo-50 flex items-center justify-between
                        cursor-pointer text-indigo-600 group"
                onClick={() => setActivatePage(1)}
              >
                <span className="group-hover:text-indigo-600 flex items-center">
                  去配置模型密钥
                  <span className="ml-2 text-[11px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-600">
                    未配置
                  </span>
                </span>
              </div>
            )}
          </div>
        </div>
      )}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`flex w-full items-center px-3 py-2
          rounded-xl 
          border border-indigo-300
          transition-all duration-200
          shadow-sm
          ${"cursor-pointer bg-indigo-500 hover:bg-indigo-400 hover:shadow-md active:scale-[0.98]"}`}
      >
        <Bot className="w-4 h-4 text-white min-w-[16px] flex-shrink-0" />
        <span className="text-sm text-white ml-2 font-medium truncate">
          {isModelConfig ? selectedModel : "暂无模型配置，点我配置"}
        </span>
        <ChevronDown className="w-4 h-4 text-white/80 ml-1 flex-shrink-0" />
      </div>
    </div>
  );
};

const ModelGroup = ({
  title,
  models,
  selectedModel,
  selectedModelProvider,
  onModelSelect,
  customModelsDisabled = false,
  onConfigureClick,
}) => {
  const enabledModels = models.filter((model) => !model.disabled);
  if (enabledModels.length === 0 && !customModelsDisabled) return null;

  const maxHeight = window.innerHeight * 0.6;

  return (
    <>
      <div className="px-4 py-1 flex items-center">
        <span className="text-gray-500 text-[11px] font-medium tracking-wider flex items-center">
          {title}
        </span>
      </div>
      <div style={{ maxHeight: `${maxHeight}px`, overflowY: "auto" }}>
        {enabledModels.map((model) => (
          <div
            key={model.id}
            className={`px-4 py-2 text-sm transition-all duration-200 
                        hover:bg-indigo-50 flex items-center justify-between group
      
                        ${
                          selectedModel === model.id && selectedModelProvider === model.provider
                            ? "text-indigo-600 bg-indigo-50"
                            : "text-gray-600"
                        }`}
            onClick={() => onModelSelect(model)}
          >
            <div className="group-hover:text-indigo-600 pl-4 flex items-center">
              {model.supportsImage ? (
                <>
                  <Scissors className="w-3 h-3 transform -rotate-90 mr-1 -translate-x-4 text-indigo-600 min-w-[12px]" />
                  <span className="-ml-3 overflow-hidden text-ellipsis">{model.id}</span>
                </>
              ) : (
                <span className="overflow-hidden text-ellipsis">{model.id}</span>
              )}
            </div>
            {selectedModel === model.id && selectedModelProvider === model.provider && (
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 min-w-[6px] ml-2" />
            )}
          </div>
        ))}
      </div>
    </>
  );
};

export { ModelSelector };
