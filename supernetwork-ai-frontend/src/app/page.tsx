import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-indigo-500 to-purple-600 py-12 px-4 sm:px-6 lg:px-8 text-white">
      <div className="max-w-3xl w-full space-y-8 text-center">
        <h1 className="text-5xl font-extrabold tracking-tight">
          SuperNetworkAI
        </h1>
        <p className="text-xl">
          Find your perfect match with AI-powered networking
        </p>
        
        <div className="mt-8 space-y-4">
          <p className="text-lg">
            Connect with founders, clients, and teammates based on your ikigai and working style
          </p>
        </div>
        
        <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
          <Link 
            href="/custom-login" 
            className="px-8 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10"
          >
            Sign In
          </Link>
          <Link 
            href="/custom-register" 
            className="px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-800 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10"
          >
            Get Started
          </Link>
        </div>
        
        <div className="mt-4">
          <Link 
            href="/test-api" 
            className="text-sm text-indigo-200 hover:text-white"
          >
            Test API Connection
          </Link>
        </div>
      </div>
    </div>
  );
}