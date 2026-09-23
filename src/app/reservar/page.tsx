{usarCat && !categoria && !servicio && (
  <div className="space-y-3">
    <p className="text-sm" style={{ color: "var(--muted)" }}>Elegí una categoría</p>
    {categorias.map(([c, info]) => (
      <button
        key={c}
        onClick={() => setCategoria(c)}
        className="group flex w-full items-center gap-3 overflow-hidden px-2 py-2 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
        style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14 }}
      >
        <span className="h-14 w-14 shrink-0 overflow-hidden" style={{ borderRadius: 10, background: "var(--line)" }}>
          {info.foto ? (
            <img
              src={info.foto}
              alt=""
              className="h-full w-full object-cover transition duration-200 group-hover:scale-110"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-lg" style={{ fontFamily: "Georgia, Times, serif" }}>
              {c.slice(0, 1)}
            </span>
          )}
        </span>
        <span className="min-w-0 flex-1">
          <p className="truncate text-lg" style={{ fontFamily: "Georgia, Times, serif" }}>{c}</p>
          <p className="text-xs" style={{ color: "var(--muted)" }}>
            {info.n} servicio{info.n > 1 ? "s" : ""}
          </p>
        </span>
        <span className="pr-2 text-lg transition group-hover:translate-x-0.5">→</span>
      </button>
    ))}
  </div>
)}
