'use client';

import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';

const components: Components = {
  p: ({ children }) => (
    <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
  ),
  strong: ({ children }) => (
    <strong className="font-bold" style={{ color: 'var(--rs-white)' }}>
      {children}
    </strong>
  ),
  em: ({ children }) => (
    <em style={{ color: 'var(--rs-gray-light)' }}>{children}</em>
  ),
  ul: ({ children }) => (
    <ul className="mb-2 ml-4 list-disc last:mb-0">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-2 ml-4 list-decimal last:mb-0">{children}</ol>
  ),
  li: ({ children }) => <li className="mb-0.5">{children}</li>,
  h1: ({ children }) => (
    <h1
      className="mb-2 text-lg font-bold"
      style={{ color: 'var(--rs-white)', fontFamily: 'var(--rs-font-display)' }}
    >
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2
      className="mb-2 text-base font-bold"
      style={{ color: 'var(--rs-white)', fontFamily: 'var(--rs-font-display)' }}
    >
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3
      className="mb-1 text-base font-bold"
      style={{ color: 'var(--rs-white)', fontFamily: 'var(--rs-font-display)' }}
    >
      {children}
    </h3>
  ),
  blockquote: ({ children }) => (
    <blockquote
      className="my-2 pl-3"
      style={{ borderLeft: '2px solid var(--rs-gray-dark)', color: 'var(--rs-gray)' }}
    >
      {children}
    </blockquote>
  ),
  code: ({ children }) => (
    <code
      className="px-1 py-0.5 text-sm"
      style={{
        backgroundColor: 'var(--rs-charcoal)',
        color: 'var(--rs-gray-light)',
        borderRadius: '0px',
      }}
    >
      {children}
    </code>
  ),
  a: ({ children, href }) => (
    <a
      href={href}
      className="transition-all duration-200"
      style={{
        color: 'var(--rs-white)',
        textDecoration: 'none',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.textDecoration = 'underline';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.textDecoration = 'none';
      }}
    >
      {children}
    </a>
  ),
};

interface MarkdownContentProps {
  content: string;
  className?: string;
  style?: React.CSSProperties;
}

export default function MarkdownContent({
  content,
  className = '',
  style,
}: MarkdownContentProps) {
  return (
    <div
      className={`text-base leading-relaxed break-words ${className}`}
      style={{ fontFamily: 'var(--rs-font-mono)', color: 'var(--rs-gray-light)', ...style }}
    >
      <ReactMarkdown components={components}>{content}</ReactMarkdown>
    </div>
  );
}
