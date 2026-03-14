import { Link } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

const OrderConfirmation = () => {
  return (
    <div className="container mx-auto flex min-h-[70vh] items-center justify-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-xl border border-border bg-card p-8 text-center shadow-lg"
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
          <CheckCircle2 className="h-8 w-8 text-success" />
        </div>
        <h1 className="mt-4 font-display text-2xl font-bold text-card-foreground">
          Order Placed Successfully!
        </h1>
        <p className="mt-2 text-muted-foreground">Thank you for your order.</p>

        <Link
          to="/"
          className="mt-8 inline-block rounded-lg bg-primary px-6 py-2.5 font-medium text-primary-foreground"
        >
          Continue Shopping
        </Link>
      </motion.div>
    </div>
  );
};

export default OrderConfirmation;
