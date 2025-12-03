import type { NextPageContext } from 'next';
import Link from 'next/link';

interface ErrorProps {
  statusCode?: number;
}

function Error({ statusCode }: ErrorProps) {
  return (
    <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-6xl font-bold text-primary-500 mb-4">
          {statusCode || 'Error'}
        </h1>
        <h2 className="text-2xl font-semibold text-white mb-4">
          {statusCode
            ? `An error ${statusCode} occurred on server`
            : 'An error occurred on client'}
        </h2>
        <p className="text-neutral-400 mb-8">
          {statusCode === 404
            ? 'The page you are looking for doesn\'t exist.'
            : 'Something went wrong. Please try again later.'}
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

Error.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default Error;
