import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold font-heading text-gray-900 mb-4">
            Welcome to <span className="text-primary">Co-Study</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Your all-in-one study collaboration platform for CBSE students
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/auth/login"
              className="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-colors"
            >
              Login
            </Link>
            <Link
              href="/auth/register"
              className="px-6 py-3 bg-white text-primary border-2 border-primary rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

