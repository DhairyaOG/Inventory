import React from 'react'
import Countdown from './Countdown.jsx'

export default function Landing() {
  return (
    <section id="home" className="relative h-screen w-full overflow-hidden">
      {/* Background video */}
      <video
        className="hero-video absolute inset-0 w-full h-full object-cover"
        autoPlay
        playsInline
        muted
        loop
        preload="auto"
        aria-label="Space cinematic background"
      >
        <source src="/Black_Hole_Spaceship_Cinematic_Animation.mp4" type="video/mp4" />
        {/* Fallback text */}
        Your browser does not support the video tag.
      </video>

      {/* Dark gradient overlay for legibility */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black/80" />

      {/* Fallback background for reduced-motion users */}
      <div className="hero-fallback hidden absolute inset-0 bg-gradient-to-b from-gray-900 via-black to-black" />

      {/* Centered content */}
      <div className="relative z-10 h-full w-full flex flex-col items-center justify-center text-center px-6">
        <h1 className="text-6xl md:text-8xl font-sphinx tracking-[0.2em] drop-shadow">
          SPHINX
        </h1>
        <p className="mt-3 font- sphinx text-lg md:text-2xl text-gray-200 max-w-2xl">
           Nov 7–9, 2025
        </p>
        <Countdown />
      </div>
    </section>
  )
}
