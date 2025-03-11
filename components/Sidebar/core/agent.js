import { searchWebContent } from "./search";
import { createContext } from "./utils";
import { relieaQuestion, analyzeQuestions, processDocument, getAnswer } from "./involve";
import { getDeepAnalysis, getDeepQuestion, getDeepAnswer } from "./deepInvolve";
import { check, getSimpleResponse } from "./check";
const getUrl = async (questions, updateStatus) => {
  const promise = questions.map(async (question) => {
    const results = await searchWebContent(question, updateStatus);
    return results;
  });
  const results = await Promise.all(promise);
  return results;
};

const getDeepResponse = async (
  query,
  depth,
  maxDepth,
  selectedModel,
  apikey,
  baseUrl,
  previousResponse,
  lastQuestion,
  onStatusUpdate,
  abortSignal
) => {
  const checkAbort = () => {
    if (abortSignal?.aborted) {
      throw new Error("已终止");
    }
  };

  onStatusUpdate(`开始深度分析`);
  checkAbort();
  const deepAnalysis = await getDeepAnalysis(
    query,
    previousResponse,
    lastQuestion,
    selectedModel,
    apikey,
    baseUrl
  );
  checkAbort();

  onStatusUpdate(`开始生成深度问题`);
  checkAbort();
  const deepQuestionArray = await getDeepQuestion(
    query,
    selectedModel,
    apikey,
    baseUrl,
    lastQuestion,
    deepAnalysis
  );
  checkAbort();

  if (deepQuestionArray.length === 0) {
    return previousResponse;
  }

  deepQuestionArray.map((question) => {
    onStatusUpdate(`搜索问题：${question}`);
    checkAbort();
  });

  onStatusUpdate(`开始AI洞察分析`);
  checkAbort();

  const results = await getUrl(deepQuestionArray, onStatusUpdate);
  checkAbort();

  if (results.length === 0) {
    return previousResponse;
  }

  onStatusUpdate(`开始思考深度问题`);
  checkAbort();
  const document = results.map(async (result) => {
    checkAbort();
    return await processDocument(query, result, selectedModel, apikey, baseUrl, deepAnalysis);
  });

  const summary = await Promise.all(document);
  checkAbort();

  onStatusUpdate(`开始生成深层次回答`);
  checkAbort();
  const answer = await getDeepAnswer(
    query,
    previousResponse,
    summary,
    selectedModel,
    apikey,
    baseUrl,
    deepAnalysis
  );
  checkAbort();

  onStatusUpdate(`深层次回答生成完成`);
  if (depth < maxDepth - 1) {
    return getDeepResponse(
      query,
      depth + 1,
      maxDepth,
      selectedModel,
      apikey,
      baseUrl,
      answer,
      JSON.stringify(deepQuestionArray),
      onStatusUpdate,
      abortSignal
    );
  }

  return answer;
};

const getResponse = async (
  query,
  depth = 0,
  maxDepth = 1,
  selectedModel,
  apikey,
  baseUrl,
  onStatusUpdate,
  abortSignal
) => {
  try {
    const context = createContext(query, apikey, baseUrl, depth, maxDepth, onStatusUpdate);

    const checkAbort = () => {
      if (abortSignal?.aborted) {
        throw new Error("已终止");
      }
    };

    context.updateStatus(`开始分析问题: ${query}`);
    checkAbort();

    const isSimpleQuestion = await check(query, selectedModel, apikey, baseUrl);

    if (isSimpleQuestion) {
      const simpleResponse = await getSimpleResponse(query, selectedModel, apikey, baseUrl);
      return simpleResponse;
    }

    context.updateStatus(`深入思考问题: ${query}`);
    checkAbort();

    const question = await relieaQuestion(query, selectedModel, apikey, baseUrl);
    checkAbort();
    const questions = await analyzeQuestions(query, selectedModel, apikey, baseUrl, question);
    checkAbort();
    if (questions.length === 0) {
      return "### 分析问题失败 \n ##### 请检查您的问题，尝试重新提问 \n ##### 请检查网络链接 \n ##### 请尝试更换模型 \n ##### 如果您觉得这是一个bug，请在设置关于里反馈给我们";
    }
    questions.map((question) => {
      context.updateStatus(`搜索问题：${question}`);
      checkAbort();
    });

    const results = await getUrl(questions, context.updateStatus);
    checkAbort();

    if (results.length === 0) {
      return "### 没有搜索到相关的信息 \n #### 请检查您的问题是否太过于简单 \n #### 请尝试更换模型 \n #### 如果您觉得这是一个bug，请在设置里反馈给我们";
    }

    context.updateStatus(`开始思考问题`);
    checkAbort();

    const document = results.map(async (result) => {
      checkAbort();
      return await processDocument(query, result, selectedModel, apikey, baseUrl, question);
    });

    const summary = await Promise.all(document);
    checkAbort();

    context.updateStatus(`处理问题完成`);
    checkAbort();

    context.updateStatus(`开始生成初步回答`);
    const answer = await getAnswer(query, summary, selectedModel, apikey, baseUrl, question);
    checkAbort();

    context.updateStatus(`生成初步回答完成`);

    if (depth === maxDepth - 1) {
      return answer;
    } else {
      const questionsJson = JSON.stringify(questions);
      return getDeepResponse(
        query,
        depth + 1,
        maxDepth,
        selectedModel,
        apikey,
        baseUrl,
        answer,
        questionsJson,
        context.updateStatus,
        abortSignal
      );
    }
  } catch (error) {
    if (error.name === "AbortError" || error.message === "已终止") {
      throw new Error("已终止");
    }
    console.error("响应生成过程中发生错误:", error);
    throw error;
  }
};

export { getResponse };
