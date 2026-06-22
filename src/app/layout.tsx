import type { ReactNode } from "react";
import Providers from "./providers";
import "./globals.css";

export default function AppLayout({ children }: { children: ReactNode }) {
  return <Providers>{children}</Providers>;
}
