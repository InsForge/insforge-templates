export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <main className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-6">
            <svg
              className="w-12 h-12 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Welcome to testnextjs
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Get started by editing{' '}
            <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">src/app/page.tsx</code>
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <a
            href="https://nextjs.org/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Documentation →
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Learn about Next.js features and API.
            </p>
          </a>

          <a
            href="https://nextjs.org/learn"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Learn →</h2>
            <p className="text-gray-600 dark:text-gray-300">
              Learn Next.js in an interactive course!
            </p>
          </a>

          <a
            href="https://vercel.com/templates?framework=next.js"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Templates →
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Explore starter templates for Next.js.
            </p>
          </a>
        </div>
      </main>
    </div>
  );
}
