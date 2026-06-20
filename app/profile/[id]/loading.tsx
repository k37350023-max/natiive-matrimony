export default function ProfileLoading() {
  return (
    <div className="min-h-screen" style={{ background: '#FFFBF5' }}>
      <div className="h-14 bg-white border-b" style={{ borderColor: '#E5E7EB' }} />
      <div className="max-w-3xl mx-auto">
        <div className="animate-pulse bg-gray-100" style={{ paddingBottom: '110%' }} />
        <div className="px-4 py-5 space-y-4">
          <div className="h-7 bg-gray-100 rounded w-2/3 animate-pulse" />
          <div className="h-4 bg-gray-100 rounded w-1/2 animate-pulse" />
          <div className="h-20 bg-gray-100 rounded-xl animate-pulse" />
          <div className="h-20 bg-gray-100 rounded-xl animate-pulse" />
        </div>
      </div>
    </div>
  )
}
