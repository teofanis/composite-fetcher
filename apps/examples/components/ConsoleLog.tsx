/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
import React, { useState, useEffect, useCallback } from 'react';

interface LogEntry {
  type: 'log' | 'error';
  message: string;
}

const ConsoleLog: React.FC<{ filter?: string }> = ({ filter }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logContainerRef = React.useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = logContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [logs]);

  useEffect(() => {
    // Capture original console.log and console.error
    const originalLog = console.log;
    const originalError = console.error;

    // Override console.log
    console.log = (...args: any[]) => {
      if (
        args.length > 0 &&
        typeof args[0] === 'string' &&
        filter &&
        args[0].startsWith(filter)
      ) {
        // @ts-ignore
        setLogs((prevLogs) => [
          ...prevLogs,
          ...args.map((arg) => ({
            type: 'log',
            message: JSON.stringify(arg, null, 2),
          })),
        ]);
      }
      originalLog.apply(console, args);
    };

    // Override console.error
    console.error = (...args: any[]) => {
      if (
        args.length > 0 &&
        typeof args[0] === 'string' &&
        filter &&
        args[0].startsWith(filter)
      ) {
        // @ts-ignore
        setLogs((prevLogs) => [
          ...prevLogs,
          ...args.map((arg) => ({
            type: 'error',
            message: JSON.stringify(arg, null, 2),
          })),
        ]);
      }
      originalError.apply(console, args);
    };
    // Restore original console.log and console.error on component unmount
    return () => {
      console.log = originalLog;
      console.error = originalError;
    };
  }, []);

  const formatDate = useCallback((date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      '0',
    )}-${String(date.getDate()).padStart(2, '0')} ${String(
      date.getHours(),
    ).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(
      date.getSeconds(),
    ).padStart(2, '0')}.${String(date.getMilliseconds()).padStart(3, '0')}`;
  }, []);

  return (
    <div
      ref={logContainerRef}
      className="bg-gray-900 p-4 space-y-4 rounded-md text-gray-200 overflow-x-auto overflow-y-auto max-h-80 max-w-full"
    >
      {logs.length === 0 && (
        <span className="text-muted">Console logs will appear here...</span>
      )}
      {logs.map((entry, index) => (
        <React.Fragment key={index}>
          <div className="w-full flex flex-wrap">
            <span className="w-full">{`[Message ${index + 1}]`}</span>
            <span className="w-full uppercase">{`[${entry.type}]`}</span>
            <span className="w-full text-muted">{`[${formatDate(
              new Date(),
            )}]`}</span>
            <pre
              className={`mb-2 ${entry.type === 'error' ? 'text-red-500' : ''}`}
            >
              {entry.message}
            </pre>
            <div className="w-full h-[0.5px] flex  bg-white" />
          </div>
        </React.Fragment>
      ))}
    </div>
  );
};

export default ConsoleLog;
