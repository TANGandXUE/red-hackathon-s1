import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import ResultContent from './result-content';

function ResultFallback() {
  return (
    <div
      className="crt-overlay pixel-grid-bg flex min-h-screen items-center justify-center"
      style={{ backgroundColor: '#0F0F23' }}
    >
      <div className="flex flex-col items-center gap-4">
        <Loader2
          size={32}
          className="animate-spin"
          style={{ color: '#A78BFA' }}
        />
        <p
          className="text-lg"
          style={{
            fontFamily: 'var(--font-pixel-body)',
            color: '#E2E8F0',
          }}
        >
          加载中...
        </p>
      </div>
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={<ResultFallback />}>
      <ResultContent />
    </Suspense>
  );
}
