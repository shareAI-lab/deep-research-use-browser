import katex from "katex";
import "katex/dist/katex.min.css";
import { ChevronDown, ChevronUp, Loader2, StopCircle, XCircle } from "lucide-react";
import { marked } from "marked";
import { useEffect, useRef, useState } from "react";
import { getGetPageCount, removeGetPageCount } from "../../../../public/storage";
import { getResponse } from "../../saerchResult/index";
import { ActionButtons } from "./modules/actionButton";
import { InputArea } from "./modules/inputArea";
import { PlaceHolder } from "./modules/placeHolder";
import { TypeWriter } from "./modules/TypeWriter";

const commonClassNames = `text-sm text-black break-words leading-relaxed prose overflow-wrap break-word 
    prose-p:leading-6 prose-p:pb-0 prose-p:mb-0  prose-p:text-black
    prose-hr:hidden prose-hr:border-none prose-hr:m-0
    prose-h1:mb-3 prose-h1:mt-3 prose-h1:text-black prose-h1:text-[24px]
    prose-h2:mb-3 prose-h2:mt-3 prose-h2:text-black prose-h2:text-[22px]
    prose-h3:mb-2 prose-h3:mt-2 prose-h3:text-black prose-h3:mt-4 prose-h3:mb-2 prose-h3:text-[20px]
    prose-h4:text-black prose-h4:mb-2 prose-h4:mt-2 prose-h4:text-[18px]
    prose-h5:text-black prose-h5:mb-2 prose-h5:mt-2 prose-h5:text-[16px]
    prose-h6:text-black prose-h6:mb-2 prose-h6:mt-2 prose-h6:text-[16px]
    prose-ul:list-decimal prose-ul:text-black prose-ul:mb-0
    prose-ol:mb-0 prose-ol:text-black prose-ol:list-decimal prose-li:text-black   
    prose-code:text-black
    prose-pre:before:content-none prose-pre:after:content-none prose-pre:text-black prose-pre:rounded-md prose-pre:whitespace-pre-wrap prose-pre:bg-gray-100
    prose-code:bg-gray-200 prose-code:text-black prose-code:p-1 prose-code:rounded-md prose-code:whitespace-pre-wrap prose-code:my-4 prose-code:mx-2
    [&_pre]:bg-gray-100 [&_pre]:p-4 [&_pre]:rounded-md [&_pre]:w-full [&_pre]:block [&_pre]:whitespace-pre-wrap [&_pre]:break-words
    [&_pre_code]:bg-gray-100 [&_pre_code]:w-full [&_pre_code]:p-0 [&_pre_code]:rounded-none [&_pre_code]:my-2 [&_pre_code]:mx-0 [&_pre_code]:block [&_pre_code]:whitespace-pre-wrap [&_pre_code]:break-words
    prose-blockquote:font-medium prose-blockquote:italic prose-blockquote:text-[var(--tw-prose-quotes)] prose-blockquote:border-l-[0.25rem] prose-blockquote:border-l-[var(--tw-prose-quote-borders)] prose-blockquote:mt-6 prose-blockquote:mb-6 prose-blockquote:pl-4
    prose-table:mt-4 prose-table:mb-4 prose-table:w-full prose-table:overflow-hidden prose-table:border-collapse prose-table:border prose-table:border-gray-300
    prose-th:py-2 prose-th:px-4 prose-th:border prose-th:border-gray-300 prose-th:bg-gray-100 prose-th:text-left
    prose-td:py-2 prose-td:px-4 prose-td:border prose-td:border-gray-300
    prose-tr:py-2 prose-tr:px-4 prose-tr:border prose-tr:border-gray-300
`;

