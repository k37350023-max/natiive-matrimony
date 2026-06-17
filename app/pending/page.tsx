export default function PendingPage() {
  return (
    <div className="min-h-screen bg-orange-50 flex items-center justify-center px-4">
      <div className="max-w-md text-center bg-white rounded-xl shadow p-8">
        <div className="text-5xl mb-4">🎉</div>
        <h1 className="text-2xl font-bold text-orange-700 mb-2">Profile Submitted!</h1>
        <p className="text-gray-600 mb-4">
          Your profile is under review. We verify every profile manually to ensure quality matches.
        </p>
        <p className="text-gray-500 text-sm">
          You will receive an email once your profile is approved (usually within 24 hours).
        </p>
      </div>
    </div>
  )
}
