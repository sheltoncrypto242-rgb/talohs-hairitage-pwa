import hairSolutionImg from "@/assets/hair-solution.jpg";
import shampooImg from "@/assets/shampoo.jpg";
import bundleImg from "@/assets/bundle.jpg";

export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
  active: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export const products: Product[] = [
  {
    id: "1",
    name: "Hair Solution",
    price: 25,
    description: "Premium hair growth solution for stronger, healthier hair. Delivery included.",
    image: hairSolutionImg,
    active: true,
  },
  {
    id: "2",
    name: "Shampoo",
    price: 15,
    description: "Nourishing shampoo for daily use. Gently cleanses and restores shine. Delivery included.",
    image: shampooImg,
    active: true,
  },
  {
    id: "3",
    name: "Bundle (3 Solutions + 1 Shampoo)",
    price: 80,
    description: "Complete hair care bundle — 3 Hair Solutions + 1 Shampoo. Best value. Delivery included.",
    image: bundleImg,
    active: true,
  },
];
