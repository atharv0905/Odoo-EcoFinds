'use client';

import { useState, useEffect } from 'react';
import AdminAuthGuard from '../../../components/AdminAuthGuard';
import AdminLayout from '../../../components/AdminLayout';

export default function ManualPaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(null);

  useEffect(() => {
    fetchManualPayments();
  }, []);

  const fetchManualPayments = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/payments?filter=manual&status=unpaid');
      if (!response.ok) {
        throw new Error('Failed to fetch manual payments');
      }
      const data = await response.json();
      setPayments(data.payments);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const markPaymentAsPaid = async (orderId) => {
    try {
      setProcessingPayment(orderId);
      const response = await fetch('/api/admin/payments', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: orderId,
          action: 'mark_manual_paid'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to mark payment as paid');
      }

      // Remove the payment from the list since it's now paid
      setPayments(prev => prev.filter(payment => payment._id !== orderId));
      
      // Show success message (you could add a toast notification here)
      alert('Payment marked as sent successfully!');
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setProcessingPayment(null);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <AdminAuthGuard>
        <AdminLayout>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        </AdminLayout>
      </AdminAuthGuard>
    );
  }

  if (error) {
    return (
      <AdminAuthGuard>
        <AdminLayout>
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-sm text-red-600">Error: {error}</div>
          </div>
        </AdminLayout>
      </AdminAuthGuard>
    );
  }

  return (
    <AdminAuthGuard>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Manual Payments Management</h2>
                <p className="text-gray-600 mt-1">
                  Manage pending manual payments. Mark them as sent once you've processed the payment.
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-purple-600">{payments.length}</p>
                <p className="text-sm text-gray-500">Pending Payments</p>
              </div>
            </div>
          </div>

          {/* Manual Payments Cards */}
          {payments.length > 0 ? (
            <div className="space-y-6">
              {payments.map((payment) => (
                <div key={payment._id} className="bg-white rounded-lg shadow-md border-l-4 border-l-purple-500">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Order #{payment._id.slice(-8)}
                        </h3>
                        <p className="text-2xl font-bold text-purple-600 mt-1">
                          {formatCurrency(payment.totalAmount)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Pending Payment
                        </span>
                        <p className="text-sm text-gray-500 mt-1">
                          {formatDate(payment.createdAt)}
                        </p>
                      </div>
                    </div>

                    {/* Buyer Information */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <h4 className="font-medium text-gray-900 mb-2">Buyer Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Name</p>
                          <p className="font-medium">{payment.buyer?.name || 'Unknown'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Email</p>
                          <p className="font-medium">{payment.buyer?.email || 'Unknown'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Phone</p>
                          <p className="font-medium">{payment.phoneNumber || 'Not provided'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Shipping Address */}
                    {payment.shippingAddress && (
                      <div className="bg-blue-50 rounded-lg p-4 mb-4">
                        <h4 className="font-medium text-gray-900 mb-2">Shipping Address</h4>
                        <p className="text-sm text-gray-700">
                          {payment.shippingAddress.street}<br />
                          {payment.shippingAddress.city}, {payment.shippingAddress.state} - {payment.shippingAddress.zipCode}<br />
                          {payment.shippingAddress.country}
                        </p>
                      </div>
                    )}

                    {/* Sellers Information */}
                    {payment.sellers && payment.sellers.length > 0 && (
                      <div className="bg-green-50 rounded-lg p-4 mb-4">
                        <h4 className="font-medium text-gray-900 mb-2">Sellers</h4>
                        <div className="flex flex-wrap gap-2">
                          {payment.sellers.map((seller, index) => (
                            <div key={index} className="bg-white px-3 py-1 rounded-md border">
                              <p className="text-sm font-medium">{seller.name || 'Unknown'}</p>
                              <p className="text-xs text-gray-500">{seller.email || 'Unknown'}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Product Orders */}
                    {payment.productOrders && payment.productOrders.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-medium text-gray-900 mb-2">Items Ordered</h4>
                        <div className="space-y-2">
                          {payment.productOrders.map((productOrder, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <div className="flex items-center">
                                {productOrder.productId?.image && (
                                  <img 
                                    src={productOrder.productId.image} 
                                    alt={productOrder.productId.title}
                                    className="w-10 h-10 object-cover rounded mr-3"
                                  />
                                )}
                                <div>
                                  <p className="font-medium text-sm">
                                    {productOrder.productId?.title || 'Unknown Product'}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    Qty: {productOrder.quantity} × {formatCurrency(productOrder.unitPrice)}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-medium text-sm">
                                  {formatCurrency(productOrder.totalPrice)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    {payment.notes && (
                      <div className="mb-4">
                        <h4 className="font-medium text-gray-900 mb-1">Order Notes</h4>
                        <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                          {payment.notes}
                        </p>
                      </div>
                    )}

                    {/* Action Button */}
                    <div className="flex justify-end pt-4 border-t">
                      <button
                        onClick={() => markPaymentAsPaid(payment._id)}
                        disabled={processingPayment === payment._id}
                        className="bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white px-6 py-2 rounded-md font-medium transition-colors duration-200 flex items-center"
                      >
                        {processingPayment === payment._id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Processing...
                          </>
                        ) : (
                          <>
                            ✓ Mark as Paid
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">All Caught Up!</h3>
              <p className="text-gray-500">
                No pending manual payments at the moment. All payments have been processed.
              </p>
              <button
                onClick={fetchManualPayments}
                className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
              >
                Refresh
              </button>
            </div>
          )}
        </div>
      </AdminLayout>
    </AdminAuthGuard>
  );
}
