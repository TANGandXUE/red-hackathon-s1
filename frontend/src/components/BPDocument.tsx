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
      style={{ backgroundColor: '#12122a', border: '2px solid #2a2a4a' }}
    >
      {SECTIONS.map((section, index) => (
        <div
          key={section.key}
          className="px-4 py-3"
          style={{
            borderBottom:
              index < SECTIONS.length - 1
                ? '1px solid #2a2a4a'
                : 'none',
          }}
        >
          <h4
            className="mb-1 text-[10px] uppercase tracking-wider"
            style={{
              fontFamily: 'var(--font-pixel-display)',
              color: '#A78BFA',
            }}
          >
            {section.label}
          </h4>
          <p
            className="text-lg leading-relaxed whitespace-pre-wrap"
            style={{
              fontFamily: 'var(--font-pixel-body)',
              color: '#E2E8F0',
            }}
          >
            {bp[section.key] || '--'}
          </p>
        </div>
      ))}
    </div>
  );
}
