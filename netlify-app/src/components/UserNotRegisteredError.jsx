import { Link } from "react-router-dom";

export default function UserNotRegisteredError() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0f] text-white">
      <h1 className="font-orbitron text-2xl font-bold text-orange-500">Account Not Set Up</h1>
      <p className="mt-2 text-gray-400">Your account hasn't been registered yet.</p>
      <Link to="/" className="mt-4 rounded-lg bg-orange-500 px-4 py-2 text-sm font-bold text-black">
        Go Home
      </Link>
    </div>
  );
}