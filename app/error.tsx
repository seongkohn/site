'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          Something went wrong
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          {error.message || 'An unexpected error occurred.'}
        </p>
        <button
          onClick={reset}
          className="bg-brand-magenta text-white px-4 py-2 rounded text-sm font-medium hover:opacity-90 transition"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
