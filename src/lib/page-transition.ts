// Lightweight page-fade helper used to smoothly transition between routes.
// Adds a body class that triggers a CSS opacity transition, navigates mid-fade,
// then clears the class so the destination page can run its own enter animation.

const EXIT_CLASS = "page-exiting";
const EXIT_DURATION_MS = 300;

export function fadeNavigate(navigate: (to: string) => void, to: string) {
  if (typeof document === "undefined") {
    navigate(to);
    return;
  }
  document.body.classList.add(EXIT_CLASS);
  // Navigate slightly before fade completes so the destination's enter
  // animation overlaps cleanly with the tail of the exit fade.
  window.setTimeout(() => {
    navigate(to);
    // Clear shortly after so the new page is visible.
    window.setTimeout(() => document.body.classList.remove(EXIT_CLASS), 50);
  }, EXIT_DURATION_MS - 50);
}
