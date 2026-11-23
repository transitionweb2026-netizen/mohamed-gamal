export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <div className="ad-skeleton mb-2 h-4 w-28" />
      <div className="ad-skeleton mb-8 h-8 w-72" />
      <div className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="ad-skeleton h-28 rounded-[20px]" />
        ))}
      </div>
      <div className="ad-skeleton mt-4 h-80 rounded-[20px]" />
    </div>
  );
}
