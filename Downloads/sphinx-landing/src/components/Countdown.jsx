import React, { useEffect, useMemo, useState } from 'react'

// Set your event date/time (Asia/Kolkata).
// Example: Nov 7, 2025 at 00:00 IST
const EVENT_ISO = '2025-11-07T00:00:00+05:30'

function getTimeLeft() {
  const eventTime = new Date(EVENT_ISO).getTime()
  const now = Date.now()
  const diff = eventTime - now
  if (diff <= 0) return null
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
  const mins = Math.floor((diff / (1000 * 60)) % 60)
  const secs = Math.floor((diff / 1000) % 60)
  return { days, hours, mins, secs }
}

export default function Countdown() {
  const [left, setLeft] = useState(getTimeLeft())

  useEffect(() => {
    const id = setInterval(() => setLeft(getTimeLeft()), 1000)
    return () => clearInterval(id)
  }, [])

  if (!left) {
    return (
      <div className="mt-6 text-2xl md:text-3xl font-semibold tracking-wider">
        Live Now
      </div>
    )
  }

  const pad = (n) => String(n).padStart(2, '0')

  return (
    <div className="mt-6 text-2xl md:text-3xl font-semibold tracking-widest" aria-live="polite">
      {pad(left.days)}d : {pad(left.hours)}h : {pad(left.mins)}m : {pad(left.secs)}s
    </div>
  )
}
