import {
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
} from "docx";
import { saveAs } from "file-saver";
import { motion } from "framer-motion";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Copy, FileText, MessageSquarePlus, Save } from "lucide-react";
import MarkdownIt from "markdown-it";
import MarkdownItDeflist from "markdown-it-deflist";
import MarkdownItFootnote from "markdown-it-footnote";
import MarkdownItMark from "markdown-it-mark";
import MarkdownItSub from "markdown-it-sub";
import MarkdownItSup from "markdown-it-sup";
import { marked } from "marked";
import { useCallback, useEffect, useRef, useState } from "react";
import { Tooltip } from "react-tooltip";

const className = `text-sm text-black break-words leading-relaxed prose overflow-wrap break-word 
    prose-p:leading-6 prose-p:pb-0 prose-p:mb-0  prose-p:text-black
    prose-hr:hidden prose-hr:border-none prose-hr:m-0
    prose-h1:mb-3 prose-h1:mt-3 prose-h1:text-black prose-h1:text-[24px]
    prose-h2:mb-3 prose-h2:mt-3 prose-h2:text-black prose-h2:text-[22px]
    prose-h3:mb-2 prose-h3:mt-2 prose-h3:text-black  prose-h3:text-[20px]
    prose-h4:text-black prose-h4:mb-2 prose-h4:mt-2 prose-h4:text-[18px]
    prose-h5:text-black prose-h5:mb-2 prose-h5:mt-2 prose-h5:text-[16px]
    prose-h6:text-black prose-h6:mb-2 prose-h6:mt-2 prose-h6:text-[14px]
    prose-ul:list-decimal prose-ul:text-black prose-ul:mb-0 prose-ul:leading-6
    prose-ol:mb-0 prose-ol:text-black prose-ol:list-decimal prose-ol:pl-6 prose-li:text-black prose-li:mb-0 prose-li:leading-6
    prose-pre:before:content-none prose-pre:after:content-none prose-pre:rounded-md prose-pre:overflow-auto prose-pre:bg-transparent
    prose-code:text-black prose-code:bg-gray-200 prose-code:p-2 prose-code:rounded-md prose-code:overflow-auto 
    prose-blockquote:font-medium prose-blockquote:italic prose-blockquote:text-[var(--tw-prose-quotes)] prose-blockquote:border-l-[0.25rem] 
    prose-blockquote:border-l-[var(--tw-prose-quote-borders)] prose-blockquote:mt-6 prose-blockquote:mb-6 prose-blockquote:pl-4
    prose-table:mt-4 prose-table:mb-4 prose-table:w-full prose-table:overflow-hidden prose-table:border-collapse prose-table:border prose-table:border-gray-300
    prose-th:py-2 prose-th:px-4 prose-th:border prose-th:border-gray-300 prose-th:bg-gray-100 prose-th:text-left
    prose-td:py-2 prose-td:px-4 prose-td:border prose-td:border-gray-300 
    prose-tr:py-2 prose-tr:px-4 prose-tr:border prose-tr:border-gray-300`;

