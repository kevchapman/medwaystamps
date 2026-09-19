import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

// Config-based routing — one entry per existing route component, pointing
// at the files as they already exist (no renaming), so this migration stays
// a routing/rendering change, not a file-reorganization one. No loaders yet
// in this phase; every route below still fetches its own data client-side
// exactly as it did before, via app/lib/api.ts.
export default [
  index("routes/Home.tsx"),
  route("/sitemap.xml", "routes/sitemap.tsx"),
  route("/robots.txt", "routes/robots.tsx"),
  route("/catalog", "routes/Catalog.tsx"),
  route("/stamps/:id", "routes/StampDetail.tsx"),
  route("/cart", "routes/Cart.tsx"),
  route("/checkout/success", "routes/CheckoutSuccess.tsx"),
  route("/checkout/cancel", "routes/CheckoutCancel.tsx"),
  route("/admin/login", "routes/AdminLogin.tsx"),
  layout("routes/AdminLayout.tsx", [
    route("/admin", "routes/AdminDashboard.tsx"),
    route("/admin/stamps/new", "routes/AdminStampNew.tsx"),
    route("/admin/stamps/:id/edit", "routes/AdminStampEdit.tsx"),
  ]),
] satisfies RouteConfig;
