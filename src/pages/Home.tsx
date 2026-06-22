import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Button,
  Card,
  CardContent,
  Chip,
  Typography,
} from "@mui/material";
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
    detail: "Daily payment volume",
    badge: "Finance",
    icon: SchoolIcon,
  },
  {
    id: "vendor",
    title: "Vendor POS",
    path: "/vendor",
    metric: "74%",
    detail: "PIN-less approvals",
    badge: "Sales",
    icon: TrendingUpIcon,
  },
  {
    id: "parent",
    title: "Parent Portal",
    path: "/parent",
    metric: "180K UGX",
    detail: "Wallet management",
    badge: "Wallet",
    icon: SecurityIcon,
  },
];

const features = [
  {
    icon: SpeedIcon,
    title: "Fast Checkout",
    description: "PIN-less transactions for instant approvals",
  },
  {
    icon: SecurityIcon,
    title: "Secure",
    description: "Bank-grade security for all transactions",
  },
  {
    icon: TrendingUpIcon,
    title: "Real-time Analytics",
    description: "Live insights into school spending",
  },
];

export default function Home() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState("admin");

  const selected =
    roleCards.find((r) => r.id === selectedRole) || roleCards[0];

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-gradient-to-br from-[#d4805e] to-[#e8956f] text-white font-bold">
              S
            </div>
            <span className="font-semibold text-slate-900">
              SkoolDime
            </span>
          </div>

          <nav className="hidden md:flex gap-6 text-sm text-slate-600">
            <a href="#features" className="hover:text-slate-900">
              Features
            </a>
            <a href="#roles" className="hover:text-slate-900">
              Roles
            </a>
          </nav>

          <Button
            variant="outlined"
            component={Link}
            to="/dashboard"
          >
            Dashboard
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="px-4 py-16 text-center">
        <div className="max-w-4xl mx-auto">
          <Typography variant="h3" className="font-bold mb-4">
            School Finance Made Simple
          </Typography>

          <Typography className="text-slate-600 mb-8">
            Payments, analytics, and wallet management in one
            platform.
          </Typography>

          {/* Role Selector */}
          <div className="flex justify-center flex-wrap gap-3">
            {roleCards.map((role) => (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className={`px-4 py-2 rounded-lg ${
                  selectedRole === role.id
                    ? "bg-[#d4805e] text-white"
                    : "bg-white border"
                }`}
              >
                {role.title}
              </button>
            ))}
          </div>

          {/* Demo Box */}
          <div className="mt-10 grid md:grid-cols-2 gap-6 items-center">
            <div className="text-left space-y-3">
              <Typography variant="h5">
                Try {selected.title}
              </Typography>

              <div className="text-sm">
                <b>Email:</b> {selected.id}@skooldime.com
              </div>
              <div className="text-sm">
                <b>Password:</b> password123
              </div>

              <Button
                variant="contained"
                fullWidth
                onClick={() => navigate(selected.path)}
                sx={{
                  backgroundColor: "#d4805e",
                  "&:hover": { backgroundColor: "#c76d4a" },
                }}
              >
                Sign in
              </Button>
            </div>

            <Card>
              <CardContent>
                <Typography>{selected.metric}</Typography>
                <Typography variant="body2">
                  {selected.detail}
                </Typography>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16 bg-white">
        <div className="max-w-6xl mx-auto text-center">
          <Typography variant="h4" className="mb-6">
            Features
          </Typography>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <Card key={f.title}>
                  <CardContent>
                    <Icon className="text-[#d4805e]" />
                    <Typography>{f.title}</Typography>
                    <Typography variant="body2">
                      {f.description}
                    </Typography>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section id="roles" className="py-16">
        <div className="max-w-6xl mx-auto text-center">
          <Typography variant="h4" className="mb-6">
            Roles
          </Typography>

          <div className="grid md:grid-cols-3 gap-6">
            {roleCards.map((r) => (
              <Card key={r.id}>
                <CardContent>
                  <Typography>{r.title}</Typography>
                  <Chip
                    label={r.badge}
                    size="small"
                    sx={{
                      backgroundColor: "#fce7df",
                      color: "#d4805e",
                      mb: 1,
                    }}
                  />
                  <Typography>{r.metric}</Typography>

                  <Button
                    fullWidth
                    component={Link}
                    to={r.path}
                    variant="outlined"
                    sx={{
                      borderColor: "#d4805e",
                      color: "#d4805e",
                    }}
                  >
                    Open
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-[#d4805e] to-[#e8956f] text-white text-center">
        <Typography variant="h4" className="mb-4">
          Ready to start?
        </Typography>

        <Button
          variant="contained"
          onClick={() => navigate("/dashboard")}
          sx={{
            backgroundColor: "#fff",
            color: "#d4805e",
          }}
        >
          Get Started
        </Button>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-slate-500 text-sm bg-slate-900">
        © 2026 SkoolDime
      </footer>
    </main>
  );
}
