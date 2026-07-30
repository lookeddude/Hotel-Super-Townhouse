/**
 * app/loading.tsx
 * Global loading state — shown during page transitions
 */
export default function GlobalLoading() {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-sm text-on-surface-variant font-medium">Loading…</p>
      </div>
    </div>
  );
}
