import RetryPluginExample from '@/components/RetryPluginExample';
import CachingPluginExample from '@/components/CachingPluginExample';

export default function Home() {
  return (
    <>
      <div className="w-full p-4 text-center text-2xl font-bold">
        <h1>Composite Fetcher Examples</h1>
      </div>
      <p className="text-sm font-normal text-muted max-w-xl mx-auto text-center">
        When exploring these composite fetcher examples with various plugins,
        you might find it insightful to use the browser's inspector or developer
        tools. Depending on the specific example, examining network requests or
        caches can provide a deeper understanding.
      </p>
      <div className=" flex flex-col justify-center items-center pt-4">
        <CachingPluginExample />
        <RetryPluginExample />
      </div>
    </>
  );
}
