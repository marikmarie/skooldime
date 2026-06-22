import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import SchoolIcon from "@mui/icons-material/School";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import SecurityIcon from "@mui/icons-material/Security";
import SpeedIcon from "@mui/icons-material/Speed";

const roleCards = [
  {
    id: "admin",
    title: "School Admin",
    path: "/dashboard",
    metric: "1.1M UGX",
    detail: "Daily payment volume.",
    badge: "Finance",
    icon: SchoolIcon,
  },
  {
    id: "vendor",
    title: "Vendor POS",
    path: "/vendor",
    metric: "74%",
    detail: "PIN-less approvals.",
    badge: "Sales",
    icon: TrendingUpIcon,
  },
  {
    id: "parent",
    title: "Parent Portal",
    path: "/parent",
    metric: "180K UGX",
    detail: "Wallet management.",
    badge: "Wallet",
    icon: SecurityIcon,
  },
];

const features = [
  { icon: SpeedIcon, title: "Fast Checkout", description: "PIN-less transactions for instant approvals" },
  { icon: SecurityIcon, title: "Secure", description: "Bank-grade security for all transactions" },
  { icon: TrendingUpIcon, title: "Real-time Analytics", description: "Live insights into school spending" },
];

export default function Home() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState("admin");
  const selected = roleCards.find((item) => item.id === selectedRole) ?? roleCards[0];

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-sm border-b border-slate-200">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#d4805e] to-[#e8956f] text-white font-bold text-lg">S</div>
            <span className="font-semibold text-slate-900">SkoolDime</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm text-slate-600">
            <a href="#features" className="hover:text-slate-900 transition">Features</a>
            <a href="#roles" className="hover:text-slate-900 transition">Roles</a>
          </nav>
          <Button variant="outlined" size="small" component={Link} to="/dashboard">
            Dashboard
          </Button>
        </div>
      </header>

      <section className="relative px-4 py-16 sm:px-6 lg:px-8 overflow-hidden">
        <div className="mx-auto max-w-4xl">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#d4805e]/10 px-4 py-2 text-sm font-semibold text-[#d4805e]">
              <span className="flex h-2 w-2 rounded-full bg-[#d4805e]" />
              Welcome to SkoolDime
            </div>
            <Typography component="h1" variant="h2" className="font-bold text-slate-950 text-4xl md:text-5xl leading-tight">
              School Finance Made Simple
            </Typography>
            <Typography variant="h6" className="text-slate-600 text-lg md:text-xl max-w-2xl mx-auto font-normal">
              Streamlined payments, real-time analytics, and seamless wallet management for schools, parents, and vendors.
            </Typography>

            <div className="flex flex-wrap justify-center gap-3 mt-8">
              {roleCards.map((role) => (
                <button
                  key={role.id}
                  onClick={() => setSelectedRole(role.id)}
                  className={`px-5 py-2 rounded-lg font-medium transition ${
                    selectedRole === role.id
                      ? "bg-[#d4805e] text-white shadow-lg"
                      : "bg-white text-slate-700 border border-slate-200 hover:border-[#d4805e]"
                  }`}
                >
                  {role.title}
                </button>
              ))}
            </div>

            <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_1fr] items-center">
              <div className="text-left space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 text-sm text-slate-600">
                  <span className="font-semibold">Demo Access</span>
                </div>
                <Typography variant="h5" className="font-semibold text-slate-950">
                  Try {selected.title} now
                </Typography>
                <div className="space-y-3 text-left">
                  <div className="flex items-center gap-3">
                    <div className="w-24 text-sm text-slate-600">Email:</div>
                    <div className="font-mono text-sm bg-slate-100 px-3 py-1 rounded">{selected.id}@skooldime.com</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 text-sm text-slate-600">Password:</div>
                    <div className="font-mono text-sm bg-slate-100 px-3 py-1 rounded">password123</div>
                  </div>
                </div>
                <Button
                  fullWidth
                  size="large"
                  variant="contained"
                  sx={{ background: "#d4805e", "&:hover": { background: "#c76d4a" } }}
                  onClick={() => navigate(selected.path)}
                  className="mt-6"
                >
                  Sign in as {selected.title}
                </Button>
              </div>

              <div className="bg-gradient-to-br from-[#d4805e]/5 to-[#e8956f]/5 rounded-3xl p-8 border border-[#d4805e]/10">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-white border border-slate-200">
                    <div className="flex-1">
                      <Typography className="text-sm font-medium text-slate-900">{selected.metric}</Typography>
                      <Typography className="text-xs text-slate-500 mt-1">{selected.detail}</Typography>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-white border border-slate-200">
                    <div className="flex-1">
                      <Typography className="text-sm font-medium text-slate-900">Role Type</Typography>
                      <Typography className="text-xs text-slate-500 mt-1">{selected.title}</Typography>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="px-4 py-16 sm:px-6 lg:px-8 bg-white">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <Typography variant="h3" className="font-bold text-slate-950 mb-4">
              Why SkoolDime?
            </Typography>
            <Typography className="text-slate-600 max-w-2xl mx-auto">
              Built for the needs of modern school communities with powerful features and intuitive design.
            </Typography>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title} className="border border-slate-200 shadow-sm hover:shadow-md transition">
                  <CardContent className="pt-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#d4805e]/10 text-[#d4805e] mb-4">
                      <Icon />
                    </div>
                    <Typography variant="h6" className="font-semibold text-slate-950 mb-2">
                      {feature.title}
                    </Typography>
                    <Typography className="text-slate-600 text-sm">
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section id="roles" className="px-4 py-16 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-50 to-slate-100">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <Typography variant="h3" className="font-bold text-slate-950 mb-4">
              Three Powerful Roles
            </Typography>
            <Typography className="text-slate-600 max-w-2xl mx-auto">
              Each role has its own tailored dashboard and features for their specific needs.
            </Typography>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {roleCards.map((role) => {
              const Icon = role.icon;
              return (
                <Card key={role.id} className="border border-slate-200 shadow-sm hover:shadow-lg transition overflow-hidden">
                  <div className="h-1 bg-gradient-to-r from-[#d4805e] to-[#e8956f]" />
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between gap-4 mb-4">
                      <div>
                        <Typography variant="h6" className="font-semibold text-slate-950">
                          {role.title}
                        </Typography>
                      </div>
                      <Chip label={role.badge} size="small" sx={{ background: "#d4805e/10", color: "#d4805e" }} />
                    </div>
                    <Typography variant="h4" className="font-bold text-[#d4805e] mb-1">
                      {role.metric}
                    </Typography>
                    <Typography className="text-slate-600 text-sm mb-6">
                      {role.detail}
                    </Typography>
                    <Button
                      fullWidth
                      variant="outlined"
                      component={Link}
                      to={role.path}
                      sx={{
                        borderColor: "#d4805e",
                        color: "#d4805e",
                        "&:hover": { borderColor: "#c76d4a", color: "#c76d4a" },
                      }}
                    >
                      Open {role.title}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8 bg-gradient-to-r from-[#d4805e] to-[#e8956f]">
        <div className="mx-auto max-w-3xl text-center text-white">
          <Typography variant="h3" className="font-bold mb-4">
            Ready to transform school finance?
          </Typography>
          <Typography className="text-lg opacity-90 mb-8">
            Experience the power of SkoolDime with our interactive demo today.
          </Typography>
          <Button
            variant="contained"
            size="large"
            sx={{ background: "#ffffff", color: "#d4805e", "&:hover": { background: "#f8fafc" } }}
            onClick={() => navigate("/dashboard")}
          >
            Start Exploring
          </Button>
        </div>
      </section>

      <footer className="px-4 py-12 sm:px-6 lg:px-8 bg-slate-950 text-slate-400 text-sm">
        <div className="mx-auto max-w-7xl text-center">
          <Typography className="text-slate-500">
            © 2026 SkoolDime. Transforming school finance, one transaction at a time.
          </Typography>
        </div>
      </footer>
    </main>
  );
}
