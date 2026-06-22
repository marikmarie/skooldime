import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="max-w-xl rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <h1 className="text-4xl font-bold text-slate-950">404</h1>
        <p className="mt-4 text-slate-600">Page not found. Return to the SkoolDime dashboard.</p>
        <Link to="/" className="mt-6 inline-flex rounded-full bg-[#d4805e] px-5 py-3 text-white shadow hover:bg-[#c76d4a]">
          Go Home
        </Link>
      </div>
    </main>
  );
}
