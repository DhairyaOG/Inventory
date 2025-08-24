import React from 'react'
import NavBar from './components/NavBar.jsx'
import Landing from './components/Landing.jsx'

export default function App() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Accessibility: skip link */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-white text-black px-3 py-2 rounded"
      >
        Skip to content
      </a>

      <NavBar />

      <main id="main">
        <Landing />
      </main>
    </div>
  )
}
