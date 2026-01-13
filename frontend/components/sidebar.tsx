"use client";
import {
  Home,
  Plus,
  Upload,
  Clock,
  DollarSign,
  Settings,
  HelpCircle,
  FileText,
  Menu,
  X,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Package, BarChart3, LogOut } from "lucide-react";

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/create", label: "Create a Label", icon: Plus },
    {
      href: "/upload",
      label: "Upload Spreadsheet",
      icon: Upload,
      highlight: true,
    },
    { href: "/orders", label: "Order History", icon: Clock },
    { href: "/pricing", label: "Pricing", icon: DollarSign },
    { href: "/billing", label: "Billing", icon: FileText },
    { href: "/settings", label: "Settings", icon: Settings },
    { href: "/support", label: "Support & Help", icon: HelpCircle },
  ];

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 left-4 z-50"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <aside className={`fixed md:relative w-64 h-screen bg-sidebar border-r border-sidebar-border flex flex-col  transition-all md:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
        {/* Logo */}
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center">
              <span className="text-sidebar-primary-foreground font-bold text-sm">
                SH
              </span>
            </div>
            <div>
              <h1 className="text-sidebar-foreground font-bold text-lg">
                ShipHub
              </h1>
              <p className="text-sidebar-foreground/60 text-xs">
                Bulk Shipping
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3">
          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <button
                  key={item.href}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  }`}
                  onClick={() => router.push(item.href)}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium text-sm">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-4">
          <div className="bg-sidebar-accent/20 rounded-lg p-4 text-sidebar-foreground/80 text-sm">
            <p className="font-semibold mb-1">Account Balance</p>
            <p className="text-sidebar-primary text-lg font-bold">$2,450.50</p>
          </div>
        </div>
      </aside>
    </>
  );
}