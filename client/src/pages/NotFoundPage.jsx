import { Link } from "react-router-dom";

function NotFoundPage() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
        404
      </p>
      <h1 className="mt-2 text-3xl font-bold text-slate-950">Page not found</h1>
      <Link
        to="/"
        className="mt-6 inline-flex rounded-xl bg-blue-600 px-4 py-2.5 font-medium text-white hover:bg-blue-700"
      >
        Return to Create Quote
      </Link>
    </section>
  );
}

export default NotFoundPage;
