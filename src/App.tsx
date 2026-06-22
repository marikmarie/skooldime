import { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import Providers from "./providers";

const Home = lazy(() => import("./pages/Home"));
const DashboardPage = lazy(() => import("./pages/Dashboard"));
const ParentPage = lazy(() => import("./pages/Parent"));
const VendorPage = lazy(() => import("./pages/Vendor"));
const NotFound = lazy(() => import("./pages/NotFound"));

export default function App() {
  return (
    <Providers>
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-slate-700">Loading...</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/parent" element={<ParentPage />} />
          <Route path="/vendor" element={<VendorPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Providers>
  );
}
