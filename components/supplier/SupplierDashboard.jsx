import React, { useState } from "react";
import Icon from "feather-icons-react";
import { useAuth } from "../../context/AuthContext";
import ManageProfiles from "./ManageProfiles";
import ManageEmployees from "./ManageEmployees";
import Products from "./SupplierProducts";
import SupplierRFQs from "./SupplierRFQs";
import ManageTerms from "./ManageTerms";
import { useTranslation } from "react-i18next";
import SupplierOrdersPage from "./SupplierOrdersPage";
import UserMessages from "../supplier-buyer/UserMessages";

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [isSidebarVisible, setSidebarVisible] = useState(true);
  const [selectedMenu, setSelectedMenu] = useState("home");
  const { t } = useTranslation();

  const toggleSidebar = () => {
    setSidebarVisible(!isSidebarVisible);
  };

  const menuItems = [
    { name: "home", icon: "home" },
    { name: "profiles", icon: "user" },
    { name: "terms", icon: "file-text" },
    { name: "employees", icon: "users" },
    { name: "messages", icon: "mail" },
    { name: "products", icon: "package" },
    { name: "orders", icon: "shopping-cart" },
    { name: "rfqs", icon: "clipboard" },
    { name: "settings", icon: "settings" },
    { name: "support", icon: "help-circle" },
  ];

  const handleMenuClick = (menu) => {
    setSelectedMenu(menu);
    setSidebarVisible(false);
  };

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
    <div className='container-fluid'>
      <nav
        className='row'
        style={{
          backgroundColor: "transparent",
          borderBottom: "1px solid #e0e0e0",
          padding: "10px 20px",
        }}
      >
        <div className='col-6 d-flex align-items-center'>
          <button
            style={{
              border: "none",
              background: "none",
              color: "#2c6449",
              cursor: "pointer",
            }}
            onClick={toggleSidebar}
          >
            <Icon icon='align-left' />
          </button>
          <h5 className='ms-2 mb-0'>{t("dashboard.title")}</h5>
        </div>
        <div className='col-6 d-flex justify-content-end align-items-center'>
          <img
            src={currentUser?.logoUrl || "https://via.placeholder.com/32"}
            alt='User Avatar'
            style={{ borderRadius: "50%", width: "60px", height: "60px" }}
          />
        </div>
      </nav>

      <div className='row'>
        {isSidebarVisible && (
          <div
            className='col-md-2'
            style={{
              backgroundColor: "#f8f9fa",
              transition: "all 0.5s ease-in-out",
              transform: isSidebarVisible
                ? "translateY(0)"
                : "translateY(-20%)",
              opacity: isSidebarVisible ? "1" : "0",
              maxHeight: isSidebarVisible ? "100vh" : "0",
              overflow: "hidden",
              padding: isSidebarVisible ? "10px 20px" : "0",
            }}
          >
            <ul style={{ padding: 0, margin: 0, listStyle: "none" }}>
              {menuItems.map((menu) => (
                <li key={menu.name}>
                  <button
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "10px 20px",
                      border: "none",
                      background: "none",
                      fontSize: "16px",
                      color: selectedMenu === menu.name ? "#2c6449" : "inherit",
                      fontWeight:
                        selectedMenu === menu.name ? "bold" : "normal",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      cursor: "pointer",
                    }}
                    onClick={() => handleMenuClick(menu.name)}
                  >
                    <Icon icon={menu.icon} />
                    {t(`menu.${menu.name}`)}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className={isSidebarVisible ? "col-md-10" : "col-12"}>
          <div style={{ padding: "20px" }}>{renderContent()}</div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
