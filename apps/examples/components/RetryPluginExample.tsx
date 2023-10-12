/* eslint-disable no-console */

'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
// components/RetryPluginExample.tsx
import React from 'react';
import { fetcherWithRetries as fetcher } from '@/lib/fetcher';
import PluginShowcaseLayout from '@/components/PluginShowcaseLayout';
import ConsoleLog from '@/components/ConsoleLog';

const RetryPluginExample: React.FC = () => {
  const handleFetch = async (url: string, options?: RequestInit) => {
    try {
      const res = await fetcher.fetch(url, options);
      const data = await res.json();
      console.log('withRetries', data);
    } catch (error: any) {
      console.error('withRetries', error);
    }
  };
  return (
    <PluginShowcaseLayout title="withRetries Plugin">
      <div className="w-full justify-evenly items-center flex pb-4">
        <button
          onClick={() => handleFetch('/api/success')}
          className="bg-green-600 py-2 px-3 rounded-md mr-2 text-gray-200 hover:bg-green-700"
        >
          Success
        </button>
        <button
          onClick={() => handleFetch('/api/fail')}
          className="bg-red-600 py-2 px-3 rounded-md text-gray-200 hover:bg-red-700"
        >
          Failure (3 retries)
        </button>
        <button
          onClick={() =>
            handleFetch('/api/fail', {
              headers: { 'x-fetcher-retry-times': '6' },
            })
          }
          className="bg-red-600 py-2 px-3 rounded-md text-gray-200 hover:bg-red-700"
        >
          Failure (6 retries)
        </button>
      </div>
      <ConsoleLog filter="withRetries" />
    </PluginShowcaseLayout>
  );
};

export default RetryPluginExample;
