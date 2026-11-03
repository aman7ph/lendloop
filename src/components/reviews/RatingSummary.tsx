import { Stars } from "./Stars";

type Rating = { average: number | null; count: number };

function Box({ label, rating }: { label: string; rating: Rating }) {
  return (
    <div className="rounded-3xl bg-surface p-4 shadow-sm">
      <p className="text-sm text-muted">{label}</p>
      {rating.average === null ? (
        <p className="mt-2 text-sm text-muted">No ratings yet</p>
      ) : (
        <>
          <p className="mt-1 text-3xl font-semibold">
            {rating.average.toFixed(1)}
          </p>
          <div className="flex items-center gap-2">
            <Stars value={rating.average} />
            <span className="text-sm text-muted">({rating.count})</span>
          </div>
        </>
      )}
    </div>
  );
}

export function RatingSummary({
  lender,
  borrower,
}: {
  lender: Rating;
  borrower: Rating;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Box label="As a lender" rating={lender} />
      <Box label="As a borrower" rating={borrower} />
    </div>
  );
}
