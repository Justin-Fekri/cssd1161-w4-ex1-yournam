import { Outlet } from 'react-router-dom';
import { Header } from '../components/Header';

export default function RootLayout() {
  return (
    <div className="min-h-dvh bg-gray-50 text-gray-900">
      <Header />
      <Outlet />
      <footer className="border-t mt-12">
        <div className="container py-8 text-sm text-gray-600">© {new Date().getFullYear()} CellShop. All rights reserved.</div>
      </footer>
    </div>
  );
}
