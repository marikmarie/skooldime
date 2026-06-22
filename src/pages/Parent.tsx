import { parentProfile, parentSpendingTrend } from "@/lib/sampleData";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import TopBar from "@/components/TopBar";
import Sidebar from "@/components/Sidebar";
import AssessmentIcon from "@mui/icons-material/Assessment";
import PeopleIcon from "@mui/icons-material/People";
import HistoryIcon from "@mui/icons-material/History";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";

const parentNavItems = [
  { label: "Overview", icon: AssessmentIcon },
  { label: "Wallets", icon: AccountBalanceWalletIcon },
  { label: "Children", icon: PeopleIcon },
  { label: "Activity", icon: HistoryIcon },
];

const chartMax = Math.max(...parentSpendingTrend.map((point) => point.value));

export default function ParentPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <TopBar pageType="parent" />
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[260px_1fr]">
          <Sidebar items={parentNavItems} title="SkoolDime" subtitle="Parent portal" stats="Member: Feb 2025 • Children: 2" />

          <div className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <Typography component="h1" variant="h4" className="font-semibold text-slate-950">
                    Parent Portal
                  </Typography>
                  <Typography className="mt-2 text-slate-600">Manage wallets, track spending, and monitor children's school activity.</Typography>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Chip icon={<AccountBalanceWalletIcon />} label="Primary" color="primary" />
                  <Chip label="2 children" />
                </div>
              </div>
            </section>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Card className="border border-slate-200 bg-white shadow-sm">
                <CardContent>
                  <Typography variant="subtitle2" className="text-slate-500">
                    Wallet balance
                  </Typography>
                  <Typography variant="h5" className="mt-3 font-semibold text-slate-950">
                    {parentProfile.walletBalance.toLocaleString()} UGX
                  </Typography>
                  <Typography className="mt-2 text-slate-600 hidden md:block">Available for school expenses.</Typography>
                </CardContent>
              </Card>
              <Card className="border border-slate-200 bg-white shadow-sm">
                <CardContent>
                  <Typography variant="subtitle2" className="text-slate-500">
                    Linked children
                  </Typography>
                  <Typography variant="h5" className="mt-3 font-semibold text-slate-950">
                    {parentProfile.children.length}
                  </Typography>
                  <Typography className="mt-2 text-slate-600 hidden md:block">Connected to your wallet.</Typography>
                </CardContent>
              </Card>
              <Card className="border border-slate-200 bg-white shadow-sm">
                <CardContent>
                  <Typography variant="subtitle2" className="text-slate-500">
                    Spending this week
                  </Typography>
                  <Typography variant="h5" className="mt-3 font-semibold text-slate-950">44K UGX</Typography>
                  <Typography className="mt-2 text-slate-600 hidden md:block">Tracked across children.</Typography>
                </CardContent>
              </Card>
            </div>

            <Card className="rounded-3xl border border-slate-200 bg-white shadow-sm">
              <CardContent>
                <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <Typography variant="h6" className="font-semibold text-slate-950">
                      Weekly spending trend
                    </Typography>
                    <Typography className="text-slate-500">Last seven days of school spending activity.</Typography>
                  </div>
                  <Chip label="Personal" color="primary" />
                </div>
                <div className="rounded-4xl bg-slate-50 p-5">
                  <div className="flex items-end gap-3 h-48">
                    {parentSpendingTrend.map((point) => (
                      <div key={point.label} className="flex-1">
                        <div className="relative h-full rounded-3xl bg-slate-200 p-2">
                          <div className="absolute bottom-0 left-1 right-1 rounded-3xl bg-[#e8956f]" style={{ height: `${(point.value / chartMax) * 100}%` }} />
                        </div>
                        <div className="mt-4 text-center text-sm text-slate-600">{point.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
              <Card className="border border-slate-200 bg-white shadow-sm">
                <CardContent>
                  <Typography variant="h6" className="font-semibold text-slate-950">
                    Linked students
                  </Typography>
                  <div className="mt-5 space-y-4">
                    {parentProfile.children.map((child) => (
                      <Box key={child.name} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <Typography className="font-semibold text-slate-950">{child.name}</Typography>
                            <Typography className="text-slate-500">{child.class}</Typography>
                          </div>
                          <Typography className="text-slate-900">{child.wallet.toLocaleString()} UGX</Typography>
                        </div>
                      </Box>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-slate-200 bg-white shadow-sm">
                <CardContent>
                  <Typography variant="h6" className="font-semibold text-slate-950">
                    Recent purchases
                  </Typography>
                  <div className="mt-4 space-y-3">
                    {parentProfile.recentTransactions.slice(0, 3).map((txn) => (
                      <Box key={txn.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <Typography className="font-semibold text-slate-950">{txn.type}</Typography>
                            <Typography className="text-slate-500">{txn.partner}</Typography>
                          </div>
                          <Typography className="font-semibold text-slate-950">{txn.amount}</Typography>
                        </div>
                        <Typography className="mt-2 text-sm text-slate-500">{txn.date}</Typography>
                      </Box>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
