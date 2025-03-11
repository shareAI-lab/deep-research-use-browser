import { useState, useEffect } from "react";

const TypeWriter = ({ text, onComplete, isPulsing = false, instant = false }) => {
  const [displayText, setDisplayText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // 如果设置为即时显示，直接显示全部文本
    if (instant) {
      setDisplayText(text);
      setCurrentIndex(text.length);
      if (onComplete) {
        onComplete();
      }
      return;
    }

    // 否则使用打字机效果
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayText((prev) => prev + text[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
      }, 25);

      return () => clearTimeout(timer);
    } else if (onComplete) {
      onComplete();
    }
  }, [currentIndex, text, instant]);

  return (
    <span className={`whitespace-pre-wrap break-all ${isPulsing ? "animate-pulse" : ""}`}>
      {displayText}
    </span>
  );
};

export { TypeWriter };
