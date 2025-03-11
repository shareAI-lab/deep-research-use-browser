import { extractUrls } from "./webSearch";
import { getSearchSourceStorage, setGetPageCount } from "../../../public/storage.js";

const buildWebSearchUrl = async (query, updateStatus) => {
  let searchSource = await getSearchSourceStorage();
  if (searchSource?.includes("zhihu.com")) {
    searchSource = "https://cn.bing.com/search?q=site%3A%2F%2Fzhihu.com%20";
  }
  const searchKey = query;
  return [`${searchSource}${encodeURIComponent(searchKey)}`];
};

const searchWeb = async (query, updateStatus) => {
  let searchSource = await getSearchSourceStorage();
  const searchUrls = await buildWebSearchUrl(query, updateStatus);
  if (
    searchSource?.includes("bing") ||
    searchSource?.includes("baidu") ||
    searchSource?.includes("zhihu.com")
  ) {
    try {
      const responses = await Promise.all(searchUrls.map((url) => fetch(url)));
      const htmlContents = await Promise.all(responses.map((response) => response.text()));
      return htmlContents;
    } catch (error) {
      console.error("搜索过程中发生错误:", error);
      throw error;
    }
  }
};

const getUrlLink = async (query, updateStatus) => {
  const searchHtmlContents = await searchWeb(query, updateStatus);
  if (!searchHtmlContents || searchHtmlContents.length === 0) {
    return [query];
  }
  const allLinks = await Promise.all(
    searchHtmlContents.map(async (html) => extractUrls(html))
  ).then((results) =>
    results
      .flat()
      .filter((link, index, self) => index === self.findIndex((l) => l.url === link.url))
  );
  return allLinks;
};

const searchWebContent = async (query, updateStatus) => {
  const allLinks = await getUrlLink(query, updateStatus);

  const extractResponse = await chrome.runtime.sendMessage({
    action: "extractMultipleContents",
    urls: allLinks.map((result) => result.url),
  });

  if (extractResponse.success) {
    await setGetPageCount(extractResponse.contents.length);
  }

  return extractResponse.contents;
};

export { searchWebContent };
