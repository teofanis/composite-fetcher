/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable import/extensions */
/* eslint-disable import/no-unresolved */
/* eslint-disable no-console */

'use client';

import fetcher from '@/lib/fetcher';

export default function Home() {
  const handleSuccessClick = () => {
    fetcher
      .fetch('https://dog.ceo/api/breeds/image/random') // This is a success endpoint for demonstration
      .then((res: { json: () => any }) => res.json())
      .then(console.log)
      .catch(console.error);
  };

  const handleFailureClick = () => {
    fetcher
      .fetch('/api/fail', {
        headers: {
          'x-fetcher-retry-times': '6',
        },
      }) // This is a failure endpoint for demonstration
      .then((res: { json: () => any }) => res.json())
      .then(console.log)
      .catch(console.error);
  };

  return (
    <div className="h-screen flex flex-col justify-center items-center">
      <div className="flex justify-between w-1/3 mb-4">
        <span className="mr-4">withRetries:</span>
        <button
          onClick={handleSuccessClick}
          className="bg-green-500 py-2 px-3 rounded-md mr-2"
        >
          Success
        </button>
        <button
          onClick={handleFailureClick}
          className="bg-red-500 py-2 px-3 rounded-md"
        >
          Failure
        </button>
      </div>
      {/* Add similar blocks for other plugins here */}
    </div>
  );
}
