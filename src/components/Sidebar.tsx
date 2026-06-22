import AssessmentIcon from "@mui/icons-material/Assessment";
import PeopleIcon from "@mui/icons-material/People";
import StorefrontIcon from "@mui/icons-material/Storefront";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import Typography from "@mui/material/Typography";

interface SidebarProps {
  items?: Array<{ label: string; icon: any }>;
  title?: string;
  subtitle?: string;
  stats?: string;
}

const defaultItems = [
  { label: "Dashboard", icon: AssessmentIcon },
  { label: "Student Wallets", icon: PeopleIcon },
  { label: "Vendor Network", icon: StorefrontIcon },
  { label: "Transactions", icon: ReceiptLongIcon },
  { label: "Reports", icon: ArrowUpwardIcon },
];

export default function Sidebar({ items = defaultItems, title = "SkoolDime", subtitle = "Admin panel", stats = "Students: 1,320 • Vendors: 14" }: SidebarProps) {
  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:gap-6">
      <div className="sticky top-20 flex flex-col gap-6 rounded-3xl bg-linear-to-b from-[#3d5a72] to-[#2d4660] p-6 text-white shadow-md">
        <div>
          <Typography variant="h6" className="font-semibold text-white">
            {title}
          </Typography>
          <Typography variant="body2" className="mt-1 text-amber-100/70">
            {subtitle}
          </Typography>
        </div>

        <nav className="flex flex-col gap-2">
          {items.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button key={item.label} className={`flex items-center gap-3 rounded-xl px-3 py-2 text-left transition ${idx === 0 ? "bg-[#d4805e] text-white shadow-md" : "text-amber-50/80 hover:bg-[#3d5a72]/70"}`}>
                <Icon className="h-5 w-5" />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="mt-4 rounded-lg bg-[#1a2d3d]/60 p-4 text-sm text-amber-50/80 border border-[#d4805e]/20">
          <div className="font-medium text-amber-50">Quick stats</div>
          <div className="mt-2 text-amber-50/60 text-xs">{stats}</div>
        </div>
      </div>
    </aside>
  );
}
