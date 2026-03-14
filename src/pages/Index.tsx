import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import ProductCard from "@/components/ProductCard";
import HeroSection from "@/components/HeroSection";
import { ProductSkeleton } from "@/components/ProductSkeleton";
import hairSolutionImg from "@/assets/hair-solution.jpg";
import shampooImg from "@/assets/shampoo.jpg";
import bundleImg from "@/assets/bundle.jpg";

type Product = {
  id: string;
  name: string;
  price: number;
  active: boolean;
};

const productImages: Record<string, string> = {
  "Hair Solution": hairSolutionImg,
  Shampoo: shampooImg,
  "Bundle (3 Solutions + 1 Shampoo)": bundleImg,
};

const Index = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("active", true)
        .order("created_at", { ascending: true });

      if (error) {
        setError(error.message);
      } else {
        const enrichedProducts = data.map((product) => ({
          ...product,
          image: productImages[product.name] || hairSolutionImg,
        }));

        setProducts(enrichedProducts);
      }

      setLoading(false);
    };

    fetchProducts();
  }, []);

  return (
    <div className="min-h-screen">
      <HeroSection />

      <section id="products" className="container mx-auto px-4 py-16">
        <h2 className="font-display text-3xl font-bold text-foreground text-center">
          Our Products
        </h2>
        <p className="mt-2 text-center text-muted-foreground">
          All prices include free local delivery
        </p>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {loading &&
            Array.from({ length: 3 }).map((_, i) => (
              <ProductSkeleton key={i} />
            ))}

          {!loading && error && (
            <p className="text-center text-red-500 col-span-full">
              Failed to load products
            </p>
          )}

          {!loading &&
            !error &&
            products.map((product) => (
              <ProductCard key={product.id} product={product as any} />
            ))}
        </div>
      </section>
    </div>
  );
};

export default Index;
