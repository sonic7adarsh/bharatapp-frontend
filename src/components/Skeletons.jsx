import React from 'react'
import { motion } from 'framer-motion'
import { skeletonShimmer } from '../motion/presets'

export function SkeletonStoreCard() {
  return (
    <div className="border rounded-brand-lg p-4 shadow-elev-1">
      <div className="flex justify-between items-start">
        <div className="w-2/3">
          <motion.div className="h-4 bg-gray-200 rounded w-3/4" animate={skeletonShimmer.animate} transition={skeletonShimmer.transition} />
          <motion.div className="h-3 bg-gray-200 rounded w-1/2 mt-2" animate={skeletonShimmer.animate} transition={skeletonShimmer.transition} />
        </div>
        <motion.div className="h-4 bg-gray-200 rounded w-12" animate={skeletonShimmer.animate} transition={skeletonShimmer.transition} />
      </div>
      <div className="mt-3 space-y-2">
        {[1,2,3].map(i => (
          <div key={i} className="flex justify-between items-center">
            <motion.div className="h-3 bg-gray-200 rounded w-1/2" animate={skeletonShimmer.animate} transition={skeletonShimmer.transition} />
            <motion.div className="h-3 bg-gray-200 rounded w-16" animate={skeletonShimmer.animate} transition={skeletonShimmer.transition} />
          </div>
        ))}
      </div>
      <div className="mt-4">
        <motion.div className="h-8 bg-gray-200 rounded w-24" animate={skeletonShimmer.animate} transition={skeletonShimmer.transition} />
      </div>
    </div>
  )
}

export function SkeletonProductCard() {
  return (
    <div className="bg-white p-4 rounded-brand-lg shadow-elev-1">
      <motion.div className="w-full h-40 bg-gray-200 rounded mb-3" animate={skeletonShimmer.animate} transition={skeletonShimmer.transition} />
      <motion.div className="h-4 bg-gray-200 rounded w-2/3" animate={skeletonShimmer.animate} transition={skeletonShimmer.transition} />
      <motion.div className="h-3 bg-gray-200 rounded w-full mt-2" animate={skeletonShimmer.animate} transition={skeletonShimmer.transition} />
      <div className="mt-3 flex justify-between items-center">
        <motion.div className="h-4 bg-gray-200 rounded w-16" animate={skeletonShimmer.animate} transition={skeletonShimmer.transition} />
        <motion.div className="h-8 bg-gray-200 rounded w-24" animate={skeletonShimmer.animate} transition={skeletonShimmer.transition} />
      </div>
    </div>
  )
}

export function SkeletonStoreHeader() {
  return (
    <div className="bg-white p-6 rounded-brand-lg shadow-elev-2">
      <motion.div className="h-6 bg-gray-200 rounded w-1/3" animate={skeletonShimmer.animate} transition={skeletonShimmer.transition} />
      <motion.div className="h-4 bg-gray-200 rounded w-1/4 mt-3" animate={skeletonShimmer.animate} transition={skeletonShimmer.transition} />
      <motion.div className="h-4 bg-gray-200 rounded w-1/2 mt-3" animate={skeletonShimmer.animate} transition={skeletonShimmer.transition} />
      <motion.div className="mt-4 h-8 bg-gray-200 rounded w-32" animate={skeletonShimmer.animate} transition={skeletonShimmer.transition} />
    </div>
  )
}

export function SkeletonDashboard() {
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1,2,3].map(i => (
          <div key={i} className="bg-white p-4 rounded-brand-lg shadow-elev-1">
            <motion.div className="h-4 bg-gray-200 rounded w-1/2" animate={skeletonShimmer.animate} transition={skeletonShimmer.transition} />
            <motion.div className="h-8 bg-gray-200 rounded w-1/3 mt-3" animate={skeletonShimmer.animate} transition={skeletonShimmer.transition} />
          </div>
        ))}
      </div>
      <div className="mt-6 bg-white p-4 rounded-brand-lg shadow-elev-1">
        <motion.div className="h-5 bg-gray-200 rounded w-1/4" animate={skeletonShimmer.animate} transition={skeletonShimmer.transition} />
        <div className="space-y-3 mt-4">
          {[1,2,3,4].map(i => (
            <motion.div key={i} className="h-4 bg-gray-200 rounded w-full" animate={skeletonShimmer.animate} transition={skeletonShimmer.transition} />
          ))}
        </div>
      </div>
    </div>
  )
}