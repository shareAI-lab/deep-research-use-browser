import { callOpenaiWithRetry } from "./callAi";

export const getDeepAnalysis = async (
  query,
  previousResponse,
  lastQuestion,
  selectedModel,
  apikey,
  baseUrl
) => {
  const messages = [
    {
      role: "system",
      content: `你是一个深度分析专家，你会根据用户的原始问题以及上一轮的回答，提出更深层次的意图分析。

      原始问题:
      ${query}

      上一轮回答:
      ${previousResponse}

      上一轮问题:
      ${lastQuestion}


      要求：
      这次的意图分析要更深入，更全面，不要省略任何重要信息。
      这一次的意图分析是上一次的补充以及更深入的分析。而不应该重复太多内容。
      `,
    },
    {
      role: "user",
      content: "开始意图分析，要全面，不要省略任何重要信息，最后的结果使用简单的markdown格式输出",
    },
  ];
  const response = await callOpenaiWithRetry(messages, selectedModel, apikey, baseUrl);
  return response;
};

export const getDeepQuestion = async (
  query,
  selectedModel,
  apikey,
  baseUrl,
  lastQuestion,
  relieaQuestion
) => {
  const messages = [
    {
      role: "system",
      content: `你是一个问题分析专家，你会从分析用户的原始问题，和对用户意图的解析，
      提出几个原子性问题，这些原子性问题可以作为搜索的依据，同时这些原子性问题要能覆盖用户意图，彼此之间不要有重复。
        原始问题:
        ${query}
  
        用户意图:
        ${relieaQuestion}

        上一轮问题:
        ${lastQuestion ? JSON.parse(lastQuestion) : []}

        要求：
        输出的只有输出格式要求的内容，不要输出其他内容。
        不要和上一轮的问题重复。如果新的问题补充，就返回空数组。
        输出的问题要以${query} 中的某个名词为主语。
        输出的问题需要简单，明了，不要过于复杂。
        输出的问题数量要在 2 - 3 个
        输出格式: ["问题1", "问题2", "问题3"]
        如果没有问题，请输出空数组
        `,
    },
    {
      role: "user",
      content:
        "开始生成问题，要严格遵循要求，不要省略任何重要信息。重点：不要和上一轮的问题重复。格式严格按照要求输出",
    },
  ];
  try {
    const response = await callOpenaiWithRetry(messages, selectedModel, apikey, baseUrl);

    const questionsArray = JSON.parse(response);
    return questionsArray;
  } catch (error) {
    console.error("生成问题失败:", error);
    return [];
  }
};

export const getDeepAnswer = async (
  query,
  previousResponse,
  document,
  selectedModel,
  apikey,
  baseUrl,
  relieaQuestion
) => {
  const messages = [
    {
      role: "system",
      content: `你是一个回答助手，你会根据用户的原始问题，以及当前用户的意图，和上一轮的回答，以及文档内容,给出最合适的回答
      出现的文章和链接都要是文中真实存在的，而不是虚构的，生成的问题要尽可能的覆盖用户意图，同时要全面，详细，不要省略任何重要信息和文章内容
      原始问题:
      ${query}


      用户意图:
      ${relieaQuestion}

      上一轮回答:
      ${previousResponse}

      文档内容:
      ${document}

      要求：
      输出的回答需要全面，不要省略任何重要信息，最后的结果使用简单的markdown格式输出
      出现的文章和链接都要是文中真实存在的，而不是虚构的
      `,
    },
    {
      role: "user",
      content:
        "开始回答，要全面，详细，不要省略任何重要信息，最后的结果使用简单的markdown格式输出，回答的时候文章都是文中真实存在的，而不是虚构的，以及即使出现链接的地方不应该是只有链接，还要有详细的讲解",
    },
  ];
  let response = await callOpenaiWithRetry(messages, selectedModel, apikey, baseUrl);
  if (response.startsWith("```") && response.endsWith("```")) {
    response = response.slice(1, -1);
  }
  return response;
};
