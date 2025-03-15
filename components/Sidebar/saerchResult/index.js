import { getAnswer, processDocument } from "../core/involve";
import { searchWebContent } from "../core/search";
import { createContext } from "../core/utils";
import { makeLayout, makePlan, relieaQuestion } from "./mankePlan";

const getUrl = async (questions, updateStatus) => {
  const safeQuestions = Array.isArray(questions) ? questions : [];

  const results = await Promise.all(
    safeQuestions.map((question) => searchWebContent(question, updateStatus))
  );

  return results;
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
  const context = createContext(query, apikey, baseUrl, depth, maxDepth, onStatusUpdate);

  const intentAnalysis = await relieaQuestion(query, selectedModel, apikey, baseUrl);

  const layout = await makeLayout(query, intentAnalysis, selectedModel, apikey, baseUrl);

  const plan = await makePlan(query, intentAnalysis, layout, selectedModel, apikey, baseUrl);

  const layoutArray = Object.values(layout).flat();
  const planArray = Object.values(plan);

  const resultArray = layoutArray.map((item, index) => {
    return {
      title: item,
      searchArray: planArray[index],
    };
  });

  // 使用 Promise.all 并行处理所有结果项
  const processResults = async (items) => {
    return Promise.all(
      items.map(async (item, index) => {
        const results = await getUrl(item.searchArray, context.updateStatus);
        console.log(results);

        if (results.length === 0) {
          return null;
        }
        console.log("开始搜索");
        // 并行处理文档
        const summary = await Promise.all(
          results.map((result) => {
            // 确保 result 是有效的数据
            if (!result) return Promise.resolve("");

            return processDocument(
              query,
              result,
              selectedModel,
              apikey,
              baseUrl,
              intentAnalysis,
              item.title
            );
          })
        );

        const validSummary = summary.filter((s) => s && typeof s === "string");

        if (validSummary.length === 0) return null;

        const response = await getAnswer(
          query,
          validSummary,
          selectedModel,
          apikey,
          baseUrl,
          intentAnalysis,
          item.title,
          index
        );
        return {
          response,
          index,
        };
      })
    );
  };

  const answers = await processResults(resultArray.filter((item) => item.searchArray.length > 0));
  const filteredAnswers = answers.filter((answer) => answer !== null && answer.response !== null);

  // 按照 index 排序
  const sortedAnswers = [...filteredAnswers].sort((a, b) => a.index - b.index);

  const answerString = sortedAnswers.map((answer) => answer.response).join("\n\n");
  return answerString;
};

export { getResponse };
