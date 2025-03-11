const makeQuestionMore = async (query, selectedModel, apikey, baseUrl) => {
  const fetchQuestion = async () => {
    const response = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apikey}`,
      },
      stream: true,
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content: `你是一个分析专家，请分析用户的问题，思考用户的问题具体是问什么，将用户的问题补充完善，并列出所需要关注的点
         
            回答的形式要是文本的格式，不要出现markdown，也不要出现太多的换行符，只是简单的文本

               原始问题：${query}
            `,
          },
          {
            role: "user",
            content: `开始生成，注意不要附带markdown格式`,
          },
        ],
        model: selectedModel,
        stream: true,
        temperature: 0.7,
      }),
    });

    const reader = response.body.getReader();
    let result = "";

    while (true) {
      const { done, value } = await reader.read();
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
    return result;
  };

  try {
    const response = await fetchQuestion();
    if (!response) {
      console.warn("获取问题响应为空");
      return [];
    }
    try {
      const cleanedResponse = response
        .replace(/```json\s*/g, "")
        .replace(/```\s*$/g, "")
        .replace(/# /g, "")
        .replace(/##/g, "")
        .replace(/###/g, "")
        .replace(/\n{2,}/g, "\n")
        .trim();
      return cleanedResponse;
    } catch (parseError) {
      console.error("JSON解析失败:", parseError, "原始响应:", response);
      return [];
    }
  } catch (error) {
    console.error("AI洞察分析失败:", error);
    return [];
  }
};

export { makeQuestionMore };
