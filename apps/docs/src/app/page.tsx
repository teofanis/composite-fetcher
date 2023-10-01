'use client';
import fetcher from "../lib/fetcher";

export default function Page() {
  const handleClick = () => {
    fetcher.fetch('https://catfact.ninja/breeds?limit=1').then((res) => res.json()).then(console.log).catch(console.error);
  }
  return (
    <>
      <h1>Web</h1>
      <button onClick={handleClick}>Boop</button>
    </>
  );
}
