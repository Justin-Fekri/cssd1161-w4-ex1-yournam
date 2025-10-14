import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <main>
      <section className="bg-gradient-to-br from-blue-50 to-white">
        <div className="container py-16 grid gap-10 lg:grid-cols-2 items-center">
          <div className="space-y-6">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">Your next phone is here</h1>
            <p className="text-gray-600 text-lg">Shop the latest smartphones from Apple, Samsung, Google and more. Fast shipping and easy returns.</p>
            <div className="flex gap-3">
              <Link to="/catalog" className="rounded-md bg-blue-600 px-4 py-2.5 text-white font-medium hover:bg-blue-700">Shop now</Link>
              <a href="#features" className="rounded-md border px-4 py-2.5 font-medium hover:bg-gray-50">Why us</a>
            </div>
          </div>
          <div className="aspect-[4/3] bg-[url('https://images.unsplash.com/photo-1598327106026-d78b9d351035?auto=format&fit=crop&w=1200&q=80')] bg-cover bg-center rounded-xl shadow-inner" aria-hidden />
        </div>
      </section>

      <section id="features" className="border-t">
        <div className="container py-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-lg ring-1 ring-gray-200 bg-white">
            <div className="font-semibold">Fast shipping</div>
            <div className="text-gray-600 text-sm mt-1">Get your new phone delivered in 2–3 days.</div>
          </div>
          <div className="p-6 rounded-lg ring-1 ring-gray-200 bg-white">
            <div className="font-semibold">Hassle-free returns</div>
            <div className="text-gray-600 text-sm mt-1">30-day returns with prepaid labels.</div>
          </div>
          <div className="p-6 rounded-lg ring-1 ring-gray-200 bg-white">
            <div className="font-semibold">Secure checkout</div>
            <div className="text-gray-600 text-sm mt-1">Trusted payment providers and encryption.</div>
          </div>
          <div className="p-6 rounded-lg ring-1 ring-gray-200 bg-white">
            <div className="font-semibold">Expert support</div>
            <div className="text-gray-600 text-sm mt-1">Chat with our team for recommendations.</div>
          </div>
        </div>
      </section>
    </main>
  );
}
