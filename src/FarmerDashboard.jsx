import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

export default function FarmerDashboard({ user }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({ 
    name: '', description: '', price: '', quantity: '', category: '', image: null 
  })

  useEffect(() => {
    fetchProducts()
  }, [])

  async function fetchProducts() {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('farmer_id', user.id)
      .order('created_at', { ascending: false })
    
    if (!error && data) {
      setProducts(data)
    }
  }

  async function addProduct(e) {
    e.preventDefault()
    setLoading(true)
    let imageUrl = null
    
    try {
      // 1. Upload image if one was selected
      if (formData.image) {
        const fileExt = formData.image.name.split('.').pop()
        const fileName = `${user.id}-${Date.now()}.${fileExt}`
        
        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('product-images')
          .upload(fileName, formData.image)

        if (uploadError) throw uploadError

        // Get the public URL for the uploaded image
        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName)
          
        imageUrl = publicUrl
      }

      // 2. Save product to database
      const { error } = await supabase.from('products').insert([{
        farmer_id: user.id,
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        quantity_available: parseInt(formData.quantity),
        category: formData.category,
        image_url: imageUrl
      }])

      if (error) throw error

      // Reset form and refresh list
      setFormData({ name: '', description: '', price: '', quantity: '', category: '', image: null })
      fetchProducts()
      alert('Product added successfully!')

    } catch (error) {
      alert('Error adding product: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  async function deleteProduct(productId) {
    if (window.confirm('Are you sure you want to delete this product?')) {
      await supabase.from('products').delete().eq('id', productId)
      fetchProducts()
    }
  }

  return (
    <div className="grid md:grid-cols-2 gap-8 mt-6">
      {/* Form Section */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
        <h2 className="text-2xl font-bold mb-4 text-green-700">Add New Produce</h2>
        <form onSubmit={addProduct} className="flex flex-col gap-4">
          <input type="text" placeholder="Product Name (e.g., Thompson Seedless Grapes)" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="border p-2 rounded focus:ring-2 focus:ring-green-500 outline-none" />
          
          <textarea placeholder="Description" required rows="3" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="border p-2 rounded focus:ring-2 focus:ring-green-500 outline-none" />
          
          <div className="flex gap-4">
            <div className="w-1/2">
              <label className="text-sm text-gray-600 font-bold mb-1 block">Price (₹ per kg)</label>
              <input type="number" min="1" required value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="border p-2 rounded w-full" />
            </div>
            <div className="w-1/2">
              <label className="text-sm text-gray-600 font-bold mb-1 block">Quantity (kg)</label>
              <input type="number" min="1" required value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} className="border p-2 rounded w-full" />
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-600 font-bold mb-1 block">Category</label>
            <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} required className="border p-2 rounded w-full bg-white">
              <option value="" disabled>Select a category</option>
              <option value="Grapes">Grapes</option>
              <option value="Raisins">Raisins</option>
              <option value="Other">Other Vegetables/Fruits</option>
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-600 font-bold mb-1 block">Product Photo</label>
            <input type="file" accept="image/*" onChange={e => setFormData({...formData, image: e.target.files[0]})} className="border p-2 rounded w-full file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100" />
          </div>

          <button type="submit" disabled={loading} className="bg-green-600 text-white p-3 rounded font-bold hover:bg-green-700 mt-2 disabled:bg-gray-400">
            {loading ? 'Saving...' : 'List Product'}
          </button>
        </form>
      </div>

      {/* Inventory Section */}
      <div>
        <h2 className="text-2xl font-bold mb-4 text-gray-800">My Inventory</h2>
        {products.length === 0 ? (
          <p className="text-gray-500 bg-white p-6 rounded-lg shadow-sm border border-gray-100 text-center">You haven't listed any products yet.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {products.map(p => (
              <div key={p.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex gap-4 items-center">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} className="w-20 h-20 object-cover rounded" />
                ) : (
                  <div className="w-20 h-20 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-400">No Image</div>
                )}
                <div className="flex-1">
                  <h3 className="font-bold text-lg">{p.name}</h3>
                  <p className="text-sm text-gray-600"><span className="inline-block bg-gray-100 px-2 py-0.5 rounded text-xs mr-2">{p.category}</span>₹{p.price}/kg</p>
                  <p className="text-sm font-medium text-green-700 mt-1">{p.quantity_available} kg available</p>
                </div>
                <button onClick={() => deleteProduct(p.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded transition-colors">
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}