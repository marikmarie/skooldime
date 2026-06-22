import { vendorProducts, vendorCart, vendorSalesTrend } from "@/lib/sampleData";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import TopBar from "@/components/TopBar";
import Sidebar from "@/components/Sidebar";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";

const vendorNavItems = [
  { label: "Dashboard", icon: TrendingUpIcon },
  { label: "Sales", icon: ShoppingCartIcon },
  { label: "Inventory", icon: ShoppingCartIcon },
  { label: "Reports", icon: TrendingUpIcon },
];

const chartMax = Math.max(...vendorSalesTrend.map((item) => item.value));

export default function VendorPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <TopBar pageType="vendor" />
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[260px_1fr]">
          <Sidebar items={vendorNavItems} title="SkoolDime" subtitle="Vendor portal" stats="Active POS: 12 • Weekly: 4.8M" />

          <div className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <Typography component="h1" variant="h4" className="font-semibold text-slate-950">
                    Vendor POS
                  </Typography>
                  <Typography className="mt-2 text-slate-600">Track sales, inventory, and checkout performance in one place.</Typography>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Chip icon={<TrendingUpIcon />} label="Live" color="primary" />
                  <Chip label="12 booths" />
                </div>
              </div>
            </section>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Card className="border border-slate-200 bg-white shadow-sm">
                <CardContent>
                  <Typography variant="subtitle2" className="text-slate-500">
                    Weekly sales
                  </Typography>
                  <Typography variant="h5" className="mt-3 font-semibold text-slate-950">
                    4.8M UGX
                  </Typography>
                  <Typography className="mt-2 text-slate-600 hidden md:block">Revenue from stalls and canteens.</Typography>
                </CardContent>
              </Card>
              <Card className="border border-slate-200 bg-white shadow-sm">
                <CardContent>
                  <Typography variant="subtitle2" className="text-slate-500">
                    PIN-less checkouts
                  </Typography>
                  <Typography variant="h5" className="mt-3 font-semibold text-slate-950">
                    74%
                  </Typography>
                  <Typography className="mt-2 text-slate-600 hidden md:block">Instant approvals below threshold.</Typography>
                </CardContent>
              </Card>
              <Card className="border border-slate-200 bg-white shadow-sm">
                <CardContent>
                  <Typography variant="subtitle2" className="text-slate-500">
                    Top seller
                  </Typography>
                  <Typography variant="h5" className="mt-3 font-semibold text-slate-950">
                    Chapati
                  </Typography>
                  <Typography className="mt-2 text-slate-600 hidden md:block">Most purchased in 24h.</Typography>
                </CardContent>
              </Card>
            </div>

            <Card className="rounded-3xl border border-slate-200 bg-white shadow-sm">
              <CardContent>
                <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <Typography variant="h6" className="font-semibold text-slate-950">
                      Sales trend
                    </Typography>
                    <Typography className="text-slate-500">Daily vendor checkout performance.</Typography>
                  </div>
                  <Chip label="Live" color="primary" />
                </div>
                <div className="rounded-4xl bg-slate-50 p-5">
                  <div className="flex items-end gap-3 h-48">
                    {vendorSalesTrend.map((point) => (
                      <div key={point.label} className="flex-1">
                        <div className="relative h-full rounded-3xl bg-slate-200 p-2">
                          <div className="absolute bottom-0 left-1 right-1 rounded-3xl bg-[#d4805e]" style={{ height: `${(point.value / chartMax) * 100}%` }} />
                        </div>
                        <div className="mt-4 text-center text-sm text-slate-600">{point.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-[1.5fr_0.9fr]">
              <Card className="border border-slate-200 bg-white shadow-sm">
                <CardContent>
                  <Typography variant="h6" className="font-semibold text-slate-950">
                    Product board
                  </Typography>
                  <div className="mt-5 grid gap-3">
                    {vendorProducts.slice(0, 4).map((item) => (
                      <Box key={item.name} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <Typography className="font-semibold text-slate-950">{item.name}</Typography>
                            <Typography className="text-slate-500">{item.category}</Typography>
                          </div>
                          <Typography className="font-semibold text-slate-900">{item.price.toLocaleString()} UGX</Typography>
                        </div>
                        <Typography className="mt-2 text-sm text-slate-600">Sold {item.sold} times</Typography>
                      </Box>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-slate-200 bg-white shadow-sm">
                <CardContent>
                  <Typography variant="h6" className="font-semibold text-slate-950">
                    Checkout snapshot
                  </Typography>
                  <div className="mt-5 space-y-4">
                    <Box className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                      <Typography className="text-slate-500">Student</Typography>
                      <Typography className="mt-2 text-xl font-semibold text-slate-950">{vendorCart.student}</Typography>
                      <Typography className="text-slate-500">{vendorCart.studentClass}</Typography>
                    </Box>
                    <Box className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                      <Typography className="uppercase text-xs tracking-[0.18em] text-slate-500">No-PIN limit</Typography>
                      <Typography className="mt-2 text-2xl font-semibold text-slate-950">{vendorCart.noPinLimit.toLocaleString()} UGX</Typography>
                      <Typography className="mt-2 text-sm text-slate-600">{vendorCart.allowedPinless ? "Approved for instant checkout" : "PIN approval required"}</Typography>
                    </Box>
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
