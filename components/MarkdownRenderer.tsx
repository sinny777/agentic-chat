import React from 'react';
import ReactMarkdown from 'react-markdown';

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  return (
    <div style={{ fontSize: '0.875rem', lineHeight: '1.5', color: 'inherit' }}>
      <ReactMarkdown
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const isInline = !match;
            return isInline ? (
              <code style={{
                backgroundColor: '#e0e0e0',
                padding: '0.125rem 0.25rem',
                borderRadius: '0.125rem',
                fontSize: '0.75rem',
                fontFamily: '"IBM Plex Mono", monospace'
              }} {...props}>
                {children}
              </code>
            ) : (
              <div style={{ margin: '0.5rem 0', position: 'relative' }}>
                <div style={{
                  position: 'absolute', top: 0, right: 0,
                  backgroundColor: '#525252', color: 'white',
                  fontSize: '0.625rem', padding: '0.125rem 0.5rem',
                  borderRadius: '0 0.125rem 0 0.125rem'
                }}>
                  {match?.[1] || 'code'}
                </div>
                <code style={{
                  display: 'block',
                  backgroundColor: '#161616',
                  color: '#f4f4f4',
                  padding: '1rem',
                  borderRadius: '0.125rem',
                  overflowX: 'auto',
                  fontFamily: '"IBM Plex Mono", monospace',
                  fontSize: '0.75rem'
                }} {...props}>
                  {children}
                </code>
              </div>
            );
          },
          ul({ children }) {
            return <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', marginBottom: '0.5rem' }}>{children}</ul>;
          },
          ol({ children }) {
            return <ol style={{ listStyleType: 'decimal', paddingLeft: '1.5rem', marginBottom: '0.5rem' }}>{children}</ol>;
          },
          p({ children }) {
            return <p style={{ marginBottom: '0.5rem' }}>{children}</p>;
          },
          a({ children, href }) {
            return <a href={href} style={{ color: '#0f62fe', textDecoration: 'none' }} target="_blank" rel="noopener noreferrer">{children}</a>
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;