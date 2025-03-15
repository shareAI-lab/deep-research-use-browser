import { callOpenaiWithRetry } from "./callAi";
import { ensureString, safeJoin } from "./utils";

export const relieaQuestion = async (query, selectedModel, apikey, baseUrl) => {
  const messages = [
    {
      role: "system",
      content:
        "你是一个问题分析专家，你会从分析用户的问题，理解用户的意图，给出用户意图的描述，意图包括用户想要了解的内容，用户想要解决的问题，用户想要获取的信息等",
    },
    {
      role: "user",
      content: query,
    },
  ];
  const response = await callOpenaiWithRetry(messages, selectedModel, apikey, baseUrl);
  return response;
};

export const analyzeQuestions = async (query, selectedModel, apikey, baseUrl, relieaQuestion) => {
  const messages = [
    {
      role: "system",
      content: `你是一个问题分析专家，你会从分析用户的原始问题，和对用户意图的解析，提出几个原子性问题，这些原子性问题可以作为搜索的依据，同时这些原子性问题要能覆盖用户意图，彼此之间不要有重复。
      原始问题:
      ${query}

      用户意图:
      ${relieaQuestion}
      
      要求：
      输出的只有输出格式要求的内容，不要输出其他内容。
      输出的问题需要简单，明了，不要过于复杂。
      输出的问题数量要在 2 - 3 个
      输出格式: ["问题1", "问题2", "问题3"]
      如果没有问题，请输出空数组
      `,
    },
    {
      role: "user",
      content: `原始问题: ${query} \n 严格按照要求格式输出内容`,
    },
  ];
  const response = await callOpenaiWithRetry(messages, selectedModel, apikey, baseUrl);
  try {
    const questionsArray = JSON.parse(response);
    return questionsArray;
  } catch (error) {
    return [];
  }
};

export const processDocument = async (
  query,
  questions,
  selectedModel,
  apikey,
  baseUrl,
  relieaQuestion,
  title
) => {
  const document = questions
    .map((question, index) => {
      return `
    文档内容${index + 1}
    ${ensureString(question.content)}
    
    `;
    })
    .join("");
  const messages = [
    {
      role: "system",
      content: `你是一位精通文档处理的专家，擅长深度分析和内容优化。你的任务是：
      1. 仔细理解用户的问题和潜在意图
      2. 全面分析所提供的文档内容
      3. 提供极其详尽的润色内容
      
      请注意以下要求：
      - 生成的内容必须尽可能详尽，包含所有细节和重要信息
      - 保留文档中的所有核心观点、事实和数据
      - 扩展解释关键概念，提供更多上下文和背景信息
      - 使用丰富的例子和场景来说明重要观点
      - 确保所有提到的文章、引用和链接都是文档中真实存在的，绝不虚构
      - 尽可能探索文档中提到的每个主题的多个方面和维度
      - 对复杂概念提供更深入的分析
      - 回答应当结构清晰但内容丰富，段落充实

      ${title ? `当前你要生成的段落是: ${title}` : ""}

      原始问题:
      ${query}

      用户意图:
      ${relieaQuestion}
      
      文档内容:
      ${document}
    `,
    },
    {
      role: "user",
      content: `请开始全面润色文档。我需要一个极其详尽的回答，包含所有重要信息和细节，不要简化或省略任何关键内容。请确保：
      1. 扩展所有重要概念和观点
      2. 提供丰富的上下文和背景
      3. 探索每个主题的多个方面
      4. 使用文档中真实存在的引用和例子
      5. 回答长度应当充分展开，尽可能详尽
      请使用清晰的markdown格式输出最终结果，包括适当的标题、列表和强调。`,
    },
  ];

  const response = await callOpenaiWithRetry(messages, selectedModel, apikey, baseUrl);
  return response;
};

export const getAnswer = async (
  query,
  summary,
  selectedModel,
  apikey,
  baseUrl,
  relieaQuestion,
  title,
  index
) => {
  console.log(index);
  console.log(title);
  const messages = [
    {
      role: "system",
      content: `你是一个专业的知识回答助手，你的回答需要极其全面、深入且有实质内容。基于以下信息提供详尽解答：
      ${title ? `当前你要生成的段落是名称以及段落的具体内容是: ${title}` : ""}

      ${
        index
          ? `当前你要生成的段落是第${index}个段落，保证最高级的标题是二级标题，且所有标题都是以当前段落数量开头的`
          : ""
      }


      搜索到的文档内容:
      ${safeJoin(summary)}

      回答要求：
      1. 提供极其详尽的内容，包含所有相关细节和重要信息
      2. 深入分析每个相关概念，提供多角度的解释
      3. 使用丰富的例子、场景和应用来说明关键点
      4. 确保所有引用的文章、链接都是文档中真实存在的，绝不虚构
      5. 对复杂概念提供层次化的解释，从基础到高级
      6. 探讨主题的多个维度，包括优缺点、历史背景、实际应用等
      7. 回答应当结构清晰但内容丰富，每个段落都应包含充实的信息
      8. 避免无意义的废话和空洞的表述，每句话都应有实质性内容
      9. 适当使用专业术语并提供解释，展示深度专业知识
      10. 回答长度应当充分，确保覆盖所有重要方面`,
    },
    {
      role: "user",
      content: `请提供一个极其详尽的回答，内容必须：
      
      1. 全面覆盖所有相关信息，不遗漏任何重要细节
      2. 深入解析每个关键概念和观点
      3. 提供具体的例子、应用场景和实际案例
      4. 引用文档中真实存在的内容，不添加虚构信息
      5. 使用清晰的markdown格式，包括适当的标题、列表和强调
      6. 确保每个段落都包含丰富且有价值的信息
      7. 避免重复和冗余，每句话都应有新的信息点
      8. 回答应当足够长，确保全面解答用户问题
      
      请开始你的详尽回答。`,
    },
  ];
  let response = await callOpenaiWithRetry(messages, selectedModel, apikey, baseUrl);
  if (response.startsWith("```") && response.endsWith("```")) {
    response = response.slice(3, -3);
  }

  return response;
};
