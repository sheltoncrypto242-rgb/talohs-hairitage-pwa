import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

type PaymentMethod = "online" | "cod";

const CheckoutPage = () => {
  const { items, total, clearCart } = useCart();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState({
    customerName: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("online");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) {
      toast.error("Please login to checkout");
      navigate("/login");
    } else {
      setForm((f) => ({
        ...f,
        customerName: user.user_metadata?.name || "",
        email: user.email || "",
        phone: user.user_metadata?.phone_number || "",
      }));
    }
  }, [user, navigate]);

  if (items.length === 0) {
    return (
      <div className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center px-4">
        <h2 className="font-display text-2xl font-bold text-foreground">
          No items to checkout
        </h2>
        <Link to="/" className="mt-4 text-primary underline">
          Go back to shop
        </Link>
      </div>
    );
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.customerName || !form.email || !form.phone || !form.address) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setSubmitting(true);

      // 1️⃣ Generate Order Number
      const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;

      // 2️⃣ Insert Order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert([
          {
            user_id: user?.id,
            order_number: orderNumber,
            customer_name: form.customerName,
            phone: form.phone,
            address: form.address,
            notes: form.notes || null,
            total,
            payment_method: paymentMethod,
            payment_status: paymentMethod === "online" ? "Pending" : "Paid",
            email: form.email,
            delivery_status: "Preparing",
          },
        ])
        .select()
        .single();

      if (orderError) throw orderError;

      // 3️⃣ Insert Order Items
      const orderItems = items.map(({ product, quantity }) => ({
        order_id: order.id,
        product_id: product.id,
        quantity,
        price: product.price,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // 4️⃣ Send order email
      await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-order-email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            customerName: form.customerName,
            email: form.email,
            orderNumber: order.order_number,
            total,
            phone: order.phone,
            address: order.address,
            paymentMethod: order.payment_method,
            paymentStatus: order.payment_status,
            products: items.map((i) => ({
              name: i.product.name,
              qty: i.quantity,
            })),
          }),
        },
      );
      clearCart();

      // 5️⃣ If online payment, call create-payment and redirect
      if (paymentMethod === "online") {
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
              amount: total,
              orderNumber: order.order_number,
              customerName: form.customerName,
              products: items.map((i) => ({
                name: i.product.name,
                qty: i.quantity,
              })),
            }),
          },
        );

        const data = await res.json();

        if (!res.ok || !data.url) throw new Error("Failed to create payment");

        // Redirect to Fygaro checkout
        window.location.href = data.url;
        return; // stop further execution
      }

      // 6️⃣ Clear cart and navigate (for COD)
      navigate("/order-confirmation");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-10">
      <Link
        to="/cart"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to cart
      </Link>
      <h1 className="mt-4 font-display text-3xl font-bold text-foreground">
        Checkout
      </h1>

      <form onSubmit={handleSubmit} className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Info */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <h3 className="font-display text-lg font-semibold text-card-foreground">
              Delivery Details
            </h3>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Full Name *
              </label>
              <input
                name="customerName"
                value={form.customerName}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-input px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring bg-muted"
                placeholder="Your full name"
                disabled
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Phone Number *
              </label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                required
                type="tel"
                className="w-full rounded-lg border border-input bg-muted px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="+1 242-XXX-XXXX"
                disabled
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Email Address *
              </label>
              <input
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                type="email"
                className="w-full rounded-lg border border-input bg-muted px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="your@email.com"
                disabled
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Delivery Address *
              </label>
              <textarea
                name="address"
                value={form.address}
                onChange={handleChange}
                required
                rows={3}
                className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                placeholder="Street address, area, Nassau"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Notes (optional)
              </label>
              <input
                name="notes"
                value={form.notes}
                onChange={handleChange}
                className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Gate code, landmark, etc."
              />
            </div>
          </div>

          {/* Payment Method */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <h3 className="font-display text-lg font-semibold text-card-foreground">
              Payment Method
            </h3>
            <div className="">
              <button
                type="button"
                onClick={() => setPaymentMethod("online")}
                className={`rounded-lg border-2 p-4 text-left transition-colors ${
                  paymentMethod === "online"
                    ? "border-primary bg-accent"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <span className="font-medium text-foreground">Pay Online</span>
                <p className="mt-1 text-xs text-muted-foreground">
                  Card payment via secure gateway
                </p>
              </button>
              {/* <button
                type="button"
                onClick={() => setPaymentMethod("cod")}
                className={`rounded-lg border-2 p-4 text-left transition-colors ${
                  paymentMethod === "cod"
                    ? "border-primary bg-accent"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <span className="font-medium text-foreground">Cash on Delivery</span>
                <p className="mt-1 text-xs text-muted-foreground">Pay when your order arrives</p>
              </button> */}
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="rounded-xl border border-border bg-card p-6 h-fit">
          <h3 className="font-display text-lg font-semibold text-card-foreground">
            Order Summary
          </h3>
          <div className="mt-4 space-y-2">
            {items.map(({ product, quantity }) => (
              <div
                key={product.id}
                className="flex justify-between text-sm text-muted-foreground"
              >
                <span>
                  {product.name} × {quantity}
                </span>
                <span>${product.price * quantity}</span>
              </div>
            ))}
            <div className="border-t border-border pt-3 mt-3 flex justify-between text-sm text-muted-foreground">
              <span>Delivery</span>
              <span className="text-success font-medium">Free</span>
            </div>
            <div className="border-t border-border pt-3 mt-3 flex justify-between font-display text-lg font-bold text-foreground">
              <span>Total</span>
              <span>${total}</span>
            </div>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="mt-6 w-full rounded-lg bg-primary py-3 font-medium text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-50"
          >
            {submitting
              ? "Placing Order..."
              : paymentMethod === "online"
                ? `Pay $${total}`
                : `Place Order — $${total} COD`}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CheckoutPage;
