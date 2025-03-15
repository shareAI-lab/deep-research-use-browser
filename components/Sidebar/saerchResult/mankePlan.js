import { callOpenaiWithRetry } from "../core/callAi";

const parseResponseToObject = (response) => {
  try {
    return JSON.parse(response);
  } catch (error) {
    try {
      const jsonMatch = response.match(/```(?:json)?\s*({[\s\S]*?})\s*```/);
      if (jsonMatch && jsonMatch[1]) {
        return JSON.parse(jsonMatch[1]);
      }
      const possibleJsonMatch = response.match(/({[\s\S]*})/);
      if (possibleJsonMatch && possibleJsonMatch[1]) {
        return JSON.parse(possibleJsonMatch[1]);
      }

      console.warn("无法将响应解析为对象格式，返回原始响应");
      return { rawResponse: response };
    } catch (innerError) {
      console.error("解析响应时出错:", innerError);
      return { rawResponse: response, error: innerError.message };
    }
  }
};

export const relieaQuestion = async (query, selectedModel, apikey, baseUrl) => {
  const messages = [
    {
      role: "system",
      content:
        "你是一个问题分析专家，你会从分析用户的问题，理解用户的意图，给出用户意图的描述，意图包括用户想要了解的内容，用户想要解决的问题，用户想要获取的信息等",
    },
    {
      role: "user",
      content: `用户的问题是：${query}，请分析用户的问题，理解用户的意图，给出用户意图的描述，意图包括用户想要了解的内容，用户想要解决的问题，用户想要获取的信息等`,
    },
  ];
  const response = await callOpenaiWithRetry(messages, selectedModel, apikey, baseUrl);
  return response;
};

export const makeLayout = async (query, relieaQuestion, selectedModel, apikey, baseUrl) => {
  const messages = [
    {
      role: "system",
      content: `你是一个内容分析专家，你会分析用户提供的文章内容，提取关键信息，识别主题，总结要点，并给出深度见解。返回的结果为一个分析报告的结构。
      
      段落描述以及标题描述为该步骤需要突出的内容，请根据用户的问题以及意图分析，给出需要突出的内容

      返回的格式为：
      {
        "标题": "标题描述",
        "段落1": "段落描述（段落的内容 + 段落应该展现什么）",
        "段落2": "段落描述（段落的内容 + 段落应该展现什么）",
        "段落3": "段落描述（段落的内容 + 段落应该展现什么）",
        ...
      }
      要求：
      - 严格按照返回的格式返回，不要返回其他内容
      - 不同段落之间的内容和主题不能高度重复，应该是一篇文章的不同主题
      - 生成的段落之间不要有重复的内容
      `,
    },
    {
      role: "user",
      content: `用户的问题是：${query},意图是：${relieaQuestion},请分析相关内容，将意图分析和用户的问题生成为具体的文章拆分，描述的具体一些`,
    },
  ];
  const response = await callOpenaiWithRetry(messages, selectedModel, apikey, baseUrl);
  return parseResponseToObject(response);
};

export const makePlan = async (query, relieaQuestion, layout, selectedModel, apikey, baseUrl) => {
  const messages = [
    {
      role: "system",
      content: `你是一个搜索问题专家，你会根据用户的问题和文章布局，分析出每个布局部分需要进行搜索的内容。
      
      返回的格式为一个对象，每个键对应布局中的一个部分（标题或段落），值为该部分需要搜索的内容数组：
      {
        "标题": ["搜索内容1", "搜索内容2"],
        "段落1": ["搜索内容1", "搜索内容2", "搜索内容3"],
        "段落2": ["搜索内容1", "搜索内容2"],
        ...
      }
      
      - 注意：
      1. 请确保为布局中的每个部分都提供相关的搜索内容。
      2. 如果涉及到具体的网页，请搜索的时候添加具体的信息，如微博等网页
      `,
    },

    {
      role: "user",
      content: `用户的问题是：${query},意图是：${relieaQuestion}, 用户需要的文章排版：${layout}，请根据意图和布局格式，为每个布局部分提供相应的搜索内容，以便获取相关信息。`,
    },
  ];
  const response = await callOpenaiWithRetry(messages, selectedModel, apikey, baseUrl);
  return parseResponseToObject(response);
};
