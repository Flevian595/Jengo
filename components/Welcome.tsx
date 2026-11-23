import { Stack } from "./icons";

const STARTERS = [
  "Build a debounced search input in React with TypeScript",
  "Add an M-Pesa STK push to a Next.js route handler",
  "Why does Next.js say my server and client HTML don't match?",
  "Review this API route for security problems",
];

export default function Welcome({ onPick }: { onPick: (text: string) => void }) {
  return (
    <section className="welcome">
      <Stack />
      <h2>What are we building?</h2>
      <p>Write, debug, review or explain code. Pick a starter or type your own.</p>
      <ul className="starters">
        {STARTERS.map((s) => (
          <li key={s}>
            <button type="button" className="starter" onClick={() => onPick(s)}>
              {s}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
