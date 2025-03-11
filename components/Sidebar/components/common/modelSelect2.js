import { useState, useEffect, useRef } from "react";
import { useSearchEngine } from "../../hooks/useSearchEngine";
import { setCurrentSearchSource } from "../../../../public/storage";
import { ChevronDown } from "lucide-react";

const ModelSelector2 = () => {
  const { getSearchSource, handleSearchSourceChange, getSearchSourceIcon, getSearchSourceName } =
    useSearchEngine();
  const [isOpen, setIsOpen] = useState(false);
  const [modelList, setModelList] = useState([]);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const initializeModelList = async () => {
      const models = getSearchSource();
      setModelList(models);
    };

    initializeModelList();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setIsOpen]);

  const handleModelSelect = (model) => {
    handleSearchSourceChange(model);
    setCurrentSearchSource(model.value);
  };

  const handleClick = () => {
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setIsOpen]);

  return (
    <div
      className="relative flex items-center flex-shrink-0"
      ref={dropdownRef}
      style={{ minWidth: "30%", maxWidth: "100%" }}
    >
      {isOpen && (
        <div className="absolute bottom-full left-0 mb-1 border border-gray-200 rounded-xl shadow-lg z-10 w-[170px] h-auto overflow-hidden bg-white">
          <div className="py-2">
            <ModelGroup
              setIsOpen={setIsOpen}
              models={modelList}
              onModelSelect={handleModelSelect}
            />
          </div>
        </div>
      )}
      <div
        onClick={handleClick}
        className={`flex items-center px-3 py-2
          rounded-xl 
          border border-indigo-300
          transition-all duration-200
          shadow-sm bg-indigo-500 text-white cursor-pointer hover:bg-indigo-400 hover:shadow-md active:scale-[0.98]`}
        style={{ width: "auto", maxWidth: "100%" }}
      >
        <span className="flex-shrink-0">{getSearchSourceIcon()}</span>
        <div className="overflow-hidden max-w-[100px]">
          <span className="text-sm ml-2 font-medium truncate block">{getSearchSourceName()}</span>
        </div>
        <ChevronDown className="w-4 h-4 ml-1 flex-shrink-0 text-white/80" />
      </div>
    </div>
  );
};

const ModelGroup = ({ models, onModelSelect, setIsOpen }) => {
  return (
    <>
      {models.map((model) => (
        <div
          key={model.name}
          className={`px-4 py-2 text-sm transition-all duration-200
                    hover:bg-indigo-50 flex items-center group  z-50 `}
          onClick={() => {
            onModelSelect(model);
            setIsOpen(false);
          }}
        >
          {model.selectIcon}
          <span className="group-hover:text-indigo-600 pl-4">{model.name}</span>
        </div>
      ))}
    </>
  );
};

export { ModelSelector2 };
