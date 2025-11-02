import React from 'react'

export function SkeletonStoreCard() {
  return (
    <div className="border rounded-lg p-4 shadow-sm animate-pulse">
      <div className="flex justify-between items-start">
        <div className="w-2/3">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-200 rounded w-1/2 mt-2" />
        </div>
        <div className="h-4 bg-gray-200 rounded w-12" />
      </div>
      <div className="mt-3 space-y-2">
        {[1,2,3].map(i => (
          <div key={i} className="flex justify-between items-center">
            <div className="h-3 bg-gray-200 rounded w-1/2" />
            <div className="h-3 bg-gray-200 rounded w-16" />
          </div>
        ))}
      </div>
      <div className="mt-4">
        <div className="h-8 bg-gray-200 rounded w-24" />
      </div>
    </div>
  )
}

export function SkeletonProductCard() {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm animate-pulse">
      <div className="w-full h-40 bg-gray-200 rounded mb-3" />
      <div className="h-4 bg-gray-200 rounded w-2/3" />
      <div className="h-3 bg-gray-200 rounded w-full mt-2" />
      <div className="mt-3 flex justify-between items-center">
        <div className="h-4 bg-gray-200 rounded w-16" />
        <div className="h-8 bg-gray-200 rounded w-24" />
      </div>
    </div>
  )
}

export function SkeletonStoreHeader() {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-1/3" />
      <div className="h-4 bg-gray-200 rounded w-1/4 mt-3" />
      <div className="h-4 bg-gray-200 rounded w-1/2 mt-3" />
      <div className="mt-4 h-8 bg-gray-200 rounded w-32" />
    </div>
  )
}

export function SkeletonDashboard() {
  return (
    <div className="animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1,2,3].map(i => (
          <div key={i} className="bg-white p-4 rounded-lg shadow-sm">
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="h-8 bg-gray-200 rounded w-1/3 mt-3" />
          </div>
        ))}
      </div>
      <div className="mt-6 bg-white p-4 rounded-lg shadow-sm">
        <div className="h-5 bg-gray-200 rounded w-1/4" />
        <div className="space-y-3 mt-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-4 bg-gray-200 rounded w-full" />
          ))}
        </div>
      </div>
    </div>
  )
}