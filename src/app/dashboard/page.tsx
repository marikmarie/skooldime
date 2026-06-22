import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import AssessmentIcon from "@mui/icons-material/Assessment";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PeopleIcon from "@mui/icons-material/People";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import StorefrontIcon from "@mui/icons-material/Storefront";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import { categoryBreakdown, dashboardCards, recentTransactions, revenueTrend, schoolAdminStats } from "@/lib/sampleData";
import TopBar from "@/components/TopBar";
import Sidebar from "@/components/Sidebar";

const statusColor = {
  Success: "success",
  Pending: "warning",
  Failed: "error",
} as const;

const chartMax = Math.max(...revenueTrend.map((row) => row.value), 1);

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <TopBar pageType="admin" />
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[260px_1fr]">
          <Sidebar />

          <div className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <Typography component="h1" variant="h4" className="font-semibold text-slate-950">
                    School Admin Dashboard
                  </Typography>
                  <Typography className="mt-2 text-slate-600">
                    Role-specific analytics and program performance for your school.
                  </Typography>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Chip icon={<TrendingUpIcon />} label="Live" color="primary" />
                  <Chip icon={<CheckCircleIcon />} label="Ready" color="success" />
                </div>
              </div>
            </section>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {dashboardCards.map((card) => (
                <Card key={card.title} className="border border-slate-200 bg-white shadow-sm">
                  <CardContent>
                    <Typography variant="subtitle2" className="text-slate-500">
                      {card.title}
                    </Typography>
                    <Typography variant="h5" className="mt-3 font-semibold text-slate-950">
                      {card.value}
                    </Typography>
                    <Typography className="mt-2 text-slate-600 hidden md:block">{card.description}</Typography>
                  </CardContent>
                </Card>
              ))}
            </div>

            <section className="grid gap-6 xl:grid-cols-[2fr_1fr]">
              <Card className="border border-slate-200 bg-white shadow-sm">
                <CardContent>
                  <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <Typography variant="h6" className="font-semibold text-slate-950">
                        Weekly revenue trend
                      </Typography>
                      <Typography className="text-slate-500">School-wide payment volume for the current week.</Typography>
                    </div>
                    <div className="rounded-2xl bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700">+18.4%</div>
                  </div>
                  <div className="rounded-4xl bg-slate-50 p-5">
                    <div className="flex h-56 items-end gap-3">
                      {revenueTrend.map((point) => (
                        <div key={point.label} className="flex-1">
                          <div className="relative h-full rounded-3xl bg-slate-200 p-2">
                            <div className="absolute bottom-0 left-2 right-2 rounded-3xl bg-[#d4805e]" style={{ height: `${(point.value / chartMax) * 100}%` }} />
                          </div>
                          <div className="mt-4 text-center text-xs font-medium text-slate-600">{point.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-slate-200 bg-white shadow-sm">
                <CardContent>
                  <div className="mb-5 flex items-center justify-between">
                    <Typography variant="h6" className="font-semibold text-slate-950">
                      Wallet health
                    </Typography>
                    <Chip label="Stable" color="success" />
                  </div>
                  <div className="space-y-4">
                    {schoolAdminStats.studentList.map((student) => (
                      <div key={student.name} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center justify-between gap-3 text-slate-950">
                          <div>
                            <Typography className="font-semibold">{student.name}</Typography>
                            <Typography className="text-sm text-slate-500">{student.class}</Typography>
                          </div>
                          <Typography className="text-lg font-semibold">{student.balance.toLocaleString()} UGX</Typography>
                        </div>
                        <div className="mt-3 h-2 rounded-full bg-slate-200">
                          <div className="h-full rounded-full bg-[#e8956f]" style={{ width: `${Math.min(100, (student.noPinLimit / 5000) * 100)}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
              <Card className="border border-slate-200 bg-white shadow-sm">
                <CardContent>
                  <div className="mb-5 flex items-center justify-between">
                    <Typography variant="h6" className="font-semibold text-slate-950">
                      Transaction review
                    </Typography>
                    <Chip label="Live" color="secondary" />
                  </div>
                  <div className="space-y-3">
                    {recentTransactions.map((txn) => (
                      <Box key={txn.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <Typography className="font-semibold text-slate-950">{txn.type}</Typography>
                            <Typography className="text-slate-500">{txn.partner}</Typography>
                          </div>
                          <div className="flex items-center gap-3">
                            <Typography className="font-semibold text-slate-950">{txn.amount}</Typography>
                            <Chip label={txn.status} color={statusColor[txn.status]} size="small" />
                          </div>
                        </div>
                        <Typography className="mt-2 text-sm text-slate-500">{txn.date}</Typography>
                      </Box>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-slate-200 bg-white shadow-sm">
                <CardContent>
                  <div className="mb-5 flex items-center justify-between">
                    <Typography variant="h6" className="font-semibold text-slate-950">
                      Spending categories
                    </Typography>
                    <Chip label="Trending" variant="outlined" />
                  </div>
                  <div className="space-y-4">
                    {categoryBreakdown.map((category) => {
                      const total = categoryBreakdown.reduce((sum, item) => sum + item.amount, 0);
                      const percent = Math.round((category.amount / total) * 100);
                      return (
                        <div key={category.name}>
                          <div className="flex items-center justify-between text-sm text-slate-700">
                            <span>{category.name}</span>
                            <span>{percent}%</span>
                          </div>
                          <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-200">
                            <div className="h-full rounded-full" style={{ width: `${percent}%`, backgroundColor: category.color }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
