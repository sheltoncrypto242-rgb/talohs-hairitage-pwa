import { Plus } from "lucide-react";
import type { Product } from "@/lib/products";
import { useCart } from "@/context/CartContext";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleAdd = () => {
    addToCart(product); // Add product to cart
    toast.success(`${product.name} added to cart`);

    if (!user) {
      // Redirect to login if not authenticated
      toast.info("Please login to complete your purchase");
      navigate("/login");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="aspect-square overflow-hidden bg-secondary">
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="p-5">
        <h3 className="font-display text-lg font-semibold text-card-foreground">
          {product.name}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
          {product.description}
        </p>
        <div className="mt-4 flex items-center justify-between">
          <span className="font-display text-2xl font-bold text-foreground">
            ${product.price}
          </span>
          <button
            onClick={handleAdd}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Add to Cart
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
