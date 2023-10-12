/* eslint-disable no-console */

'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
// components/RetryPluginExample.tsx
import React from 'react';
import { fetcherWithCaching as fetcher } from '@/lib/fetcher';
import PluginShowcaseLayout from '@/components/PluginShowcaseLayout';
import ConsoleLog from '@/components/ConsoleLog';

const CachingPluginExample: React.FC = () => {
  const handleFetch = async (url: string, options?: RequestInit) => {
    try {
      const res = await fetcher.fetch(url, options);
      const data = await res.json();
      console.log('withCaching', data);
    } catch (error: any) {
      console.error('withCaching', error);
    }
  };
  return (
    <PluginShowcaseLayout title="withCaching Plugin">
      <div className="w-full justify-evenly items-center flex pb-4">
        <button
          onClick={() => handleFetch('https://dog.ceo/api/breeds/image/random')}
          className="bg-green-600 py-2 px-3 rounded-md mr-2 text-gray-200 hover:bg-green-700"
        >
          Success
        </button>
        <button
          onClick={() => handleFetch('/api/fail')}
          className="bg-red-600 py-2 px-3 rounded-md text-gray-200 hover:bg-red-700"
        >
          Failure
        </button>
      </div>
      <ConsoleLog filter="withCaching" />
    </PluginShowcaseLayout>
  );
};

export default CachingPluginExample;