export const DeepSearch = ({
  query,
  setQuery,
  messages,
  isLoading,
  currentStatus,
  onSendMessage,
  isDeepThingActive,
  setIsDeepThingActive,
  maxDepth,
  setMaxDepth,
  needTime,
  hasError,
  setMessages,
  selectedModel,
  setSelectedModel,
  selectedModelProvider,
  setSelectedModelProvider,
  setActivatePage,
  handleTerminate,
  isTerminating,
  isModelConfig,
}) => {
  const [showTextArea, setShowTextArea] = useState(true);
  const messagesEndRef = useRef(null);
  const statusBoxRef = useRef(null);
  const [isThinkingCollapsed, setIsThinkingCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const timerRef = useRef(null);
  const [pageCount, setPageCount] = useState(0);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollStatusToBottom = () => {
    if (statusBoxRef.current) {
      requestAnimationFrame(() => {
        statusBoxRef.current.scrollTo({
          top: statusBoxRef.current.scrollHeight,
          behavior: "smooth",
        });
      });
    }
  };

  useEffect(() => {
    if (
      Array.isArray(currentStatus) &&
      messages.length > 0 &&
      !messages[messages.length - 1].isComplete
    ) {
      scrollToBottom();
    }
  }, [currentStatus, messages]);

  useEffect(() => {
    if (Array.isArray(currentStatus) && !isThinkingCollapsed) {
      const timer = setTimeout(scrollStatusToBottom, 100);
      return () => clearTimeout(timer);
    }
  }, [currentStatus, isThinkingCollapsed]);

  const getElapsedTime = () => {
    if (!messages[messages.length - 1].startTime) return 0;
    return Math.floor((currentTime - messages[messages.length - 1].startTime) / 1000);
  };

  const startTimer = () => {
    if (timerRef.current) return;
    timerRef.current = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    if (isLoading) {
      startTimer();
    } else {
      stopTimer();
    }

    return () => stopTimer();
  }, [isLoading]);

  useEffect(() => {
    if (Array.isArray(currentStatus) && currentStatus.length > 0) {
      const scrollToStatusBottom = () => {
        if (statusBoxRef.current) {
          statusBoxRef.current.scrollTop = statusBoxRef.current.scrollHeight;
        }
      };
      scrollToStatusBottom();
    }
  }, [currentStatus]);

  const handleSendMessage = async () => {
    removeGetPageCount();
    setIsDeepThingActive(true);
    if (!query.trim() || isLoading) return;
    const question = query;
    setQuery("");
    await onSendMessage(question, getResponse);
  };

  const processLatex = (content) => {
    content = content.replace(/\\\[([\s\S]*?)\\\]/g, (match, tex) => {
      try {
        return katex.renderToString(tex.trim(), {
          displayMode: true,
          throwOnError: false,
        });
      } catch (err) {
        console.error("LaTeX渲染错误:", err);
        return match;
      }
    });

    // 处理其他格式的公式
    return content.replace(
      /\$\$(.*?)\$\$|\$(.*?)\$|\/\[(.*?)\]/g,
      (match, block, inline, bracket) => {
        try {
          const tex = block || inline || bracket;
          const isBlock = !!block;
          if (!tex) return match;

          return katex.renderToString(tex.trim(), {
            displayMode: isBlock,
            throwOnError: false,
          });
        } catch (err) {
          console.error("LaTeX渲染错误:", err);
          return match;
        }
      }
    );
  };

  const handleStopProcess = () => {
    handleTerminate();
    setQuery("");
    setMessages([]);
    setShowTextArea(false);
    setIsDeepThingActive(false);
  };

  const renderMessages = () =>
    messages?.map((msg, index) => (
      <div key={`message-${index}`} className="animate-fadeIn px-8 pt-4 pb-2">
        {msg.role === "user" ? (
          <div></div>
        ) : (
          <div>
            {Array.isArray(currentStatus) && (
              <div className="mb-6 animate-fadeIn">
                <div
                  className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4 flex items-center cursor-pointer select-none hover:text-gray-700"
                  onClick={() => setIsThinkingCollapsed(!isThinkingCollapsed)}
                >
                  <span>思考过程</span>
                  <div className="ml-2 flex items-center">
                    {isThinkingCollapsed ? (
                      <>
                        <ChevronUp className="w-4 h-4" />
                        <span>展开</span>
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4" />
                        <span>收起</span>
                      </>
                    )}
                  </div>
                </div>
                {isThinkingCollapsed ? (
                  <div className="relative">
                    <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                    <div className="text-sm text-gray-500 border-l-2 border-gray-200 pl-3 py-1 sticky bottom-0 bg-white/95 backdrop-blur-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-blue-600 select-none">$</span>
                        <span className="truncate">{currentStatus[0]}</span>
                      </div>
                      <div className="mt-1 text-xs text-gray-400">
                        {currentStatus.length - 1} 条更多思考步骤...
                        {needTime && !messages[messages.length - 1]?.isComplete && (
                          <span className="ml-2">· 预计需要 {needTime} 分钟</span>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div
                      ref={statusBoxRef}
                      className="font-mono text-sm border border-gray-200 rounded-lg p-4 max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent"
                    >
                      <ul className="space-y-2">
                        {currentStatus.map((status, idx) => (
                          <li
                            key={idx}
                            className="flex items-start space-x-2 text-gray-900 animate-fadeIn"
                          >
                            <span className="text-blue-600 flex-shrink-0 select-none">
                              {idx === currentStatus.length - 1 ? ">" : "$"}
                            </span>
                            <div className="flex items-center space-x-2">
                              <TypeWriter
                                text={status}
                                isPulsing={idx === currentStatus.length - 1}
                                onComplete={() => {}}
                                instant={idx === 0}
                                className={idx === currentStatus.length - 1 ? "animate-pulse" : ""}
                              />
                              {idx === currentStatus.length - 1 && (
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600 flex-shrink-0 ml-1" />
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}
              </div>
            )}
            {msg.isComplete && (
              <div className="px-1 relative group">
                <div
                  className={`${commonClassNames}`}
                  dangerouslySetInnerHTML={{
                    __html: marked(processLatex(msg.content), {
                      breaks: true,
                      gfm: true,
                      headerIds: true,
                      mangle: false,
                      sanitize: false,
                    }),
                  }}
                />
              </div>
            )}
          </div>
        )}
      </div>
    ));

  // 提取提示卡片为独立组件
  const ThinkingCard = () => (
    <div
      className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100/60 
      rounded-xl p-4 shadow-sm backdrop-blur-sm"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" />
          <div className="flex flex-col">
            <span className="text-sm font-medium text-indigo-700/90">
              预计需要时间：{needTime || "计算中..."} 分钟
              {isLoading && (
                <span className="text-indigo-500/90 ml-2 font-normal">
                  (已用时间: {formatTime(getElapsedTime())})
                </span>
              )}
            </span>
            <span className="text-xs text-indigo-500/80 mt-1.5">
              S2B正在操作你的浏览器进行AI洞察分析，请不要关闭侧边栏
            </span>
          </div>
        </div>
        <button
          onClick={handleStopProcess}
          disabled={isTerminating}
          className={`min-w-[80px] flex p-2 rounded-lg transition-colors duration-200 justify-between 
            ${
              isTerminating
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-red-50 text-red-600 hover:bg-red-100"
            }`}
        >
          <StopCircle className="w-5 h-5" />
          <span>停止</span>
        </button>
      </div>
    </div>
  );

  useEffect(() => {
    let pageCountTimer = null;

    const fetchPageCount = async () => {
      try {
        const count = await getGetPageCount();
        setPageCount(count || 0);
      } catch (error) {
        console.error("获取页面计数失败:", error);
      }
    };

    if (isLoading) {
      fetchPageCount();
      pageCountTimer = setInterval(fetchPageCount, 3000);
    }

    return () => {
      if (pageCountTimer) {
        clearInterval(pageCountTimer);
      }
    };
  }, [isLoading]);

  useEffect(() => {
    console.log("模型已更改:", selectedModel);
    console.log("提供商已更改:", selectedModelProvider);
  }, [selectedModel, selectedModelProvider]);

  return (
    <div className="w-full h-[calc(100vh-8px)] flex flex-col bg-white rounded-l-xl">
      <div className="px-8 py-4">
        <div className="flex flex-col gap-4">
          {messages.length > 0 && (
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                    <span>
                      S2B进行AI洞察分析{pageCount > 0 && `(已阅读网页个数 ${pageCount} )`}
                    </span>
                  </>
                ) : messages[messages.length - 1]?.errorTitle ? (
                  <>
                    <XCircle className="w-5 h-5 text-red-500" />
                    <span>{messages[messages.length - 1]?.errorTitle}</span>
                  </>
                ) : (
                  <>
                    <span>AI洞察分析完成</span>
                  </>
                )}
              </h1>
            </div>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
        {!isDeepThingActive ? <PlaceHolder setActivatePage={setActivatePage} /> : renderMessages()}
        <div ref={messagesEndRef} />
      </div>
      <div className="flex-shrink-0 p-2">
        {(!isLoading || isTerminating) && (
          <div className="relative">
            {messages.length === 0 && (
              <InputArea
                isModelConfig={isModelConfig}
                selectedModelProvider={selectedModelProvider}
                setSelectedModelProvider={setSelectedModelProvider}
                selectedModel={selectedModel}
                setSelectedModel={setSelectedModel}
                query={query}
                setQuery={setQuery}
                maxDepth={maxDepth}
                setMaxDepth={setMaxDepth}
                isLoading={isLoading}
                handleSendMessage={handleSendMessage}
                setActivatePage={setActivatePage}
              />
            )}
            {messages.length > 0 && (
              <ActionButtons
                setShowTextArea={setShowTextArea}
                messages={messages}
                setQuery={setQuery}
                setMessages={setMessages}
                setIsDeepThingActive={setIsDeepThingActive}
              />
            )}
          </div>
        )}
        {isLoading && !isTerminating && (
          <div className="px-2">
            <ThinkingCard />
          </div>
        )}
      </div>
    </div>
  );
};
