import Link from 'next/link';

export default function Custom404() {
  return (
    <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-6xl font-bold text-primary-500 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-white mb-4">
          Page not found
        </h2>
        <p className="text-neutral-400 mb-8">
          The page you are looking for doesn't exist.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded transition-colors"
        >
          Go back home
        </Link>
      </div>
    </div>
  );
}