const ActionButtons = ({
  messages,
  setQuery,
  setMessages,
  setIsDeepThingActive,
  setShowTextArea,
}) => {
  const handleExportPDF = async () => {
    try {
      const userQuestion = messages[messages.length - 2]?.content || "对话记录";
      const content = messages[messages.length - 1].content;

      const trimmedContent =
        content.startsWith("```") && content.endsWith("```")
          ? content.slice(3, -3).trim()
          : content;

      const pdf = new jsPDF("p", "mm", "a4");

      const pageWidth = 210;
      const pageHeight = 115; // 修正A4纸高度为297mm而非700mm
      const margins = {
        top: 20,
        bottom: 20,
        left: 20,
        right: 20,
      };

      const contentWidth = pageWidth - margins.left - margins.right;
      const contentHeight = pageHeight - margins.top - margins.bottom;

      // 创建临时div的纯函数
      const createTempDiv = () => {
        const div = document.createElement("div");
        div.className = `markdown-body pdf-content ${className}`;
        Object.assign(div.style, {
          width: `${contentWidth}mm`,
          padding: "0",
          margin: "0",
          backgroundColor: "#ffffff",
          position: "fixed",
          left: "-9999px",
          top: 0,
          fontSize: "14px",
          lineHeight: "1.6",
          color: "#000000",
        });
        return div;
      };

      const tempDiv = createTempDiv();
      const parsedContent = marked.parse(trimmedContent);

      // 提取标题和内容元素的纯函数
      const extractContentElements = (htmlContent, defaultTitle) => {
        const container = document.createElement("div");
        container.innerHTML = htmlContent;

        const h1Element = container.querySelector("h1");
        const title = h1Element ? h1Element.textContent : defaultTitle;

        if (h1Element) h1Element.remove();

        return {
          title,
          elements: Array.from(container.children),
        };
      };

      const { title: extractedTitle, elements: contentElements } = extractContentElements(
        parsedContent,
        userQuestion
      );

      // 分页处理函数
      const processPage = async (elements, isFirstPage = false) => {
        // 每次创建新的临时div以避免状态累积
        const pageDiv = createTempDiv();
        document.body.appendChild(pageDiv);

        // 如果是第一页，添加标题
        if (isFirstPage) {
          const titleHtml = `
            <div style="margin-bottom: 2rem; text-align: center;">
              <h1 style="color: #000000; margin: 0; font-weight: 600;">${extractedTitle}</h1>
            </div>
          `;
          pageDiv.insertAdjacentHTML("beforeend", titleHtml);
        }

        // 添加内容元素
        elements.forEach((el) => {
          const wrapper = document.createElement("div");
          wrapper.style.cssText = "margin-bottom: 1rem; color: #000000;";
          wrapper.appendChild(el.cloneNode(true));
          pageDiv.appendChild(wrapper);
        });

        // 渲染页面
        const canvas = await html2canvas(pageDiv, {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
          width: pageDiv.offsetWidth,
          height: pageDiv.offsetHeight,
          windowWidth: pageDiv.offsetWidth,
          windowHeight: pageDiv.offsetHeight,
        });

        // 使用后立即移除以避免DOM污染
        document.body.removeChild(pageDiv);

        return canvas;
      };

      const paginateContent = async (elements) => {
        const maxHeight = contentHeight * 3;
        const pxToMm = (px) => px * 0.264583;

        // 使用reduce代替命令式循环，更符合函数式编程风格
        return elements
          .reduce(
            async (accPromise, element) => {
              const acc = await accPromise;
              const { pages, currentPageElements, currentHeight, currentPage } = acc;

              // 测量元素高度
              const measureDiv = createTempDiv();
              document.body.appendChild(measureDiv);

              const wrapper = document.createElement("div");
              wrapper.style.cssText = "margin-bottom: 1rem; color: #000000;";
              wrapper.appendChild(element.cloneNode(true));
              measureDiv.appendChild(wrapper);

              const elementHeight = pxToMm(measureDiv.offsetHeight);
              document.body.removeChild(measureDiv);

              // 判断是否需要新页
              if (currentPageElements.length > 0 && currentHeight + elementHeight > maxHeight) {
                // 当前页满了，创建新页
                return {
                  pages: [
                    ...pages,
                    { elements: currentPageElements, isFirstPage: currentPage === 0 },
                  ],
                  currentPageElements: [element],
                  currentHeight: elementHeight,
                  currentPage: currentPage + 1,
                };
              } else if (elementHeight > maxHeight && currentPageElements.length === 0) {
                // 特大元素单独一页
                return {
                  pages: [...pages, { elements: [element], isFirstPage: currentPage === 0 }],
                  currentPageElements: [],
                  currentHeight: 0,
                  currentPage: currentPage + 1,
                };
              } else {
                // 添加到当前页
                return {
                  pages,
                  currentPageElements: [...currentPageElements, element],
                  currentHeight: currentHeight + elementHeight,
                  currentPage,
                };
              }
            },
            Promise.resolve({
              pages: [],
              currentPageElements: [],
              currentHeight: 0,
              currentPage: 0,
            })
          )
          .then(({ pages, currentPageElements, currentPage }) => {
            // 处理最后一页
            return currentPageElements.length > 0
              ? [...pages, { elements: currentPageElements, isFirstPage: currentPage === 0 }]
              : pages;
          });
      };

      // 优化PDF渲染部分
      const renderPdfPages = async (pages) => {
        // 使用Promise.all并行处理所有页面渲染
        const canvases = await Promise.all(
          pages.map(({ elements, isFirstPage }) => processPage(elements, isFirstPage))
        );

        // 添加所有页面到PDF
        canvases.forEach((canvas, i) => {
          if (i > 0) {
            pdf.addPage();
          }

          const imgData = canvas.toDataURL("image/png");
          pdf.addImage(
            imgData,
            "PNG",
            margins.left,
            margins.top,
            contentWidth,
            (canvas.height * contentWidth) / canvas.width,
            null,
            "FAST"
          );
        });

        return pdf;
      };

      // 执行分页并渲染
      const pages = await paginateContent(contentElements);
      await renderPdfPages(pages);

      pdf.save(`${extractedTitle}_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error("PDF导出失败:", err);
      alert("PDF导出失败: " + err.message);
    } finally {
      // 清理临时元素
      const tempElements = document.querySelectorAll(".pdf-content");
      tempElements.forEach((el) => {
        if (el && el.parentNode) {
          el.parentNode.removeChild(el);
        }
      });
    }
  };

  const handleCopyContent = () => {
    const content = messages[messages.length - 1].content;
    navigator.clipboard.writeText(content);
  };

  const handleNewChat = () => {
    setQuery("");
    setMessages([]);
    setShowTextArea(false);
    setIsDeepThingActive(false);
  };

  const handleExportDocx = async () => {
    try {
      const content = messages[messages.length - 1].content;

      // 初始化 markdown-it 及其插件
      const md = new MarkdownIt({
        html: true,
        xhtmlOut: true,
        breaks: true,
        linkify: true,
        typographer: true,
      })
        .use(MarkdownItSub)
        .use(MarkdownItSup)
        .use(MarkdownItFootnote)
        .use(MarkdownItDeflist)
        .use(MarkdownItMark);

      // 将 Markdown 转换为 HTML
      const htmlContent = md.render(content);

      // 使用已定义的 convertMarkdownToDocx 函数
      const doc = convertMarkdownToDocx(content);

      // 使用 Blob 方式导出，适用于浏览器环境
      Packer.toBlob(doc).then((blob) => {
        saveAs(blob, `Super2BrainAI-洞察分析${new Date().toISOString().slice(0, 10)}.docx`);
      });
    } catch (err) {
      console.error("Word文档导出失败:", err);
      alert("Word文档导出失败: " + err.message);
    }
  };

  // 将 Markdown 转换为 DOCX 文档结构
  const convertMarkdownToDocx = (markdown) => {
    // 创建一个临时 DOM 元素来解析 HTML
    const parser = new DOMParser();
    const md = new MarkdownIt({
      html: true,
      xhtmlOut: true,
      breaks: true,
      linkify: true,
      typographer: true,
    })
      .use(MarkdownItSub)
      .use(MarkdownItSup)
      .use(MarkdownItFootnote)
      .use(MarkdownItDeflist)
      .use(MarkdownItMark);

    // 将 Markdown 转换为 HTML
    const htmlContent = md.render(markdown);
    const doc = parser.parseFromString(htmlContent, "text/html");

    // 创建 docx 文档
    return new Document({
      sections: [
        {
          properties: {},
          children: [...parseHtmlNodes(doc.body)],
        },
      ],
    });
  };

  // 递归解析 HTML 节点并转换为 docx 元素
  const parseHtmlNodes = (parentNode) => {
    const elements = [];

    // 使用函数式方法处理子节点
    Array.from(parentNode.childNodes).forEach((node) => {
      // 根据节点类型处理
      switch (node.nodeType) {
        case Node.ELEMENT_NODE:
          elements.push(...handleElementNode(node));
          break;
        case Node.TEXT_NODE:
          if (node.textContent.trim()) {
            elements.push(
              new Paragraph({
                children: [new TextRun({ text: node.textContent.trim() })],
              })
            );
          }
          break;
      }
    });

    return elements;
  };

  // 处理元素节点
  const handleElementNode = (node) => {
    const tagName = node.tagName.toLowerCase();

    // 使用函数式编程的模式匹配处理不同类型的标签
    const handlers = {
      h1: () => [createHeading(node.textContent, HeadingLevel.HEADING_1)],
      h2: () => [createHeading(node.textContent, HeadingLevel.HEADING_2)],
      h3: () => [createHeading(node.textContent, HeadingLevel.HEADING_3)],
      h4: () => [createHeading(node.textContent, HeadingLevel.HEADING_4)],
      h5: () => [createHeading(node.textContent, HeadingLevel.HEADING_5)],
      h6: () => [createHeading(node.textContent, HeadingLevel.HEADING_6)],
      p: () => [createParagraph(node)],
      ul: () => createList(node, false),
      ol: () => createList(node, true),
      blockquote: () => createBlockquote(node),
      pre: () => [createCodeBlock(node)],
      code: () => [createInlineCode(node)],
      table: () => [createTable(node)],
      default: () => parseHtmlNodes(node),
    };

    // 使用函数式的方式获取处理函数
    const handler = handlers[tagName] || handlers["default"];
    return handler();
  };

  // 创建标题
  const createHeading = (text, level) => {
    const baseStyles = {
      color: "000000", // 黑色
      bold: true,
      size: 28, // 基础字号
    };

    // 根据不同级别设置不同的样式
    const levelStyles = {
      [HeadingLevel.HEADING_1]: {
        ...baseStyles,
        size: 32,
        alignment: "center", // 一级标题居中
        spacing: { before: 400, after: 200 }, // 更大的间距
      },
      [HeadingLevel.HEADING_2]: {
        ...baseStyles,
        size: 28,
        spacing: { before: 360, after: 180 },
      },
      [HeadingLevel.HEADING_3]: {
        ...baseStyles,
        size: 26,
        spacing: { before: 320, after: 160 },
      },
      [HeadingLevel.HEADING_4]: {
        ...baseStyles,
        size: 24,
        spacing: { before: 280, after: 140 },
      },
      [HeadingLevel.HEADING_5]: {
        ...baseStyles,
        size: 22,
        spacing: { before: 240, after: 120 },
      },
      [HeadingLevel.HEADING_6]: {
        ...baseStyles,
        size: 20,
        spacing: { before: 200, after: 100 },
      },
    };

    const style = levelStyles[level];

    return new Paragraph({
      children: [
        new TextRun({
          text: text,
          ...style,
        }),
      ],
      heading: level,
      spacing: style.spacing,
      alignment: style.alignment,
    });
  };

  // 创建段落
  const createParagraph = (node) => {
    return new Paragraph({
      children: Array.from(node.childNodes).flatMap((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          return [new TextRun({ text: child.textContent })];
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          // 处理内联元素
          const tagName = child.tagName.toLowerCase();
          if (tagName === "strong" || tagName === "b") {
            return [new TextRun({ text: child.textContent, bold: true })];
          } else if (tagName === "em" || tagName === "i") {
            return [new TextRun({ text: child.textContent, italics: true })];
          } else if (tagName === "code") {
            return [new TextRun({ text: child.textContent, font: "Courier New" })];
          } else {
            return [new TextRun({ text: child.textContent })];
          }
        }
        return [];
      }),
      spacing: { after: 120 },
    });
  };

  // 创建列表
  const createList = (node, isOrdered) => {
    const listItems = Array.from(node.querySelectorAll("li"));

    return listItems.map((item, index) => {
      const prefix = isOrdered ? `${index + 1}. ` : "• ";

      return new Paragraph({
        children: [
          new TextRun({ text: prefix }),
          ...Array.from(item.childNodes).flatMap((child) => {
            if (child.nodeType === Node.TEXT_NODE) {
              return [new TextRun({ text: child.textContent })];
            } else if (child.nodeType === Node.ELEMENT_NODE) {
              const tagName = child.tagName.toLowerCase();
              const textContent = child.textContent;

              const formatMap = {
                strong: () => [new TextRun({ text: textContent, bold: true })],
                b: () => [new TextRun({ text: textContent, bold: true })],
                em: () => [new TextRun({ text: textContent, italics: true })],
                i: () => [new TextRun({ text: textContent, italics: true })],
                code: () => [new TextRun({ text: textContent, font: "Courier New" })],
                default: () => [new TextRun({ text: textContent })],
              };

              return (formatMap[tagName] || formatMap["default"])();
            }
            return [];
          }),
        ],
        indent: { left: 720, hanging: 360 },
        spacing: { after: 120 },
      });
    });
  };

  // 创建引用块
  const createBlockquote = (node) => {
    return Array.from(node.childNodes).flatMap((child) => {
      if (child.nodeType === Node.ELEMENT_NODE && child.tagName.toLowerCase() === "p") {
        return [
          new Paragraph({
            children: [new TextRun({ text: child.textContent, italics: true })],
            indent: { left: 720 },
            spacing: { after: 120 },
            border: {
              left: { style: BorderStyle.SINGLE, size: 4, color: "AAAAAA" },
            },
            shading: { type: "clear", fill: "F5F5F5" },
          }),
        ];
      } else if (child.nodeType === Node.TEXT_NODE && child.textContent.trim()) {
        return [
          new Paragraph({
            children: [new TextRun({ text: child.textContent.trim(), italics: true })],
            indent: { left: 720 },
            spacing: { after: 120 },
            border: {
              left: { style: BorderStyle.SINGLE, size: 4, color: "AAAAAA" },
            },
            shading: { type: "clear", fill: "F5F5F5" },
          }),
        ];
      }
      return [];
    });
  };

  // 创建代码块
  const createCodeBlock = (node) => {
    const codeText = node.textContent;
    const codeLines = codeText.split("\n").map((line) => line);

    // 创建一个单行单列的外部表格作为容器
    return new Table({
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: [
                // 在单元格内创建段落，每行代码一个段落
                ...codeLines.map(
                  (line) =>
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: line,
                          font: "Consolas",
                          size: 22,
                          preserveSpace: true,
                          color: "333333",
                        }),
                      ],
                      spacing: { before: 20, after: 20 },
                    })
                ),
              ],
              margins: {
                top: 30,
                bottom: 30,
                left: 100,
                right: 100,
              },
            }),
          ],
        }),
      ],
      width: { size: 100, type: "pct" },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC" },
        bottom: { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC" },
        left: { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC" },
        right: { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC" },
      },
      shading: { type: "clear", fill: "F8F8F8" },
    });
  };

  // 创建内联代码
  const createInlineCode = (node) => {
    return new Paragraph({
      children: [
        new TextRun({
          text: node.textContent,
          font: "Consolas",
          size: 20,
          color: "333333",
          shading: { type: "clear", fill: "F8F8F8" },
        }),
      ],
      spacing: { after: 80 },
    });
  };

  // 创建表格
  const createTable = (node) => {
    const rows = Array.from(node.querySelectorAll("tr"));

    // 提取表头行
    const headerRow = rows[0];
    const headerCells = headerRow ? Array.from(headerRow.querySelectorAll("th")) : [];

    // 提取数据行
    const dataRows = rows.slice(headerCells.length > 0 ? 1 : 0);

    // 确定列数
    const columnCount = Math.max(
      headerCells.length,
      ...dataRows.map((row) => Array.from(row.querySelectorAll("td")).length)
    );

    // 创建表格
    return new Table({
      rows: [
        // 表头行
        ...(headerCells.length > 0
          ? [
              new TableRow({
                children: [
                  ...headerCells.map(
                    (cell) =>
                      new TableCell({
                        children: [
                          new Paragraph({
                            text: cell.textContent.trim(),
                            alignment: "center",
                            spacing: { before: 60, after: 60 },
                          }),
                        ],
                        shading: { type: "clear", fill: "F5F5F5" },
                        verticalAlign: "center",
                        margins: { top: 40, bottom: 40, left: 60, right: 60 },
                      })
                  ),
                  // 填充缺失的单元格
                  ...Array(columnCount - headerCells.length).fill(
                    new TableCell({
                      children: [new Paragraph({ text: "" })],
                      shading: { type: "clear", fill: "E6E6E6" },
                    })
                  ),
                ],
                tableHeader: true,
              }),
            ]
          : []),

        ...dataRows.map((row, rowIndex) => {
          const cells = Array.from(row.querySelectorAll("td"));

          return new TableRow({
            children: [
              ...cells.map(
                (cell) =>
                  new TableCell({
                    children: [
                      new Paragraph({
                        text: cell.textContent.trim(),
                        spacing: { before: 40, after: 40 },
                      }),
                    ],
                    margins: { top: 30, bottom: 30, left: 40, right: 40 },
                  })
              ),
              // 填充缺失的单元格
              ...Array(columnCount - cells.length).fill(
                new TableCell({
                  children: [new Paragraph({ text: "" })],
                  shading: {
                    type: "clear",
                    fill: rowIndex % 2 === 0 ? "FFFFFF" : "F9F9F9",
                  },
                })
              ),
            ],
          });
        }),
      ],
      width: {
        size: 100,
        type: "pct",
      },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 0.5, color: "E0E0E0" },
        bottom: { style: BorderStyle.SINGLE, size: 0.5, color: "E0E0E0" },
        left: { style: BorderStyle.SINGLE, size: 0.5, color: "E0E0E0" },
        right: { style: BorderStyle.SINGLE, size: 0.5, color: "E0E0E0" },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 0.5, color: "E0E0E0" },
        insideVertical: { style: BorderStyle.SINGLE, size: 0.5, color: "E0E0E0" },
      },
      margins: {
        top: 80,
        bottom: 80,
      },
      alignment: "center",
    });
  };

  // 使用useEffect和useRef测量并响应容器宽度
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef(null);

  useEffect(() => {
    // 创建ResizeObserver以监听容器宽度变化
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        resizeObserver.disconnect();
      }
    };
  }, []);

  // 根据容器宽度确定布局方式
  const isNarrow = containerWidth > 0 && containerWidth < 450;

  // 获取按钮样式，根据宽度调整
  const getButtonStyle = useCallback(
    (delay) => ({
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.3, delay },
      className: `flex items-center gap-2 ${
        isNarrow ? "px-2" : "px-4"
      } py-2 text-sm font-medium text-gray-700 
      bg-indigo-50 border border-indigo-100 rounded-lg hover:bg-indigo-100 
      hover:text-indigo-600 transition-colors ${isNarrow ? "flex-1 justify-center" : ""}`,
    }),
    [isNarrow]
  );

  return (
    <div
      ref={containerRef}
      className={`flex ${isNarrow ? "flex-wrap" : ""} items-center gap-2 px-2`}
    >
      {messages.length > 0 && (
        <>
          <motion.button
            {...getButtonStyle(0.1)}
            onClick={handleNewChat}
            data-tooltip-id="new-chat-tooltip"
            data-tooltip-content="开始新的AI洞察分析"
          >
            <MessageSquarePlus className="w-4 h-4" />
            {!isNarrow && "新对话"}
          </motion.button>
          <Tooltip id="new-chat-tooltip" place="top" className="rounded-lg" />
        </>
      )}

      <>
        <motion.button
          {...getButtonStyle(0.2)}
          onClick={handleExportPDF}
          data-tooltip-id="save-pdf-tooltip"
          data-tooltip-content="保存为pdf文件"
        >
          <Save className="w-4 h-4" />
          {!isNarrow ? "保存PDF" : "PDF"}
        </motion.button>
        <Tooltip id="save-pdf-tooltip" place="top" className="rounded-lg" />
      </>

      <>
        <motion.button
          {...getButtonStyle(0.3)}
          onClick={handleCopyContent}
          data-tooltip-id="copy-content-tooltip"
          data-tooltip-content="复制内容到剪贴板"
        >
          <Copy className="w-4 h-4" />
          {!isNarrow ? "复制内容" : "复制"}
        </motion.button>
        <Tooltip id="copy-content-tooltip" place="top" className="rounded-lg" />
      </>

      <>
        <motion.button
          {...getButtonStyle(0.4)}
          onClick={handleExportDocx}
          data-tooltip-id="save-word-tooltip"
          data-tooltip-content="保存为docx文件"
        >
          <FileText className="w-4 h-4" />
          {!isNarrow ? "保存Word" : "Word"}
        </motion.button>
        <Tooltip id="save-word-tooltip" place="top" className="rounded-lg" />
      </>
    </div>
  );
};

export { ActionButtons };
