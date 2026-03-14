import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { HashLoader } from "react-spinners";
import {
  Truck,
  CreditCard,
  MapPin,
  Package,
  Calendar,
  Phone,
  User,
  FileText,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";

interface Item {
  quantity: number;
  price: number;
  products: {
    name: string;
  };
}

interface Order {
  order_number: string;
  customer_name: string;
  phone: string;
  address: string;
  notes: string;
  total: number;
  payment_method: string;
  payment_status: string;
  delivery_status: string;
  created_at: string;
  order_items: Item[];
}

export default function OrderDetail() {
  const { orderId } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("orders")
        .select(
          `
          *,
          order_items (
            quantity,
            price,
            products (
              name
            )
          )
          `,
        )
        .eq("order_number", orderId)
        .single();

      if (error) throw error;

      if (!data) {
        throw new Error("Order not found");
      }

      setOrder(data);
    } catch (err) {
      console.error("Error fetching order:", err);
      setError(err instanceof Error ? err.message : "Failed to load order");
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    fetchOrder();
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
        return <CheckCircle className="w-4 h-4" />;
      case "processing":
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "shipped":
        return <Truck className="w-4 h-4" />;
      case "cancelled":
      case "failed":
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <HashLoader color="#AB672B" size={60} />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Oops! Something went wrong
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={handleRetry}
            className="px-6 py-3 bg-[#AB672B] text-white rounded-xl hover:bg-[#8B4F1F] transition-all transform hover:scale-105 font-medium shadow-lg hover:shadow-xl"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // No order state
  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-10 h-10 text-yellow-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Order Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            The order you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-all font-medium"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Header with breadcrumb */}
        <div className="mb-6">
          <div className="flex items-center text-sm text-gray-600 mb-2">
            <span
              className="hover:text-[#AB672B] cursor-pointer"
              onClick={() => navigate("/orders")}
            >
              Orders
            </span>
            <ChevronRight className="w-4 h-4 mx-2" />
            <span className="text-[#AB672B] font-medium">
              Order #{order.order_number}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                <Package className="w-8 h-8 text-[#AB672B]" />
                Order #{order.order_number}
              </h1>
              <p className="text-gray-500 flex items-center gap-2 mt-1">
                <Calendar className="w-4 h-4" />
                {new Date(order.created_at).toLocaleString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>

            {/* Order summary badge */}
            <div className="bg-white px-6 py-3 rounded-xl shadow-sm border border-gray-100">
              <p className="text-sm text-gray-600">Total Amount</p>
              <p className="text-2xl font-bold text-[#AB672B]">
                ${order.total?.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Delivery Status */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-[#AB672B]/10 rounded-lg">
                    <Truck className="w-5 h-5 text-[#AB672B]" />
                  </div>
                  <h3 className="font-semibold text-gray-700">
                    Delivery Status
                  </h3>
                </div>
                <div
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border ${getStatusColor(order.delivery_status)}`}
                >
                  {getStatusIcon(order.delivery_status)}
                  {order.delivery_status}
                </div>
              </div>

              {/* Payment Status */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-[#AB672B]/10 rounded-lg">
                    <CreditCard className="w-5 h-5 text-[#AB672B]" />
                  </div>
                  <h3 className="font-semibold text-gray-700">
                    Payment Status
                  </h3>
                </div>
                <div
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border ${getStatusColor(order.payment_status)}`}
                >
                  {getStatusIcon(order.payment_status)}
                  {order.payment_status}
                </div>
                {order.payment_method && (
                  <p className="text-sm text-gray-500 mt-3">
                    via {order.payment_method}
                  </p>
                )}
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-[#AB672B]" />
                  <h3 className="font-semibold text-gray-800">Order Items</h3>
                </div>
              </div>

              <div className="divide-y divide-gray-100">
                {order.order_items.map((item, index) => (
                  <div
                    key={index}
                    className="p-5 hover:bg-gray-50/50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-800 mb-1">
                          {item.products?.name}
                        </h4>
                        <p className="text-sm text-gray-500">
                          Quantity: {item.quantity} × ${item.price}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-[#AB672B]">
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-5 bg-gray-50/80 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-700">Total</span>
                  <span className="text-xl font-bold text-[#AB672B]">
                    ${order.total?.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right column - Customer Info */}
          <div className="space-y-6">
            {/* Customer Details */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-[#AB672B]" />
                  <h3 className="font-semibold text-gray-800">
                    Customer Details
                  </h3>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Name</p>
                  <p className="font-medium text-gray-800">
                    {order.customer_name}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                    <Phone className="w-4 h-4" /> Phone
                  </p>
                  <p className="font-medium text-gray-800">{order.phone}</p>
                </div>
              </div>
            </div>

            {/* Delivery Address */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#AB672B]" />
                  <h3 className="font-semibold text-gray-800">
                    Delivery Address
                  </h3>
                </div>
              </div>

              <div className="p-5">
                <p className="text-gray-700 leading-relaxed">{order.address}</p>
              </div>
            </div>

            {/* Notes */}
            {order.notes && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[#AB672B]" />
                    <h3 className="font-semibold text-gray-800">Order Notes</h3>
                  </div>
                </div>

                <div className="p-5">
                  <p className="text-gray-700 italic">{order.notes}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
