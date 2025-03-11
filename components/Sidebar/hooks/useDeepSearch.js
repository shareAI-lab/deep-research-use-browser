import { useState, useRef, useCallback, useEffect } from "react";

export const useDeepSearch = (maxDepth = 3, initialApiKey, initialBaseUrl, getNeedTime) => {
  const [selectedModel, setSelectedModel] = useState("deepseek-chat");
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState("");
  const [hasError, setHasError] = useState(false);
  const [isTerminating, setIsTerminating] = useState(false);
  const [baseUrl, setBaseUrl] = useState(initialBaseUrl);
  const [apiKey, setApiKey] = useState(initialApiKey);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    setApiKey(initialApiKey);
    setBaseUrl(initialBaseUrl);
  }, [initialApiKey, initialBaseUrl]);

  const handleTerminate = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsTerminating(true);

      setTimeout(() => {
        setIsLoading(false);
        setCurrentStatus("");
        setIsTerminating(false);
        setMessages((prev) => {
          const newMessages = [...prev];
          if (newMessages.length > 0) {
            newMessages[newMessages.length - 1] = {
              ...newMessages[newMessages.length - 1],
              content: "已终止AI洞察分析过程",
              isComplete: true,
            };
          }
          return newMessages;
        });
      }, 100);
    }
  };

  const handleSendMessage = useCallback(
    async (question, getResponse) => {
      if (currentStatus.length > 0) setCurrentStatus("");
      if (!question.trim() || isLoading) return;
      setIsLoading(true);
      getNeedTime(maxDepth);
      setHasError(false);
      abortControllerRef.current = new AbortController();

      const userMessage = { role: "user", content: question, isComplete: true };
      setMessages([userMessage]);

      try {
        const aiMessage = {
          role: "assistant",
          status: "thinking",
          content: currentStatus,
          isComplete: false,
          startTime: Date.now(),
        };

        setMessages([userMessage, aiMessage]);

        const response = await getResponse(
          question,
          0,
          maxDepth,
          selectedModel,
          apiKey,
          baseUrl,
          (status) => {
            if (abortControllerRef.current.signal.aborted) {
              throw new Error("已终止");
            }
            setCurrentStatus(status);
            setMessages((prev) => {
              const newMessages = [...prev];
              const lastMessage = newMessages[newMessages.length - 1];
              if (lastMessage.role === "assistant" && !lastMessage.isComplete) {
                lastMessage.content = status;
              }
              return newMessages;
            });
          },
          abortControllerRef.current.signal
        );

        setMessages([
          userMessage,
          {
            role: "assistant",
            content: response,
            isComplete: true,
          },
        ]);
      } catch (error) {
        if (error.message === "已终止") {
          return;
        }
        console.error("发送消息失败:", error);
        setHasError(true);
        const errorMessage =
          error.message.includes("链接超时") || error.message.includes("余额不足")
            ? error.message
            : `### 抱歉，AI洞察分析过程中出现错误。请稍后重试或联系支持团队。\n #### 1. 检查网络连接\n #### 2. 检查API密钥\n #### 3. 检查余额 \n #### 4. 如果是自定义模型的话，请检查模型是否太小，或者是否存在跨域问题`;
        const errorTitle = "AI洞察分析过程失败";
        setMessages([
          userMessage,
          {
            role: "assistant",
            content: errorMessage,
            isComplete: true,
            isError: true,
            errorTitle: errorTitle,
          },
        ]);
      } finally {
        if (!isTerminating) {
          setIsLoading(false);
          setCurrentStatus("");
        }
      }
    },
    [
      query,
      maxDepth,
      selectedModel,
      messages,
      apiKey,
      baseUrl,
      isLoading,
      currentStatus,
      isTerminating,
    ]
  );

  const handleSetSelectedModel = (model) => {
    setSelectedModel(model);
  };

  return {
    query,
    setQuery,
    messages,
    setMessages,
    isLoading,
    currentStatus,
    handleSendMessage,
    hasError,
    selectedModel,
    setSelectedModel: handleSetSelectedModel,
    isTerminating,
    handleTerminate,
    setBaseUrl,
    setApiKey,
  };
};
