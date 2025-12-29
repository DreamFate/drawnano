"use client";

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

interface MarkdownContentProps {
  content: string;
}

export function MarkdownContent({ content }: MarkdownContentProps) {
  return (
    <div className="markdown-content text-sm text-gray-900 dark:text-gray-100">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          // 代码块样式
          code: ({ node, inline, className, children, ...props }: any) => {
            return inline ? (
              <code
                className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono"
                {...props}
              >
                {children}
              </code>
            ) : (
              <code
                className={`block p-3 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-x-auto font-mono text-sm ${className || ''}`}
                {...props}
              >
                {children}
              </code>
            );
          },
          // 段落样式
          p: ({ children }) => (
            <p className="mb-2 last:mb-0">{children}</p>
          ),
          // 标题样式
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold mb-2 mt-4 first:mt-0">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-bold mb-2 mt-3 first:mt-0">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-semibold mb-2 mt-3 first:mt-0">{children}</h3>
          ),
          // 列表样式
          ul: ({ children }) => (
            <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>
          ),
          // 链接样式
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              {children}
            </a>
          ),
          // 引用样式
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 my-2 italic text-gray-700 dark:text-gray-300">
              {children}
            </blockquote>
          ),
          // 表格样式
          table: ({ children }) => (
            <div className="overflow-x-auto my-2">
              <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-600">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 bg-gray-100 dark:bg-gray-800 font-semibold text-left">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">
              {children}
            </td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
