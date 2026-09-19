import {
  isRouteErrorResponse,
  Link,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import type { Route } from "./+types/root";
import { CartProvider, useCart } from "./context/CartContext";
import { AdminAuthProvider, useAdminAuth } from "./context/AdminAuthContext";
import Logo from "./components/Logo";
import "./index.css";

export const links: Route.LinksFunction = () => [
  { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Spectral:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Work+Sans:wght@400;500;600&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Medway Stamps</title>
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

// The persistent site chrome (nav/footer) and the two Context providers that
// used to wrap <App/> in main.tsx — root.tsx is now both of those things at
// once, since React Router's framework mode has no separate main.tsx entry.
export default function Root() {
  return (
    <AdminAuthProvider>
      <CartProvider>
        <Chrome />
      </CartProvider>
    </AdminAuthProvider>
  );
}

function Chrome() {
  const { lines } = useCart();
  const { admin } = useAdminAuth();

  return (
    <div className="app">
      <nav className="site-nav">
        <div className="site-nav__inner">
          <Link to="/" className="wordmark">
            <Logo size={32} />
            Medway Stamps
          </Link>
          <div className="links">
            <Link to="/catalog">Catalogue</Link>
            <Link to="/cart" className="cart-link">
              Cart ({lines.length})
            </Link>
          </div>
        </div>
      </nav>

      <main>
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="site-footer__inner">
          Medway Stamps &mdash; Rare &amp; Collectible British Philately
          {admin && (
            <>
              {" "}
              &middot; <Link to="/admin">Admin</Link>
            </>
          )}
        </div>
      </footer>
    </div>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details = error.status === 404 ? "The requested page could not be found." : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
  }

  return (
    <main style={{ padding: "48px 64px" }}>
      <h1>{message}</h1>
      <p>{details}</p>
    </main>
  );
}
