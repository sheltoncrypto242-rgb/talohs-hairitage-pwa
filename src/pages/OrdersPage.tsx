import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { HashLoader } from "react-spinners";
import {
  Package,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  CreditCard,
  AlertCircle,
  Search,
  ShoppingBag,
  Filter,
} from "lucide-react";

interface Order {
  id: number;
  order_number: string;
  total: number;
  payment_status: string;
  delivery_status: string;
  created_at: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("orders")
        .select(
          "id, order_number, total, payment_status, delivery_status, created_at",
        )
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setOrders(data || []);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError(err instanceof Error ? err.message : "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    fetchOrders();
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "delivered":
      case "paid":
        return "bg-green-100 text-green-800 border-green-200";
      case "processing":
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "shipped":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "cancelled":
      case "failed":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case "delivered":
      case "paid":
        return <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />;
      case "processing":
      case "pending":
        return <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />;
      case "shipped":
        return <Truck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />;
      case "cancelled":
      case "failed":
        return <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />;
      default:
        return <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />;
    }
  };

  const filteredOrders = orders.filter((order) =>
    order.order_number.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Loading state
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center">
          <HashLoader color="#AB672B" size={40} />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 sm:w-10 sm:h-10 text-red-500" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
            Failed to Load Orders
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mb-6">{error}</p>
          <button
            onClick={handleRetry}
            className="w-full sm:w-auto px-6 py-3 bg-[#AB672B] text-white rounded-xl hover:bg-[#8B4F1F] transition-all font-medium shadow-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          {/* Breadcrumb - Hidden on mobile */}
          <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600 mb-2">
            <span className="text-[#AB672B] font-medium">Dashboard</span>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-800">My Orders</span>
          </div>

          {/* Mobile Header */}
          <div className="sm:hidden flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-800">My Orders</h1>
            <button
              onClick={() => setShowMobileSearch(!showMobileSearch)}
              className="p-2 bg-white rounded-lg shadow-sm border border-gray-200"
            >
              <Search className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Desktop Header */}
          <div className="hidden sm:flex sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-3">
                <Package className="w-6 h-6 md:w-8 md:h-8 text-[#AB672B]" />
                My Orders
              </h1>
              <p className="text-sm md:text-base text-gray-500 mt-1">
                {orders.length} {orders.length === 1 ? "order" : "orders"} found
              </p>
            </div>

            {/* Desktop Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#AB672B] focus:border-transparent w-64"
              />
            </div>
          </div>

          {/* Mobile Search Bar - Toggleable */}
          {showMobileSearch && (
            <div className="sm:hidden mb-4 animate-slideDown">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by order number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#AB672B] focus:border-transparent"
                  autoFocus
                />
              </div>
            </div>
          )}

          {/* Mobile Stats */}
          <div className="sm:hidden flex items-center justify-between mt-2">
            <p className="text-sm text-gray-500">
              {filteredOrders.length}{" "}
              {filteredOrders.length === 1 ? "order" : "orders"}
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="text-xs text-[#AB672B] font-medium"
              >
                Clear filter
              </button>
            )}
          </div>
        </div>

        {/* Orders List */}
        {filteredOrders.length > 0 ? (
          <div className="space-y-3 sm:space-y-4">
            {filteredOrders.map((order) => (
              <Link
                key={order.id}
                to={`/orders/${order.order_number}`}
                className="block bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all active:scale-[0.99]"
              >
                <div className="p-4 sm:p-6">
                  {/* Mobile Layout */}
                  <div className="sm:hidden">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-800 mb-1">
                          #{order.order_number}
                        </h3>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(order.created_at).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                              },
                            )}
                          </div>
                          <span className="text-gray-300">•</span>
                          <div
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.delivery_status)}`}
                          >
                            {getStatusIcon(order.delivery_status)}
                            <span className="text-xs">
                              {order.delivery_status}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Total</p>
                        <p className="text-lg font-bold text-[#AB672B]">
                          ${order.total?.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-gray-400" />
                        <span
                          className={`text-xs font-medium capitalize ${order.payment_status?.toLowerCase() === "paid" ? "text-green-600" : "text-yellow-600"}`}
                        >
                          {order.payment_status}
                        </span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden sm:block">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      {/* Left side - Order Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-base md:text-lg font-semibold text-gray-800">
                            Order #{order.order_number}
                          </h3>
                          <div
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(order.delivery_status)}`}
                          >
                            {getStatusIcon(order.delivery_status)}
                            {order.delivery_status}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-sm">
                          <div className="flex items-center gap-1 text-gray-500">
                            <Clock className="w-4 h-4" />
                            {new Date(order.created_at).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              },
                            )}
                          </div>

                          <div className="flex items-center gap-1 text-gray-500">
                            <CreditCard className="w-4 h-4" />
                            <span
                              className={`capitalize ${order.payment_status?.toLowerCase() === "paid" ? "text-green-600" : "text-yellow-600"}`}
                            >
                              {order.payment_status}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right side - Total & Action */}
                      <div className="flex items-center gap-4 sm:gap-6">
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Total</p>
                          <p className="text-xl md:text-2xl font-bold text-[#AB672B]">
                            ${order.total?.toFixed(2)}
                          </p>
                        </div>

                        <div className="w-8 h-8 bg-[#AB672B]/10 rounded-full flex items-center justify-center group-hover:bg-[#AB672B]/20 transition-colors">
                          <ChevronRight className="w-5 h-5 text-[#AB672B]" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-12 text-center">
            {searchTerm ? (
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">
                  No matching orders
                </h3>
                <p className="text-sm sm:text-base text-gray-600 mb-6">
                  No orders found matching "{searchTerm}". Try a different
                  search term.
                </p>
                <button
                  onClick={() => setSearchTerm("")}
                  className="text-sm sm:text-base text-[#AB672B] hover:text-[#8B4F1F] font-medium"
                >
                  Clear search
                </button>
              </div>
            ) : (
              <div className="max-w-md mx-auto">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-[#AB672B]/10 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <ShoppingBag className="w-10 h-10 sm:w-12 sm:h-12 text-[#AB672B]" />
                </div>
                <h3 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-2 sm:mb-3">
                  No orders yet
                </h3>
                <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8">
                  Looks like you haven't placed any orders yet. Start shopping
                  to see your orders here!
                </p>
                <Link
                  to="/#products"
                  className="inline-flex items-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 bg-[#AB672B] text-white rounded-xl hover:bg-[#8B4F1F] transition-all text-sm sm:text-base font-medium shadow-lg"
                >
                  Start Shopping
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add animation styles */}
      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideDown {
          animation: slideDown 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
