import { NavLink, Outlet } from 'react-router-dom';

const NAV_LINKS = [
  { to: '/vendor/dashboard', label: 'Dashboard' },
  { to: '/vendor/products', label: 'Productos' },
  { to: '/vendor/orders', label: 'Ordenes' },
];

const linkClass = ({ isActive }) =>
  `block px-4 py-2 rounded-md transition-colors ${
    isActive
      ? 'bg-kingsley-600 text-white'
      : 'text-gray-700 hover:bg-kingsley-100 hover:text-kingsley-700'
  }`;

const VendorLayout = () => (
  <div className="min-h-screen flex">
    <aside className="w-60 bg-white border-r border-gray-200 p-4 space-y-1">
      <div className="px-3 py-4 mb-2">
        <h1 className="text-xl font-bold text-kingsley-700">Kingsley Caps</h1>
        <p className="text-xs text-gray-500">Panel del vendedor</p>
      </div>
      {NAV_LINKS.map((link) => (
        <NavLink key={link.to} to={link.to} className={linkClass}>
          {link.label}
        </NavLink>
      ))}
    </aside>
    <main className="flex-1 p-8 overflow-auto">
      <Outlet />
    </main>
  </div>
);

export default VendorLayout;
