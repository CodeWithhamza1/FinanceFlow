"use client";

import React from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  if (!content) return null;

  // Normalize content: handle both actual newlines and escaped \n characters
  let normalizedContent = content;
  // First, replace escaped dollar signs (common in financial text)
  normalizedContent = normalizedContent.replace(/\\\$/g, '$');
  // Replace literal \n strings with actual newlines (handle various escape patterns)
  normalizedContent = normalizedContent.replace(/\\n/g, '\n');
  normalizedContent = normalizedContent.replace(/\\\\n/g, '\n');
  // Handle other common escape sequences
  normalizedContent = normalizedContent.replace(/\\t/g, '  '); // tabs to spaces
  // Replace multiple consecutive newlines with double newlines (paragraph breaks)
  normalizedContent = normalizedContent.replace(/\n{3,}/g, '\n\n');
  // Trim leading/trailing whitespace
  normalizedContent = normalizedContent.trim();
  
  // Split content into lines
  const lines = normalizedContent.split('\n');
  const elements: React.ReactNode[] = [];
  let currentList: React.ReactNode[] = [];
  let inList = false;
  let listType: 'ul' | 'ol' = 'ul';

  const renderInlineMarkdown = (text: string): React.ReactNode => {
    if (!text) return null;
    
    // Escape HTML first to prevent XSS, then process markdown
    let processed = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    
    // Handle bold text **text** (must come before italic to avoid conflicts)
    processed = processed.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    // Handle bold text __text__
    processed = processed.replace(/__([^_]+)__/g, '<strong>$1</strong>');
    
    // Handle italic text *text* (but not if it's part of **)
    processed = processed.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
    // Handle italic text _text_
    processed = processed.replace(/(?<!_)_([^_]+)_(?!_)/g, '<em>$1</em>');
    
    // Handle inline code `code`
    processed = processed.replace(/`([^`]+)`/g, '<code class="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-foreground">$1</code>');
    
    // Handle links [text](url)
    processed = processed.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary underline hover:text-primary/80" target="_blank" rel="noopener noreferrer">$1</a>');
    
    // Handle escaped dollar signs \$ (common in financial text)
    processed = processed.replace(/\\\$/g, '$');
    
    return <span dangerouslySetInnerHTML={{ __html: processed }} />;
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // Empty line - close lists but don't add breaks if we're in a list
    if (!trimmed) {
      if (inList && currentList.length > 0) {
        if (listType === 'ul') {
          elements.push(<ul key={`list-${index}`} className="list-disc list-inside space-y-1.5 my-3 ml-4">{currentList}</ul>);
        } else {
          elements.push(<ol key={`list-${index}`} className="list-decimal list-inside space-y-1.5 my-3 ml-4">{currentList}</ol>);
        }
        currentList = [];
        inList = false;
      }
      // Only add break if not closing a list
      if (!inList) {
        elements.push(<div key={`spacer-${index}`} className="h-2" />);
      }
      return;
    }

    // H1 heading ##
    if (trimmed.startsWith('## ')) {
      // Close any open list before heading
      if (inList && currentList.length > 0) {
        if (listType === 'ul') {
          elements.push(<ul key={`list-${index}-before-h2`} className="list-disc list-inside space-y-1.5 my-3 ml-4">{currentList}</ul>);
        } else {
          elements.push(<ol key={`list-${index}-before-h2`} className="list-decimal list-inside space-y-1.5 my-3 ml-4">{currentList}</ol>);
        }
        currentList = [];
        inList = false;
      }
      elements.push(
        <h2 key={`h2-${index}`} className="text-xl font-bold mt-6 mb-3 text-foreground">
          {renderInlineMarkdown(trimmed.substring(3))}
        </h2>
      );
      return;
    }

    // H2 heading ###
    if (trimmed.startsWith('### ')) {
      // Close any open list before heading
      if (inList && currentList.length > 0) {
        if (listType === 'ul') {
          elements.push(<ul key={`list-${index}-before-h3`} className="list-disc list-inside space-y-1.5 my-3 ml-4">{currentList}</ul>);
        } else {
          elements.push(<ol key={`list-${index}-before-h3`} className="list-decimal list-inside space-y-1.5 my-3 ml-4">{currentList}</ol>);
        }
        currentList = [];
        inList = false;
      }
      elements.push(
        <h3 key={`h3-${index}`} className="text-lg font-semibold mt-4 mb-2 text-foreground">
          {renderInlineMarkdown(trimmed.substring(4))}
        </h3>
      );
      return;
    }

    // H3 heading ####
    if (trimmed.startsWith('#### ')) {
      // Close any open list before heading
      if (inList && currentList.length > 0) {
        if (listType === 'ul') {
          elements.push(<ul key={`list-${index}-before-h4`} className="list-disc list-inside space-y-1.5 my-3 ml-4">{currentList}</ul>);
        } else {
          elements.push(<ol key={`list-${index}-before-h4`} className="list-decimal list-inside space-y-1.5 my-3 ml-4">{currentList}</ol>);
        }
        currentList = [];
        inList = false;
      }
      elements.push(
        <h4 key={`h4-${index}`} className="text-base font-semibold mt-3 mb-2 text-foreground">
          {renderInlineMarkdown(trimmed.substring(5))}
        </h4>
      );
      return;
    }

    // Unordered list item - or * (with optional space after dash/asterisk)
    const unorderedMatch = trimmed.match(/^(\s*)[-*]\s*(.+)$/);
    if (unorderedMatch) {
      if (!inList || listType === 'ol') {
        if (inList && currentList.length > 0) {
          elements.push(<ol key={`list-${index}`} className="list-decimal list-inside space-y-1 my-2 ml-4">{currentList}</ol>);
          currentList = [];
        }
        inList = true;
        listType = 'ul';
      }
      const itemText = unorderedMatch[2].trim();
      if (itemText) {
        currentList.push(
          <li key={`li-${index}`} className="text-foreground/90 mb-1.5 pl-1">
            {renderInlineMarkdown(itemText)}
          </li>
        );
      }
      return;
    }

    // Ordered list item 1. or 1) (with optional space after number)
    const orderedMatch = trimmed.match(/^(\s*)\d+[.)]\s*(.+)$/);
    if (orderedMatch) {
      if (!inList || listType === 'ul') {
        if (inList && currentList.length > 0) {
          elements.push(<ul key={`list-${index}`} className="list-disc list-inside space-y-1 my-2 ml-4">{currentList}</ul>);
          currentList = [];
        }
        inList = true;
        listType = 'ol';
      }
      const itemText = orderedMatch[2].trim();
      if (itemText) {
        currentList.push(
          <li key={`li-${index}`} className="text-foreground/90 mb-1.5 pl-1">
            {renderInlineMarkdown(itemText)}
          </li>
        );
      }
      return;
    }

    // Regular paragraph
    if (inList) {
      if (listType === 'ul') {
        elements.push(<ul key={`list-${index}`} className="list-disc list-inside space-y-1.5 my-3 ml-4">{currentList}</ul>);
      } else {
        elements.push(<ol key={`list-${index}`} className="list-decimal list-inside space-y-1.5 my-3 ml-4">{currentList}</ol>);
      }
      currentList = [];
      inList = false;
    }

    // Only render non-empty paragraphs
    if (trimmed.length > 0) {
      elements.push(
        <p key={`p-${index}`} className="text-foreground/90 mb-4 leading-relaxed">
          {renderInlineMarkdown(trimmed)}
        </p>
      );
    }
  });

  // Close any remaining list
  if (inList && currentList.length > 0) {
    if (listType === 'ul') {
      elements.push(<ul key="list-final" className="list-disc list-inside space-y-1.5 my-3 ml-4">{currentList}</ul>);
    } else {
      elements.push(<ol key="list-final" className="list-decimal list-inside space-y-1.5 my-3 ml-4">{currentList}</ol>);
    }
  }

  return (
    <div className={`markdown-content ${className}`}>
      {elements}
    </div>
  );
}

