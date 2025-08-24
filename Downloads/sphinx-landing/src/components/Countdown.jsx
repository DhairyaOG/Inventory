import React from "react";

const Countdown = () => {
  // You can replace these with props or state later
  const days = 15;
  const hours = 10;
  const minutes = 24;
  const seconds = 59;

  return (
    <div className="grid grid-flow-col gap-5 text-center auto-cols-max">
      <div className="flex flex-col">
        <span className="countdown font-mono text-5xl">
          <span
            style={{ "--value": days } as React.CSSProperties}
            aria-live="polite"
            aria-label={`${days} days`}
          >
            {days}
          </span>
        </span>
        days
      </div>

      <div className="flex flex-col">
        <span className="countdown font-mono text-5xl">
          <span
            style={{ "--value": hours } as React.CSSProperties}
            aria-live="polite"
            aria-label={`${hours} hours`}
          >
            {hours}
          </span>
        </span>
        hours
      </div>

      <div className="flex flex-col">
        <span className="countdown font-mono text-5xl">
          <span
            style={{ "--value": minutes } as React.CSSProperties}
            aria-live="polite"
            aria-label={`${minutes} minutes`}
          >
            {minutes}
          </span>
        </span>
        min
      </div>

      <div className="flex flex-col">
        <span className="countdown font-mono text-5xl">
          <span
            style={{ "--value": seconds } as React.CSSProperties}
            aria-live="polite"
            aria-label={`${seconds} seconds`}
          >
            {seconds}
          </span>
        </span>
        sec
      </div>
    </div>
  );
};

export default Countdown;
