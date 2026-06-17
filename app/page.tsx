import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-2xl">
        <h1 className="text-4xl font-bold text-orange-700 mb-2">NatiiveMatrimony</h1>
        <p className="text-lg text-gray-600 mb-8">Find your match from your native place</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/register" className="bg-orange-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-orange-700">
            Register Now
          </Link>
          <Link href="/browse" className="border border-orange-600 text-orange-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-orange-50">
            Browse Profiles
          </Link>
        </div>
      </div>
    </main>
  )
}
