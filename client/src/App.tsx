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
import BuyerLogisticsPage from "@/pages/buyer/logistics";
import BuyerOrderDetail from "@/pages/buyer/order-detail";
import BuyerSupport from "@/pages/buyer/support";
import SupplierDashboard from "@/pages/supplier/dashboard";
import SupplierOnboarding from "@/pages/supplier/onboarding";
import SupplierRFQs from "@/pages/supplier/rfqs";
import SupplierQuotes from "@/pages/supplier/quotes";
import SupplierRFQDetail from "@/pages/supplier/rfq-detail";
import SupplierOrders from "@/pages/supplier/orders";
import SupplierOrderDetail from "@/pages/supplier/order-detail";
import SupplierPayouts from "@/pages/supplier/payouts";
import SupplierPayments from "@/pages/supplier/payments";
import SupplierEarlyPayPage from "@/pages/supplier/earlypay";
import SupplierSupport from "@/pages/supplier/support";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminRFQManagement from "@/pages/admin/rfq-management";
import AdminRFQDetail from "@/pages/admin/rfq-detail";
import AdminSupplierManagement from "@/pages/admin/supplier-management";
import AdminOfferComposer from "@/pages/admin/offer-composer";
import AdminOrderManagement from "@/pages/admin/order-management";
import AdminPaymentConfig from "@/pages/admin/payment-config";
import AdminPayments from "@/pages/admin/payments";
import AdminLogisticsPage from "./pages/admin/logistics";
import AdminEarlyPayPage from "@/pages/admin/earlypay";
import AdminSupport from "@/pages/admin/support";
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

  const currentPath = window.location.pathname;
  
  const buyerSidebarItems = [
    { icon: 'fas fa-home', label: 'Dashboard', href: '/buyer/dashboard', active: currentPath === '/buyer/dashboard' },
    { icon: 'fas fa-plus-circle', label: 'Create RFQ', href: '/buyer/create-rfq', active: currentPath === '/buyer/create-rfq' },
    { icon: 'fas fa-file-alt', label: 'My RFQs', href: '/buyer/rfqs', active: currentPath === '/buyer/rfqs' },
    { icon: 'fas fa-handshake', label: 'Offers', href: '/buyer/offers', active: currentPath === '/buyer/offers' },
    { icon: 'fas fa-shopping-cart', label: 'Orders', href: '/buyer/orders', active: currentPath === '/buyer/orders' },
    { icon: 'fas fa-truck', label: 'Logistics', href: '/buyer/logistics', active: currentPath === '/buyer/logistics' },
    { icon: 'fas fa-credit-card', label: 'Payments', href: '/buyer/payments', active: currentPath === '/buyer/payments' },
    { icon: 'fas fa-headset', label: 'Support', href: '/buyer/support', active: currentPath === '/buyer/support' },
  ];

  const supplierSidebarItems = [
    { icon: 'fas fa-home', label: 'Dashboard', href: '/supplier/dashboard', active: currentPath === '/supplier/dashboard' },
    { icon: 'fas fa-file-invoice', label: 'Invited RFQs', href: '/supplier/rfqs', active: currentPath === '/supplier/rfqs' },
    { icon: 'fas fa-quote-right', label: 'My Quotes', href: '/supplier/quotes', active: currentPath === '/supplier/quotes' },
    { icon: 'fas fa-shopping-cart', label: 'Orders', href: '/supplier/orders', active: currentPath === '/supplier/orders' },
    { icon: 'fas fa-credit-card', label: 'Payments', href: '/supplier/payments', active: currentPath === '/supplier/payments' },
    { icon: 'fas fa-bolt', label: 'EarlyPay', href: '/supplier/earlypay', active: currentPath === '/supplier/earlypay' },
    { icon: 'fas fa-money-bill-wave', label: 'Payouts', href: '/supplier/payouts', active: currentPath === '/supplier/payouts' },
    { icon: 'fas fa-headset', label: 'Support', href: '/supplier/support', active: currentPath === '/supplier/support' },
    { icon: 'fas fa-user-cog', label: 'Profile', href: '/supplier/onboarding', active: currentPath === '/supplier/onboarding' },
  ];

  const adminSidebarItems = [
    { icon: 'fas fa-home', label: 'Dashboard', href: '/admin/dashboard', active: currentPath === '/admin/dashboard' },
    { icon: 'fas fa-file-alt', label: 'RFQ Management', href: '/admin/rfqs', active: currentPath === '/admin/rfqs' },
    { icon: 'fas fa-users', label: 'Supplier Management', href: '/admin/suppliers', active: currentPath === '/admin/suppliers' },
    { icon: 'fas fa-handshake', label: 'Offer Composer', href: '/admin/offers', active: currentPath === '/admin/offers' },
    { icon: 'fas fa-shopping-cart', label: 'Order Management', href: '/admin/orders', active: currentPath === '/admin/orders' },
    { icon: 'fas fa-truck', label: 'Logistics', href: '/admin/logistics', active: currentPath === '/admin/logistics' },
    { icon: 'fas fa-bolt', label: 'EarlyPay', href: '/admin/earlypay', active: currentPath === '/admin/earlypay' },
    { icon: 'fas fa-credit-card', label: 'Payments', href: '/admin/payments', active: currentPath === '/admin/payments' },
    { icon: 'fas fa-tools', label: 'Payment Configuration', href: '/admin/payment-config', active: currentPath === '/admin/payment-config' },
    { icon: 'fas fa-headset', label: 'Support', href: '/admin/support', active: currentPath === '/admin/support' },
    { icon: 'fas fa-chart-bar', label: 'Analytics', href: '#', active: false },
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
            <Route path="/buyer/order/:id" component={BuyerOrderDetail} />
            <Route path="/buyer/payments" component={BuyerPayments} />
            <Route path="/buyer/logistics" component={BuyerLogisticsPage} />
            <Route path="/buyer/support" component={BuyerSupport} />
            
            {/* Supplier Routes */}
            <Route path="/supplier/dashboard" component={SupplierDashboard} />
            <Route path="/supplier/onboarding" component={SupplierOnboarding} />
            <Route path="/supplier/rfqs" component={SupplierRFQs} />
            <Route path="/supplier/quotes" component={SupplierQuotes} />
            <Route path="/supplier/rfq/:id" component={SupplierRFQDetail} />
            <Route path="/supplier/orders" component={SupplierOrders} />
            <Route path="/supplier/order/:id" component={SupplierOrderDetail} />
            <Route path="/supplier/earlypay" component={SupplierEarlyPayPage} />
            <Route path="/supplier/payouts" component={SupplierPayouts} />
            <Route path="/supplier/payments" component={SupplierPayments} />
            <Route path="/supplier/support" component={SupplierSupport} />
            
            {/* Admin Routes */}
            <Route path="/admin/dashboard" component={AdminDashboard} />
            <Route path="/admin/rfqs" component={AdminRFQManagement} />
            <Route path="/admin/rfq/:id" component={AdminRFQDetail} />
            <Route path="/admin/suppliers" component={AdminSupplierManagement} />
            <Route path="/admin/offers" component={AdminOfferComposer} />
            <Route path="/admin/orders" component={AdminOrderManagement} />
            <Route path="/admin/payments" component={AdminPayments} />
            <Route path="/admin/logistics" component={AdminLogisticsPage} />
            <Route path="/admin/earlypay" component={AdminEarlyPayPage} />
            <Route path="/admin/payment-config" component={AdminPaymentConfig} />
            <Route path="/admin/support" component={AdminSupport} />
            
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
