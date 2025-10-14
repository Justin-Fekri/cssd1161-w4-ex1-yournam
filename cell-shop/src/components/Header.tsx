import { Link, NavLink } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export function Header() {
  const { itemCount } = useCart();

  return (
    <header className="border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-0 z-40">
      <div className="container flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <span className="inline-block h-6 w-6 rounded bg-blue-600"></span>
          <span>CellShop</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <NavLink to="/" end className={({ isActive }) => isActive ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'}>Home</NavLink>
          <NavLink to="/catalog" className={({ isActive }) => isActive ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'}>Catalog</NavLink>
          <NavLink to="/cart" className={({ isActive }) => isActive ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'}>
            Cart{itemCount > 0 && <span className="ml-1 rounded bg-blue-600 px-1.5 py-0.5 text-white text-xs">{itemCount}</span>}
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
