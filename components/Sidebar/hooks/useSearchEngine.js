import { useState, useEffect } from "react";
import { BsBing } from "react-icons/bs";
import { SiZhihu, SiBaidu } from "react-icons/si";
import {
  setSearchSourceStorage,
  getCurrentSearchSource as getCurrentSearchSourceStorage,
} from "../../../public/storage";

const SEARCH_SOURCES = [
  {
    name: "Bing",
    desc: "微软搜索引擎",
    value: "bing",
    icon: <BsBing className="text-white" />,
    selectIcon: <BsBing className="text-[#6366f1]" />,
    searchUrl: "https://www.bing.com/search?q=",
    isCheck: false,
  },
  {
    name: "百度",
    desc: "中文搜索引擎",
    value: "baidu",
    icon: <SiBaidu className="text-white" />,
    selectIcon: <SiBaidu className="text-[#6366f1]" />,
    searchUrl: "https://www.baidu.com/s?wd=",
    isCheck: false,
  },
  {
    name: "知乎",
    desc: "中文搜索引擎",
    value: "zhihu",
    icon: <SiZhihu className="text-white" />,
    selectIcon: <SiZhihu className="text-[#6366f1]" />,
    searchUrl: "https://www.zhihu.com/search?type=content&q=",
    isCheck: true,
  },
];

const useSearchEngine = () => {
  const [searchSource, setSearchSource] = useState("");

  useEffect(() => {
    const savedSource = async () => {
      const savedSource = await getCurrentSearchSourceStorage();
      setSearchSource(savedSource || "bing");
    };
    savedSource();
  }, []);

  const getCurrentSearchSource = () =>
    SEARCH_SOURCES.find((source) => source.value === searchSource)?.searchUrl ??
    SEARCH_SOURCES[0].searchUrl;

  const getSearchSource = () => SEARCH_SOURCES;

  const handleSearchSourceChange = async (source) => {
    setSearchSource(source.value);
    await setSearchSourceStorage(source.searchUrl);
  };
  const getSearchSourceIcon = () => {
    const searchSourceIcon = SEARCH_SOURCES.find((source) => source.value === searchSource);
    return searchSourceIcon?.icon;
  };

  const getSearchSourceName = () => {
    const searchSourceName = SEARCH_SOURCES.find((source) => source.value === searchSource);
    return searchSourceName?.name;
  };
  return {
    setSearchSource,
    searchSource,
    handleSearchSourceChange,
    getCurrentSearchSource,
    getSearchSource,
    getSearchSourceIcon,
    getSearchSourceName,
  };
};

export { useSearchEngine };
