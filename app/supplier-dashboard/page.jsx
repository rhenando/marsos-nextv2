"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard,
  User,
  FileText,
  Users,
  Mail,
  Package,
  ShoppingCart,
  ClipboardList,
  Settings,
  HelpCircle,
  AlignLeft,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import ManageProfiles from "@/components/supplier/ManageProfiles";
import ManageEmployees from "@/components/supplier/ManageEmployees";
import Products from "@/components/supplier/SupplierProducts";
import SupplierRFQs from "@/components/supplier/SupplierRFQs";
import ManageTerms from "@/components/supplier/ManageTerms";
import SupplierOrdersPage from "@/components/supplier/SupplierOrdersPage";
import UserMessages from "@/components/supplier-buyer/UserMessages";

const Dashboard = () => {
  const { currentUser } = useAuth();
  const { t } = useTranslation();
  const [selectedMenu, setSelectedMenu] = useState("home");

  const menuItems = [
    { name: "home", icon: <LayoutDashboard className='w-4 h-4' /> },
    { name: "profiles", icon: <User className='w-4 h-4' /> },
    { name: "terms", icon: <FileText className='w-4 h-4' /> },
    { name: "employees", icon: <Users className='w-4 h-4' /> },
    { name: "messages", icon: <Mail className='w-4 h-4' /> },
    { name: "products", icon: <Package className='w-4 h-4' /> },
    { name: "orders", icon: <ShoppingCart className='w-4 h-4' /> },
    { name: "rfqs", icon: <ClipboardList className='w-4 h-4' /> },
    { name: "settings", icon: <Settings className='w-4 h-4' /> },
    { name: "support", icon: <HelpCircle className='w-4 h-4' /> },
  ];

  const renderContent = () => {
    switch (selectedMenu) {
      case "home":
        return (
          <div>
            <h4>
              {t("dashboard.welcome", { name: currentUser?.name || "User" })}
            </h4>
            <p>{t("dashboard.description")}</p>
          </div>
        );
      case "profiles":
        return <ManageProfiles />;
      case "terms":
        return <ManageTerms />;
      case "employees":
        return <ManageEmployees />;
      case "messages":
        return <UserMessages />;
      case "products":
        return <Products />;
      case "orders":
        return <SupplierOrdersPage />;
      case "rfqs":
        return <SupplierRFQs />;
      case "settings":
        return (
          <div>
            <h4>{t("dashboard.settings")}</h4>
            <p>{t("dashboard.settings_description")}</p>
          </div>
        );
      case "support":
        return (
          <div>
            <h4>{t("dashboard.support")}</h4>
            <p>{t("dashboard.support_description")}</p>
          </div>
        );
      default:
        return <h1>{t("dashboard.default_message")}</h1>;
    }
  };

  return (
    <div className='min-h-screen bg-gray-100'>
      <header className='flex justify-between items-center p-4 border-b bg-white shadow-sm'>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant='ghost' size='icon'>
              <AlignLeft className='h-5 w-5 text-[#2c6449]' />
            </Button>
          </SheetTrigger>
          <SheetContent side='left' className='w-64'>
            <nav className='space-y-2'>
              {menuItems.map((menu) => (
                <Button
                  key={menu.name}
                  variant='ghost'
                  onClick={() => setSelectedMenu(menu.name)}
                  className={`w-full justify-start gap-2 ${
                    selectedMenu === menu.name
                      ? "text-[#2c6449] font-semibold"
                      : ""
                  }`}
                >
                  {menu.icon}
                  {t(`menu.${menu.name}`)}
                </Button>
              ))}
            </nav>
          </SheetContent>
        </Sheet>

        <div className='flex items-center gap-3'>
          <span className='text-sm text-gray-700'>{currentUser?.name}</span>
          <img
            src={currentUser?.logoUrl || "/logo.svg"}
            alt='User Avatar'
            className='rounded-full w-10 h-10 object-cover'
          />
        </div>
      </header>

      <main className='p-6'>{renderContent()}</main>
    </div>
  );
};

export default Dashboard;
