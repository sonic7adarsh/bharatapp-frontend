import React from 'react'
import AddProduct from './AddProduct'

// Public duplicate of AddProduct that is accessible without authentication
export default function AddProductPublic() {
  return <AddProduct />
}