import { useState, useEffect } from "react";

const roles = ["Academic Counsellor", "Inside Sales"];

// Longest string drives the reserved width so the headline never reflows
// when the role swaps. Approx 0.58em per char works well for bold sans.
const longest = roles.reduce((a, b) => (a.length >= b.length ? a : b));

const RoleRotator = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % roles.length);
        setIsAnimating(false);
      }, 300);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  return (
    <span
      className="relative inline-flex items-center justify-center bg-primary text-foreground rounded-lg font-bold leading-[1.05] px-3 md:px-5 py-0 align-baseline"
      style={{ minWidth: `${longest.length * 0.58}em` }}
      aria-label={roles[currentIndex]}
    >
      <span
        className={`transition-all duration-300 ${
          isAnimating ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
        }`}
      >
        {roles[currentIndex]}
      </span>
    </span>
  );
};

export default RoleRotator;
