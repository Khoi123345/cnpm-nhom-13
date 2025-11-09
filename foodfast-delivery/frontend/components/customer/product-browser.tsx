// ff/components/customer/product-browser.tsx

"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { API_ENDPOINTS } from "@/lib/environment" // ⭐️ SỬA: Xoá API_CONFIG
import { useCartContext } from "@/hooks/cart-provider"
import { ApiClient } from "@/lib/api-client" 

interface Product {
  _id: string
  name: string
  description: string
  price: number
  imageurl: string
  quantity: number 
  restaurant: { 
    _id: string;
    name: string;
    owner_id: string;
  }
}

export function ProductBrowser() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { addToCart } = useCartContext()

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null); 

        // ⭐️ SỬA: Dùng hằng số
        const response = await ApiClient.get<Product[]>(
          API_ENDPOINTS.GET_PRODUCTS
        );
        
        if (response.success) {
          const availableProducts = (response.data || []).filter(
             (p) => p.quantity > 0
           );
           setProducts(availableProducts);
        } else {
          setError(response.message);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleAddToCart = (product: Product) => {
    addToCart({
      id: product._id,
      name: product.name,
      price: product.price,
      restaurantId: product.restaurant?.owner_id || "unknown", 
    })
  }

  if (loading) return <div className="text-center py-8">Loading products...</div>
  if (error) return <div className="text-center py-8 text-destructive">{error}</div>
  
  if (products.length === 0) {
    return (
       <Card className="p-10 text-center text-foreground/70 col-span-full">
         No menu items available at the moment.
       </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {products.map((product) => (
        <Card key={product._id} className="overflow-hidden hover:shadow-lg transition-shadow">
          <div className="bg-muted h-40 flex items-center justify-center">
            {/* ... (phần image giữ nguyên) ... */}
            {product.imageurl ? (
              <img
                src={product.imageurl} 
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => (e.currentTarget.src = "/placeholder.jpg")} 
              />
            ) : (
              <img
                src={"/placeholder.jpg"} 
                alt={product.name}
                className="w-full h-full object-cover"
              />
            )}
          </div>

          <div className="p-4 space-y-3">
            <div>
              <h3 className="font-semibold line-clamp-2">{product.name}</h3>
              <p className="text-sm text-foreground/70 line-clamp-2">{product.description}</p>
            </div>

            {/* ⭐️ SỬA 3: Logic cho nút Add to Cart */}
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-primary">${product.price.toFixed(2)}</span>
              
              {product.quantity > 0 ? (
                <Button size="sm" onClick={() => handleAddToCart(product)}>
                  Add to Cart
                </Button>
              ) : (
                <Button size="sm" disabled variant="outline">
                  Out of Stock
                </Button>
              )}
            </div>
            {/* ⭐️ KẾT THÚC SỬA 3 */}

          </div>
        </Card>
      ))}
    </div>
  )
}