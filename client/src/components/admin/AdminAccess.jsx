function AdminAccess({
  adminPassword,
  errorMessage,
  onPasswordChange,
  onSubmit,
}) {
  return (
    <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-950">Admin Access</h2>
      <p className="mt-1 text-sm text-slate-500">
        Enter the administrator password to manage inventory.
      </p>

      <form
        onSubmit={onSubmit}
        className="mt-5 flex flex-col gap-3 md:flex-row"
      >
        <input
          type="password"
          placeholder="Enter admin password"
          value={adminPassword}
          onChange={onPasswordChange}
          className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
        <button
          type="submit"
          className="rounded-xl bg-blue-600 px-4 py-2.5 font-medium text-white transition hover:bg-blue-700"
        >
          Enter Admin Mode
        </button>
      </form>

      {errorMessage && (
        <p className="mt-3 text-sm text-red-600">{errorMessage}</p>
      )}
    </section>
  );
}

export default AdminAccess;
