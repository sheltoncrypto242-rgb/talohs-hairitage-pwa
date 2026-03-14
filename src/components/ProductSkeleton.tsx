export const ProductSkeleton = () => {
  return (
    <div className="animate-pulse rounded-2xl border bg-card p-6 shadow-sm">
      <div className="h-40 w-full rounded-xl bg-muted" />
      <div className="mt-4 h-6 w-3/4 rounded bg-muted" />
      <div className="mt-2 h-4 w-1/2 rounded bg-muted" />
      <div className="mt-6 h-10 w-full rounded-xl bg-muted" />
    </div>
  );
};
