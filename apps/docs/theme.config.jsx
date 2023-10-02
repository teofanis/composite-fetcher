/* eslint-disable turbo/no-undeclared-env-vars */
/* eslint-disable consistent-return */
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useConfig } from 'nextra-theme-docs';

export default {
  logo: () => {
    return <Image src="/logo.webp" width={300} height={40} priority />;
  },
  project: {
    link: 'https://github.com/teofanis/composite-fetcher',
  },
  docsRepositoryBase:
    'https://github.com/teofanis/composite-fetcher/tree/main/apps/docs',
  useNextSeoProps() {
    const { asPath } = useRouter();
    if (asPath !== '/') {
      return {
        titleTemplate: '%s | Composite Fetcher Docs',
      };
    }
  },
  head: () => {
    const { asPath } = useRouter();
    const { frontMatter } = useConfig();
    const getFullUrl = (path) => {
      const baseUrl = (
        process.env.NEXT_PUBLIC_HOST_URL || 'https://composite-fetcher.com/'
      ).replace(/\/$/, '');
      // trim starting slash and ending slash from path
      const normalizedPath = path.replace(/^\/|\/$/g, '').replace(/\/*$/, '');
      return `${baseUrl}/${normalizedPath}`.replace(/\/$/, '');
    };
    const url = getFullUrl(asPath);
    const title =
      frontMatter.title || 'Composite Fetcher - Modular Fetch Wrapper';
    const description =
      frontMatter.description ||
      'Composite Fetcher is a modular fetch wrapper designed to augment web requests with plugins for logging, caching, and more.';
    const ogImage = getFullUrl('/logo.webp');
    return (
      <>
        <meta name="description" content={description} />

        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:url" content={url} />
        <meta property="og:type" content="website" />

        <link rel="canonical" href={url} />

        <link rel="icon" type="image/x-icon" href="/icons/favicon.ico" />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/icons/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/icons/favicon-16x16.png"
        />

        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/icons/apple-touch-icon.png"
        />

        <link
          rel="icon"
          type="image/png"
          sizes="192x192"
          href="/icons/android-chrome-192x192.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="512x512"
          href="/icons/android-chrome-512x512.png"
        />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={ogImage} />
      </>
    );
  },
  footer: {
    text: <>© {new Date().getFullYear()} Composite-fetcher</>,
  },
};
