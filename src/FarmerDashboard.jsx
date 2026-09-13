import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

export default function FarmerDashboard({ user }) {
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({ 
    name: '', description: '', price: '', quantity: '', category: '', image: null 
  })

  useEffect(() => {
    fetchProducts()
    fetchOrders()
  }, [])

  async function fetchProducts() {
    const { data } = await supabase.from('products').select('*').eq('farmer_id', user.id).order('created_at', { ascending: false })
    if (data) setProducts(data)
  }

  async function fetchOrders() {
    // Fetch orders where the product belongs to this farmer
    const { data, error } = await supabase
      .from('orders')
      .select('*, products!inner(name, farmer_id), profiles!orders_buyer_id_fkey(full_name, phone)')
      .eq('products.farmer_id', user.id)
      .order('created_at', { ascending: false })
    
    if (data) setOrders(data)
  }

  async function addProduct(e) {
    e.preventDefault()
    setLoading(true)
    let imageUrl = null
    
    try {
      if (formData.image) {
        const fileExt = formData.image.name.split('.').pop()
        const fileName = `${user.id}-${Date.now()}.${fileExt}`
        const { error: uploadError } = await supabase.storage.from('product-images').upload(fileName, formData.image)
        if (uploadError) throw uploadError
        imageUrl = supabase.storage.from('product-images').getPublicUrl(fileName).data.publicUrl
      }

      const { error } = await supabase.from('products').insert([{
        farmer_id: user.id, name: formData.name, description: formData.description,
        price: parseFloat(formData.price), quantity_available: parseInt(formData.quantity),
        category: formData.category, image_url: imageUrl
      }])

      if (error) throw error
      setFormData({ name: '', description: '', price: '', quantity: '', category: '', image: null })
      fetchProducts()
      alert('Product added successfully!')
    } catch (error) {
      alert('Error: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  async function deleteProduct(productId) {
    if (window.confirm('Are you sure you want to delete this?')) {
      await supabase.from('products').delete().eq('id', productId)
      fetchProducts()
    }
  }

  async function updateOrderStatus(orderId, newStatus) {
    await supabase.from('orders').update({ status: newStatus }).eq('id', orderId)
    fetchOrders() // Refresh the UI
  }

  return (
    <div className="mt-6 flex flex-col gap-8">
      
      {/* ORDERS SECTION (NEW) */}
      <div>
        <h2 className="text-2xl font-bold mb-4 text-blue-800">Incoming Orders</h2>
        {orders.length === 0 ? (
          <p className="text-gray-500 bg-white p-6 rounded-lg shadow-sm border border-gray-100">No orders yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {orders.map(o => (
              <div key={o.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <div className="flex justify-between items-start mb-2">
                  <p className="font-bold text-lg">{o.products?.name}</p>
                  <span className={`px-2 py-1 text-xs font-bold rounded uppercase ${o.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : o.status === 'delivered' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                    {o.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-1">👤 Buyer: {o.profiles?.full_name}</p>
                <p className="text-sm text-gray-600 mb-3">📦 Qty: {o.quantity}kg | Total: <span className="font-bold text-green-700">₹{o.total_price}</span></p>
                
                <select 
                  value={o.status} 
                  onChange={(e) => updateOrderStatus(o.id, e.target.value)}
                  className="border p-2 rounded w-full bg-gray-50 text-sm font-medium"
                >
                  <option value="pending">Mark as Pending</option>
                  <option value="confirmed">Mark as Confirmed</option>
                  <option value="shipped">Mark as Shipped</option>
                  <option value="delivered">Mark as Delivered</option>
                </select>
              </div>
            ))}
          </div>
        )}
      </div>

      <hr className="border-gray-200" />

      {/* INVENTORY & ADD PRODUCT SECTION */}
      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
          <h2 className="text-2xl font-bold mb-4 text-green-700">Add New Produce</h2>
          <form onSubmit={addProduct} className="flex flex-col gap-4">
            <input type="text" placeholder="Product Name" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="border p-2 rounded" />
            <textarea placeholder="Description" required rows="3" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="border p-2 rounded" />
            <div className="flex gap-4">
              <input type="number" placeholder="Price (₹)" min="1" required value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="border p-2 rounded w-1/2" />
              <input type="number" placeholder="Qty (kg)" min="1" required value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} className="border p-2 rounded w-1/2" />
            </div>
            <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} required className="border p-2 rounded w-full bg-white">
              <option value="" disabled>Select a category</option>
              <option value="Grapes">Grapes</option>
              <option value="Raisins">Raisins</option>
              <option value="Other">Other</option>
            </select>
            <input type="file" accept="image/*" onChange={e => setFormData({...formData, image: e.target.files[0]})} className="border p-2 rounded" />
            <button type="submit" disabled={loading} className="bg-green-600 text-white p-3 rounded font-bold hover:bg-green-700">
              {loading ? 'Saving...' : 'List Product'}
            </button>
          </form>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-4 text-gray-800">My Inventory</h2>
          <div className="flex flex-col gap-4">
            {products.map(p => (
              <div key={p.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex gap-4 items-center">
                {p.image_url ? <img src={p.image_url} className="w-16 h-16 object-cover rounded" /> : <div className="w-16 h-16 bg-gray-100 rounded"></div>}
                <div className="flex-1">
                  <h3 className="font-bold">{p.name}</h3>
                  <p className="text-sm text-gray-600">₹{p.price}/kg | {p.quantity_available}kg left</p>
                </div>
                <button onClick={() => deleteProduct(p.id)} className="text-red-500 text-sm hover:underline">Delete</button>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  )
}