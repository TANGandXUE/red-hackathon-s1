'use client';

import type { BPDocument as BPDocumentType } from '@/types/simulation';

interface BPDocumentProps {
  bp: BPDocumentType;
}

const SECTIONS: { key: keyof BPDocumentType; label: string }[] = [
  { key: 'projectName', label: '项目名称' },
  { key: 'problem', label: '问题与痛点' },
  { key: 'solution', label: '解决方案' },
  { key: 'targetUsers', label: '目标用户' },
  { key: 'features', label: '核心功能' },
  { key: 'businessModel', label: '商业模式' },
  { key: 'advantage', label: '竞争优势' },
];

export default function BPDocument({ bp }: BPDocumentProps) {
  return (
    <div
      className="space-y-0 overflow-hidden"
      style={{
        backgroundColor: 'var(--rs-charcoal)',
        border: '1px solid var(--rs-gray-dark)',
        borderRadius: '0px',
      }}
    >
      {SECTIONS.map((section, index) => (
        <div
          key={section.key}
          className="px-4 py-3"
          style={{
            borderBottom:
              index < SECTIONS.length - 1
                ? '1px solid var(--rs-gray-dark)'
                : 'none',
          }}
        >
          <h4
            className="mb-1 text-[10px] uppercase"
            style={{
              fontFamily: 'var(--rs-font-display)',
              letterSpacing: '2px',
              color: 'var(--rs-gray)',
            }}
          >
            {section.label}
          </h4>
          <p
            className="text-sm leading-relaxed whitespace-pre-wrap"
            style={{
              fontFamily: 'var(--rs-font-mono)',
              color: 'var(--rs-gray-light)',
            }}
          >
            {bp[section.key] || '--'}
          </p>
        </div>
      ))}
    </div>
  );
}
