import { Link } from "react-router-dom";

export default function PageNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0f] text-white">
      <h1 className="font-orbitron text-6xl font-black text-orange-500">404</h1>
      <p className="mt-2 text-gray-400">Page not found</p>
      <Link to="/" className="mt-4 rounded-lg bg-orange-500 px-4 py-2 text-sm font-bold text-black">
        Go Home
      </Link>
    </div>
  );
}