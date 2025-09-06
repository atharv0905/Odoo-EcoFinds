import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useCart } from '@/hooks/cart-context';
import { useNavigate } from 'react-router-dom';
import { apiService } from '@/lib/api';
import LayoutDashboard from '@/components/dashboard/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ShoppingCart, Search, Eye, Package, AlertTriangle } from 'lucide-react';
import type { Product, ProductsResponse } from '@/types';

export default function ProductsPage() {
  const { user } = useAuth();
  const { addToCart, cartProducts } = useCart();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [addingToCart, setAddingToCart] = useState<string | null>(null);

  // Load all products
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    setError(null);

    try {
      const response: ProductsResponse = await apiService.getAllProducts();
      setProducts(response.products || []);
    } catch (err) {
      console.error('Failed to load products:', err);
      setError('Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle search
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadProducts();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiService.searchProducts(searchQuery);
      setProducts(response.products || []);
    } catch (err) {
      console.error('Failed to search products:', err);
      setError('Failed to search products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle add to cart
  const handleAddToCart = async (product: Product) => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Check if user is trying to add their own product
    if (product.createdBy === user.uid) {
      alert('You cannot add your own products to cart.');
      return;
    }

    // Check stock
    if (product.stock <= 0) {
      alert('This product is out of stock.');
      return;
    }

    setAddingToCart(product._id);

    try {
      await addToCart(product._id, 1);
      // Success notification could be added here
    } catch (err) {
      console.error('Failed to add to cart:', err);
      alert('Failed to add product to cart. Please try again.');
    } finally {
      setAddingToCart(null);
    }
  };

  // Check if product is already in cart
  const isInCart = (productId: string) => {
    return cartProducts.some(cp => cp._id === productId);
  };

  // Get cart quantity for product
  const getCartQuantity = (productId: string) => {
    const cartProduct = cartProducts.find(cp => cp._id === productId);
    return cartProduct ? cartProduct.quantity : 0;
  };

  // Filter products based on search
  const filteredProducts = products.filter(product =>
    product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <LayoutDashboard>
      <div className="min-h-screen bg-gradient-to-br">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Package className="h-8 w-8 text-green-600" />
                EcoFinds Marketplace
              </h1>
              <p className="text-gray-600 mt-1">Discover sustainable products for a greener future</p>
            </div>
            <Button 
              onClick={() => navigate('/cart')}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            >
              <ShoppingCart className="h-4 w-4" />
              Cart ({cartProducts.reduce((sum, p) => sum + p.quantity, 0)})
            </Button>
          </div>

          {/* Search */}
          <div className="flex gap-2 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search for eco-friendly products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} variant="outline">
              Search
            </Button>
            {searchQuery && (
              <Button 
                onClick={() => {
                  setSearchQuery('');
                  loadProducts();
                }} 
                variant="ghost"
              >
                Clear
              </Button>
            )}
          </div>

          {/* Error State */}
          {error && (
            <Card className="mb-6 border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertTriangle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
                <Button onClick={loadProducts} variant="outline" className="mt-2" size="sm">
                  Try Again
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <Card key={index} className="overflow-hidden">
                  <Skeleton className="h-48 w-full" />
                  <CardContent className="p-4">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2 mb-2" />
                    <Skeleton className="h-4 w-1/4 mb-4" />
                    <Skeleton className="h-10 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <>
              {/* Products Count */}
              <div className="mb-4">
                <p className="text-gray-600">
                  Showing {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
                  {searchQuery && ` for "${searchQuery}"`}
                </p>
              </div>

              {/* Products Grid */}
              {filteredProducts.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {searchQuery ? 'No products found' : 'No products available'}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {searchQuery 
                        ? 'Try adjusting your search terms or browse all products.'
                        : 'Check back later for new eco-friendly products.'}
                    </p>
                    {searchQuery && (
                      <Button onClick={() => {
                        setSearchQuery('');
                        loadProducts();
                      }}>
                        View All Products
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredProducts.map((product) => (
                    <Card key={product._id} className="overflow-hidden hover:shadow-lg transition-shadow group cursor-pointer">
                      <div 
                        className="relative"
                        onClick={() => navigate(`/product/${product._id}`)}
                      >
                        <img 
                          src={product.image || '/placeholder.svg'} 
                          alt={product.title}
                          className="w-full h-48 object-cover group-hover:scale-105 transition-transform"
                        />
                        
                        {/* Stock Badge */}
                        {product.stock <= 0 ? (
                          <Badge className="absolute top-2 right-2 bg-red-500 hover:bg-red-600">
                            Out of Stock
                          </Badge>
                        ) : product.stock <= 5 ? (
                          <Badge className="absolute top-2 right-2 bg-orange-500 hover:bg-orange-600">
                            Low Stock ({product.stock})
                          </Badge>
                        ) : null}

                        {/* Own Product Badge */}
                        {product.createdBy === user?.uid && (
                          <Badge className="absolute top-2 left-2 bg-purple-500 hover:bg-purple-600">
                            Your Product
                          </Badge>
                        )}
                      </div>

                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <CardTitle 
                            className="text-lg line-clamp-2 group-hover:text-green-600 transition-colors cursor-pointer"
                            onClick={() => navigate(`/product/${product._id}`)}
                          >
                            {product.title}
                          </CardTitle>
                        </div>
                        <CardDescription className="line-clamp-2">
                          {product.description}
                        </CardDescription>
                      </CardHeader>

                      <CardContent className="pt-0">
                        <div className="flex items-center justify-between mb-3">
                          <Badge variant="secondary" className="text-xs">
                            {product.category}
                          </Badge>
                          <div className="flex items-center text-sm text-gray-500">
                            <Eye className="h-3 w-3 mr-1" />
                            {product.views || 0}
                          </div>
                        </div>

                        <div className="flex items-center justify-between mb-3">
                          <span className="text-2xl font-bold text-green-600">
                            ₹{product.price.toFixed(2)}
                          </span>
                          <span className="text-sm text-gray-500">
                            Stock: {product.stock}
                          </span>
                        </div>

                        {/* Add to Cart Section */}
                        {isInCart(product._id) ? (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm text-green-600 bg-green-50 rounded px-2 py-1">
                              <span>In Cart: {getCartQuantity(product._id)}</span>
                              <ShoppingCart className="h-4 w-4" />
                            </div>
                            <Button 
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate('/cart');
                              }}
                              variant="outline" 
                              className="w-full"
                            >
                              View Cart
                            </Button>
                          </div>
                        ) : (
                          <Button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddToCart(product);
                            }}
                            disabled={
                              product.stock <= 0 || 
                              product.createdBy === user?.uid ||
                              addingToCart === product._id
                            }
                            className="w-full"
                            variant={product.createdBy === user?.uid ? "outline" : "default"}
                          >
                            {addingToCart === product._id ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Adding...
                              </>
                            ) : product.stock <= 0 ? (
                              'Out of Stock'
                            ) : product.createdBy === user?.uid ? (
                              'Your Product'
                            ) : (
                              <>
                                <ShoppingCart className="h-4 w-4 mr-2" />
                                Add to Cart
                              </>
                            )}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </LayoutDashboard>
  );
}
