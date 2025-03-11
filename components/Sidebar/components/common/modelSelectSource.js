import { useSearchEngine } from "../../hooks/useSearchEngine";
import { useState } from "react";

const modelSelectSource = () => {
  const { searchSource, handleSearchSourceChange, getSearchSource } =
    useSearchEngine();
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleOptionClick = (value) => {
    handleSearchSourceChange(value);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <div onClick={toggleDropdown} style={{ cursor: "pointer" }}>
        {searchSource}
      </div>
      {isOpen && (
        <div className="absolute bottom-full mb-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 w-[200px] overflow-hidden">
          {getSearchSource().map((source) => (
            <div
              key={source.value}
              onClick={() => handleOptionClick(source.value)}
            >
              {source.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export { modelSelectSource };
