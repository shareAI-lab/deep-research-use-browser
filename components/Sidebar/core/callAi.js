import { removeThinkTags, removeThinkingTags } from "./utils";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const callOpenai = async (messages, model = "gpt-4o-mini", apikey, baseUrl) => {
  try {
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      throw new Error("消息参数无效");
    }
    if (baseUrl.endsWith("/v1")) {
      baseUrl = baseUrl.slice(0, -3);
    }

    if (baseUrl?.includes("deepseek.com") && model?.toLowerCase() === "deepseek-r1") {
      model = "deepseek-reasoner";
    } else if (baseUrl?.includes("deepseek.com") && model?.toLowerCase() === "deepseek-v3") {
      model = "deepseek-chat";
    }

    if (baseUrl === "https://api.super2brain.com") {
      baseUrl = "https://api.super2brain.com/text";
    }
    const response = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apikey}`,
      },
      body: JSON.stringify({
        messages,
        model: model.toLowerCase(),
        temperature: 0.7,
        max_tokens: 4096,
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 504) {
        throw new Error("链接超时，请检查网络连接并稍后重试");
      }
      if (response.status === 402) {
        throw new Error("账户余额不足，请充值后继续使用");
      }
      throw new Error(`API请求失败: ${response.status}`);
    }

    const reader = response.body.getReader();
    let result = "";

    while (true) {
      const { done, value } = await reader.read();

      if (value?.includes("Trying to keep the first ")) {
        throw new Error("请切换比较大模型的API");
      }

      if (done) break;

      const chunk = new TextDecoder().decode(value);
      const lines = chunk.split("\n").filter((line) => line.trim());

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);
            if (parsed.choices?.[0]?.delta?.content) {
              result += parsed.choices[0].delta.content;
            }
          } catch (e) {
            console.warn("解析响应数据失败:", e);
          }
        }
      }
    }
    let aiResponse = removeThinkTags(result);
    aiResponse = removeThinkingTags(aiResponse);
    return aiResponse;
  } catch (error) {
    console.error("OpenAI API 调用失败:", error.message);
    throw error;
  }
};

const callOpenaiWithRetry = async (messages, model, apikey, baseUrl, retries = 2) => {
  for (let i = 0; i <= retries; i++) {
    try {
      return await callOpenai(messages, model, apikey, baseUrl);
    } catch (error) {
      if (
        i === retries ||
        error?.message?.includes("余额不足") ||
        error?.message?.includes("API密钥")
      ) {
        throw error;
      }
      console.warn(`第 ${i + 1} 次调用失败，等待重试...`, error?.message);
      await sleep(1000 * (i + 1));
    }
  }
};

export { callOpenaiWithRetry };
