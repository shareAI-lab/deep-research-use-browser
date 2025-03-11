chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.action === "openSidebar") {
    chrome.sidePanel.setOptions({
      enabled: true,
      path: "sidepanel.html",
    });
    chrome.sidePanel.open({ windowId: sender.tab.windowId });
  }
});

async function extractPageContent(url) {
  let tab = null;
  let timeoutId = null;

  try {
    if (url.startsWith("chrome://") || url.startsWith("chrome-extension://")) {
      return { url, content: "" };
    }

    const timeout = new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error("页面加载超时(15秒)"));
      }, 15000);
    });

    const extractPromise = (async () => {
      tab = await chrome.tabs.create({
        url,
        active: false,
      });

      // 使用内容可读性检测而非等待完全加载
      await new Promise((resolve) => {
        // 检测页面是否包含足够的可读内容
        const checkReadability = async (tabId) => {
          if (tabId !== tab.id) return;

          try {
            const readabilityResult = await chrome.scripting.executeScript({
              target: { tabId },
              func: () => {
                // 检查页面是否有足够的文本内容
                const textContent = document.body.innerText;
                const wordCount = textContent.split(/\s+/).filter((w) => w.length > 0).length;

                // 检查主要内容元素是否已加载
                const hasMainContent = Boolean(
                  document.querySelector("article") ||
                    document.querySelector("main") ||
                    document.querySelector(".content") ||
                    document.querySelector("#content") ||
                    document.querySelectorAll("p").length > 3
                );

                return {
                  wordCount,
                  hasMainContent,
                  isReadable: wordCount > 100 && hasMainContent,
                };
              },
            });

            const { isReadable } = readabilityResult[0]?.result || { isReadable: false };

            if (isReadable) {
              resolve();
            } else {
              // 如果内容还不够可读，稍后再检查
              setTimeout(() => checkReadability(tabId), 300);
            }
          } catch (error) {
            // 出错时默认解析
            resolve();
          }
        };

        // 监听DOM内容加载完成事件，这通常比load事件更早
        const domContentLoadedCheck = (tabId, changeInfo) => {
          // 当DOM内容加载完成或页面状态变为complete时开始检查可读性
          if (
            tabId === tab.id &&
            (changeInfo.status === "complete" || changeInfo.status === "loading")
          ) {
            // 开始检查页面可读性
            setTimeout(() => checkReadability(tabId), 500);
          }
        };

        chrome.tabs.onUpdated.addListener(domContentLoadedCheck);

        // 设置一个备用计时器，即使内容检测失败也能继续
        setTimeout(() => {
          chrome.tabs.onUpdated.removeListener(domContentLoadedCheck);
          resolve();
        }, 5000);
      });

      const content = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: async () => {
          const extractContent = () => {
            try {
              const turndownService = new TurndownService();
              const rules = [
                {
                  name: "truncate-svg",
                  filter: "svg",
                  replacement: () => "",
                },
                {
                  name: "header",
                  filter: ["h1", "h2", "h3"],
                  replacement: (content, node) => {
                    const h1s = document.getElementsByTagName("h1");
                    const h2s = document.getElementsByTagName("h2");
                    const h3s = document.getElementsByTagName("h3");

                    if (h1s.length > 0 && node.tagName === "H1") {
                      return `# ${content}\n\n`;
                    } else if (h1s.length === 0 && h2s.length > 0 && node.tagName === "H2") {
                      return `# ${content}\n\n`;
                    } else if (h1s.length === 0 && h2s.length === 0 && node.tagName === "H3") {
                      return `# ${content}\n\n`;
                    }
                    return `${content}\n\n`;
                  },
                },
                {
                  name: "absolute-image-paths",
                  filter: "img",
                  replacement: () => ``,
                },
              ];

              rules.forEach((rule) => turndownService.addRule(rule.name, rule));

              const reader = new Readability(document.cloneNode(true), {
                charThreshold: 0,
                keepClasses: true,
                nbTopCandidates: 10,
                keepImages: false,
                keepLinks: false,
              });

              const article = reader.parse();

              if (!article?.content) {
                const mainContent = document.body.innerText
                  .split("\n")
                  .filter((line) => line.trim().length > 0)
                  .join("\n");
                return { content: mainContent };
              }

              return {
                content: turndownService.turndown(article.content),
                title: article.title,
              };
            } catch (error) {
              console.error("Content extraction error:", error);
              return { content: "", error: error.message };
            }
          };

          return extractContent();
        },
      });

      const { content: extractedContent, title } = content[0]?.result || { content: "", title: "" };
      return { url, content: extractedContent, title };
    })();

    return await Promise.race([timeout, extractPromise]);
  } catch (error) {
    console.error("提取页面内容时出错:", error, "URL:", url);
    return { url, content: "", error: error.message };
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    if (tab?.id) {
      try {
        await chrome.tabs.remove(tab.id);
      } catch (e) {
        console.error("关闭标签页失败:", e);
      }
    }
  }
}

async function extractMultiplePages(urls) {
  try {
    const results = await Promise.all(urls.map((url) => extractPageContent(url)));

    return results.filter((result) => result.content);
  } catch (error) {
    console.error("批量提取内容时出错:", error);
    return [];
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "extractMultipleContents") {
    extractMultiplePages(message.urls)
      .then((contents) => sendResponse({ success: true, contents }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true;
  }
});
