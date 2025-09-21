import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/components/auth/auth-provider";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";

// Pages
import Login from "@/pages/auth/login";
import Register from "@/pages/auth/register";
import BuyerDashboard from "@/pages/buyer/dashboard";
import CreateRFQ from "@/pages/buyer/create-rfq";
import BuyerRFQs from "@/pages/buyer/rfqs";
import BuyerRFQDetail from "@/pages/buyer/rfq-detail";
import BuyerOffers from "@/pages/buyer/offers";
import BuyerOrders from "@/pages/buyer/orders";
import BuyerPayments from "@/pages/buyer/payments";
import SupplierDashboard from "@/pages/supplier/dashboard";
import SupplierOnboarding from "@/pages/supplier/onboarding";
import SupplierRFQs from "@/pages/supplier/rfqs";
import SupplierQuotes from "@/pages/supplier/quotes";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminRFQManagement from "@/pages/admin/rfq-management";
import AdminRFQDetail from "@/pages/admin/rfq-detail";
import AdminSupplierManagement from "@/pages/admin/supplier-management";
import AdminOfferComposer from "@/pages/admin/offer-composer";
import AdminPaymentConfig from "@/pages/admin/payment-config";
import NotFound from "@/pages/not-found";

// Components
import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";

function DashboardLayout() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(() => {
    if (user?.role === 'admin') return 'admin';
    if (user?.role === 'supplier') return 'supplier';
    return 'buyer';
  });

  const buyerSidebarItems = [
    { icon: 'fas fa-home', label: 'Dashboard', href: '/buyer/dashboard', active: true },
    { icon: 'fas fa-plus-circle', label: 'Create RFQ', href: '/buyer/create-rfq' },
    { icon: 'fas fa-file-alt', label: 'My RFQs', href: '/buyer/rfqs' },
    { icon: 'fas fa-handshake', label: 'Offers', href: '/buyer/offers' },
    { icon: 'fas fa-shopping-cart', label: 'Orders', href: '/buyer/orders' },
    { icon: 'fas fa-credit-card', label: 'Payments', href: '/buyer/payments' },
    { icon: 'fas fa-headset', label: 'Support', href: '#' },
  ];

  const supplierSidebarItems = [
    { icon: 'fas fa-home', label: 'Dashboard', href: '/supplier/dashboard', active: true },
    { icon: 'fas fa-file-invoice', label: 'Invited RFQs', href: '/supplier/rfqs' },
    { icon: 'fas fa-quote-right', label: 'My Quotes', href: '/supplier/quotes' },
    { icon: 'fas fa-shopping-cart', label: 'Orders', href: '#' },
    { icon: 'fas fa-money-bill-wave', label: 'Payouts', href: '#' },
    { icon: 'fas fa-user-cog', label: 'Profile', href: '/supplier/onboarding' },
  ];

  const adminSidebarItems = [
    { icon: 'fas fa-home', label: 'Dashboard', href: '/admin/dashboard', active: true },
    { icon: 'fas fa-file-alt', label: 'RFQ Management', href: '/admin/rfqs' },
    { icon: 'fas fa-users', label: 'Supplier Management', href: '/admin/suppliers' },
    { icon: 'fas fa-handshake', label: 'Offer Composer', href: '/admin/offers' },
    { icon: 'fas fa-shopping-cart', label: 'Order Management', href: '#' },
    { icon: 'fas fa-credit-card', label: 'Payment Configuration', href: '/admin/payment-config' },
    { icon: 'fas fa-chart-bar', label: 'Analytics', href: '#' },
  ];

  const getSidebarItems = () => {
    switch (activeTab) {
      case 'supplier': return supplierSidebarItems;
      case 'admin': return adminSidebarItems;
      default: return buyerSidebarItems;
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    // Navigate to the respective dashboard
    window.location.href = `/${tab}/dashboard`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar onTabChange={handleTabChange} activeTab={activeTab} />
      <div className="flex">
        <Sidebar items={getSidebarItems()} />
        <main className="flex-1">
          <Switch>
            {/* Buyer Routes */}
            <Route path="/buyer/dashboard" component={BuyerDashboard} />
            <Route path="/buyer/create-rfq" component={CreateRFQ} />
            <Route path="/buyer/rfqs" component={BuyerRFQs} />
            <Route path="/buyer/rfq/:id" component={BuyerRFQDetail} />
            <Route path="/buyer/offers" component={BuyerOffers} />
            <Route path="/buyer/orders" component={BuyerOrders} />
            <Route path="/buyer/payments" component={BuyerPayments} />
            
            {/* Supplier Routes */}
            <Route path="/supplier/dashboard" component={SupplierDashboard} />
            <Route path="/supplier/onboarding" component={SupplierOnboarding} />
            <Route path="/supplier/rfqs" component={SupplierRFQs} />
            <Route path="/supplier/quotes" component={SupplierQuotes} />
            
            {/* Admin Routes */}
            <Route path="/admin/dashboard" component={AdminDashboard} />
            <Route path="/admin/rfqs" component={AdminRFQManagement} />
            <Route path="/admin/rfq/:id" component={AdminRFQDetail} />
            <Route path="/admin/suppliers" component={AdminSupplierManagement} />
            <Route path="/admin/offers" component={AdminOfferComposer} />
            <Route path="/admin/payment-config" component={AdminPaymentConfig} />
            
            {/* Default redirect based on role */}
            <Route path="/dashboard">
              {user?.role === 'admin' && <AdminDashboard />}
              {user?.role === 'supplier' && <SupplierDashboard />}
              {(!user?.role || user?.role === 'buyer') && <BuyerDashboard />}
            </Route>
            
            <Route component={NotFound} />
          </Switch>
        </main>
      </div>
    </div>
  );
}

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      
      {user ? (
        <Route path="/*" component={DashboardLayout} />
      ) : (
        <Route>
          <Login />
        </Route>
      )}
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Router />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
