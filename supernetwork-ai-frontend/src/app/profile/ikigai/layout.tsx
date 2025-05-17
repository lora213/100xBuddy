import Link from 'next/link';

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-indigo-600 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/custom-dashboard" className="text-xl font-bold">
                  SuperNetworkAI
                </Link>
              </div>
            </div>
            
            <div className="flex items-center">
              <Link 
                href="/custom-dashboard"
                className="px-3 py-1 text-sm rounded-md bg-indigo-700 hover:bg-indigo-800"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>
      
      <main className="flex-grow">
        {children}
      </main>
    </div>
  );
}