import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

export default function BuyerMarketplace({ user }) {
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [quantities, setQuantities] = useState({})

  useEffect(() => {
    fetchProducts()
  }, [])

  async function fetchProducts() {
    // Fetches products and the associated farmer's details
    const { data } = await supabase
      .from('products')
      .select('*, profiles(full_name, location)')
      .gt('quantity_available', 0) // Only show in-stock items
      .order('created_at', { ascending: false })
      
    if (data) setProducts(data)
  }

  function handleQuantityChange(productId, value) {
    setQuantities(prev => ({ ...prev, [productId]: parseInt(value) || 1 }))
  }

  async function placeOrder(product) {
    const qty = quantities[product.id] || 1
    const totalPrice = product.price * qty

    const { error } = await supabase.from('orders').insert([{
      buyer_id: user.id,
      product_id: product.id,
      quantity: qty,
      total_price: totalPrice,
      status: 'pending'
    }])
    
    if (error) {
      alert('Error placing order: ' + error.message)
      return
    }

    // Temporarily reduce stock in database (we will finalize this in the payment phase)
    await supabase.from('products')
      .update({ quantity_available: product.quantity_available - qty })
      .eq('id', product.id)

    alert(`Success! You ordered ${qty}kg of ${product.name}.`)
    fetchProducts()
  }

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = category === '' || p.category === category
    return matchesSearch && matchesCategory
  })

  return (
    <div className="mt-6">
      <div className="flex flex-col sm:flex-row gap-4 mb-8 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <input 
          type="text" 
          placeholder="Search produce (e.g. Grapes)..." 
          value={search} 
          onChange={e => setSearch(e.target.value)}
          className="border p-2 rounded flex-1 focus:ring-2 focus:ring-green-500 outline-none"
        />
        <select 
          value={category} 
          onChange={e => setCategory(e.target.value)}
          className="border p-2 rounded bg-white w-full sm:w-48 outline-none"
        >
          <option value="">All Categories</option>
          <option value="Grapes">Grapes</option>
          <option value="Raisins">Raisins</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map(p => (
          <div key={p.id} className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100 flex flex-col">
            {p.image_url ? (
               <img src={p.image_url} alt={p.name} className="w-full h-48 object-cover" />
            ) : (
               <div className="w-full h-48 bg-gray-100 flex items-center justify-center text-gray-400">No Image</div>
            )}
            
            <div className="p-4 flex flex-col flex-1 gap-2">
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-lg text-gray-800 leading-tight">{p.name}</h3>
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded font-medium">{p.category}</span>
              </div>
              
              <p className="text-sm text-gray-600 line-clamp-2 h-10">{p.description}</p>
              
              <div className="mt-2 text-sm text-gray-500 border-t pt-2">
                <p>👨‍🌾 Farmer: <span className="font-medium">{p.profiles?.full_name}</span></p>
                <p>📍 Location: {p.profiles?.location || 'Not specified'}</p>
              </div>

              <div className="flex justify-between items-center mt-auto pt-4">
                <span className="font-bold text-xl text-green-700">₹{p.price}<span className="text-sm text-gray-500 font-normal">/kg</span></span>
                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">{p.quantity_available}kg left</span>
              </div>

              <div className="flex gap-2 mt-3">
                <input 
                  type="number" 
                  min="1" 
                  max={p.quantity_available}
                  value={quantities[p.id] || 1}
                  onChange={(e) => handleQuantityChange(p.id, e.target.value)}
                  className="border p-2 rounded w-20 text-center"
                />
                <button 
                  onClick={() => placeOrder(p)} 
                  className="flex-1 bg-green-600 text-white py-2 rounded font-bold hover:bg-green-700 transition-colors"
                >
                  Place Order
                </button>
              </div>
            </div>
          </div>
        ))}
        {filteredProducts.length === 0 && (
          <div className="col-span-full text-center py-10 text-gray-500">
            No produce found matching your search.
          </div>
        )}
      </div>
    </div>
  )
}