import { Link } from "react-router-dom";

interface TopBarProps {
  pageType?: "admin" | "vendor" | "parent";
}

export default function TopBar({ pageType = "admin" }: TopBarProps) {
  const getPageLabel = () => {
    switch (pageType) {
      case "vendor":
        return "Vendor";
      case "parent":
        return "Parent";
      default:
        return "Admin";
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-white/80 backdrop-blur-sm border-b border-slate-100">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#d4805e] text-white font-bold">S</div>
          <div className="hidden flex-col sm:flex">
            <span className="font-semibold text-slate-900">SkoolDime</span>
            <span className="text-xs text-slate-500">{getPageLabel()}</span>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-sm text-slate-600">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/">Users</Link>
          <Link to="/">Settings</Link>
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-xs text-slate-600">Home / Dashboard</div>
          <div className="h-9 w-9 overflow-hidden rounded-full border border-slate-200 bg-gradient-to-br from-[#d4805e] to-[#e8956f]" />
        </div>
      </div>
    </header>
  );
}
