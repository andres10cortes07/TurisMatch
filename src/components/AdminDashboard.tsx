import { useCallback, useEffect, useState } from "react";

interface Categoria {
  id: number;
  nombre: string;
  descripcion: string | null;
}

interface Sitio {
  id: number;
  idCategoria?: number;
  nombre: string;
  descripcion: string | null;
  ubicacion: string | null;
  direccion?: string | null;
  ciudad: string;
  imagen?: string | null;
  imagen_url?: string | null;
  horario?: string | null;
  latitud?: number | string | null;
  longitud?: number | string | null;
  categoria?: string | null;
  precio?: number | string | null;
  calificacion?: number | string | null;
}

interface Plan {
  id: number;
  idSitio: number;
  nombre: string;
  descripcion: string | null;
  precio: number | string;
  duracion: string;
  cupo: number | null;
}

interface Preferencia {
  id: number;
  nombre: string;
  descripcion: string | null;
}

interface Usuario {
  identificacion: string;
  tipoDoc: string;
  nombres: string;
  apellidos: string;
  correo: string;
  fechaNacimiento: string;
  rol: string;
  fechaRegistro: string;
}

interface AdminApi {
  <T>(path: string, options?: RequestInit): Promise<T>;
}

type Seccion = "resumen" | "sitios" | "categorias" | "planes" | "preferencias" | "usuarios";
type EntidadAdmin = Categoria | Sitio | Plan | Preferencia;
type Campo = {
  key: string;
  label: string;
  type?: "text" | "number" | "textarea" | "select";
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
};

interface Props {
  request: AdminApi;
}

const labels: Record<Seccion, string> = {
  resumen: "Resumen",
  sitios: "Sitios turísticos",
  categorias: "Categorías",
  planes: "Planes",
  preferencias: "Preferencias",
  usuarios: "Usuarios",
};

const navigation: Array<{ id: Seccion; icon: string }> = [
  { id: "resumen", icon: "▦" },
  { id: "sitios", icon: "⌖" },
  { id: "categorias", icon: "◈" },
  { id: "planes", icon: "◇" },
  { id: "preferencias", icon: "✧" },
  { id: "usuarios", icon: "♙" },
];

function esSeccionEditable(section: Seccion): section is Exclude<Seccion, "resumen" | "usuarios"> {
  return section !== "resumen" && section !== "usuarios";
}

const singularLabels: Record<Exclude<Seccion, "resumen" | "usuarios">, string> = {
  sitios: "sitio turístico",
  categorias: "categoría",
  planes: "plan",
  preferencias: "preferencia",
};

const fields: Record<Exclude<Seccion, "resumen" | "usuarios">, Campo[]> = {
  sitios: [
    { key: "nombre", label: "Nombre del sitio", required: true },
    { key: "ciudad", label: "Ciudad", required: true },
    { key: "ubicacion", label: "Dirección o ubicación", required: true },
    { key: "idCategoria", label: "Categoría", type: "select", required: true },
    { key: "descripcion", label: "Descripción", type: "textarea" },
    { key: "imagen", label: "URL de imagen" },
    { key: "horario", label: "Horario de atención" },
    { key: "latitud", label: "Latitud", type: "number" },
    { key: "longitud", label: "Longitud", type: "number" },
  ],
  categorias: [
    { key: "nombre", label: "Nombre de la categoría", required: true },
    { key: "descripcion", label: "Descripción", type: "textarea" },
  ],
  planes: [
    { key: "nombre", label: "Nombre del plan", required: true },
    { key: "idSitio", label: "Sitio turístico", type: "select", required: true },
    { key: "precio", label: "Precio (COP)", type: "number", required: true },
    { key: "duracion", label: "Duración", required: true },
    { key: "cupo", label: "Cupo (opcional)", type: "number" },
    { key: "descripcion", label: "Descripción", type: "textarea" },
  ],
  preferencias: [
    { key: "nombre", label: "Nombre de la preferencia", required: true },
    { key: "descripcion", label: "Descripción", type: "textarea" },
  ],
};

function recordId(record: EntidadAdmin): number {
  return record.id;
}

function recordValue(record: EntidadAdmin, key: string): string {
  const value = Reflect.get(record, key) as unknown;
  return value == null ? "" : String(value);
}

function AdminDashboard({ request }: Props) {
  const [section, setSection] = useState<Seccion>("resumen");
  const [sites, setSites] = useState<Sitio[]>([]);
  const [categories, setCategories] = useState<Categoria[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [preferences, setPreferences] = useState<Preferencia[]>([]);
  const [users, setUsers] = useState<Usuario[]>([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [editor, setEditor] = useState<{
    section: Exclude<Seccion, "resumen" | "usuarios">;
    record: EntidadAdmin | null;
  } | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [siteList, categoryList, planList, preferenceList, userList] =
        await Promise.all([
          request<Sitio[]>("/sitios"),
          request<Categoria[]>("/categorias"),
          request<Plan[]>("/planes"),
          request<Preferencia[]>("/preferencias"),
          request<Usuario[]>("/usuarios"),
        ]);
      setSites(siteList);
      setCategories(categoryList);
      setPlans(planList);
      setPreferences(preferenceList);
      setUsers(userList);
      setUsersTotal(userList.length);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "No se pudieron cargar los datos administrativos.",
      );
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    void Promise.resolve().then(loadData);
  }, [loadData]);

  const searchUsers = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSearchingUsers(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("busqueda", search.trim());
      const query = params.size ? `?${params.toString()}` : "";
      setUsers(await request<Usuario[]>(`/usuarios${query}`));
    } catch (searchError) {
      setError(
        searchError instanceof Error
          ? searchError.message
          : "No se pudo completar la búsqueda de usuarios.",
      );
    } finally {
      setSearchingUsers(false);
    }
  };

  const viewUser = async (identificacion: string) => {
    setError("");
    try {
      setSelectedUser(
        await request<Usuario>(`/usuarios/${encodeURIComponent(identificacion)}`),
      );
    } catch (lookupError) {
      setError(
        lookupError instanceof Error
          ? lookupError.message
          : "No se pudo consultar el usuario.",
      );
    }
  };

  const openEditor = (
    target: Exclude<Seccion, "resumen" | "usuarios">,
    record: EntidadAdmin | null = null,
  ) => {
    setError("");
    setNotice("");
    setEditor({ section: target, record });
    const initial: Record<string, string> = {};
    fields[target].forEach((field) => {
      initial[field.key] = record ? recordValue(record, field.key) : "";
    });
    if (target === "sitios" && record && "ciudad" in record) {
      initial.ubicacion ||= record.direccion ?? "";
      initial.imagen ||= record.imagen_url ?? "";
      initial.idCategoria ||= categories
        .find((category) => category.nombre === record.categoria)
        ?.id.toString() ?? "";
    }
    setForm(initial);
  };

  const buildPayload = () => {
    const payload: Record<string, string | number | null> = {};
    fields[editor!.section].forEach(({ key, type }) => {
      const value = form[key]?.trim() ?? "";
      if (type === "number" || type === "select") {
        payload[key] = value === "" && (key === "cupo" || key === "latitud" || key === "longitud")
          ? null
          : Number(value);
      } else {
        payload[key] = value || null;
      }
    });
    return payload;
  };

  const saveRecord = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editor) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const endpoint: Record<typeof editor.section, string> = {
        sitios: "/sitios",
        categorias: "/categorias",
        planes: "/planes",
        preferencias: "/preferencias",
      };
      const id = editor.record ? recordId(editor.record) : null;
      await request(`${endpoint[editor.section]}${id === null ? "" : `/${id}`}`, {
        method: id === null ? "POST" : "PATCH",
        body: JSON.stringify(buildPayload()),
      });
      setEditor(null);
      setNotice(`${labels[editor.section]} ${id === null ? "creado" : "actualizado"} correctamente.`);
      await loadData();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "No se pudo guardar el registro.",
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteRecord = async (
    target: Exclude<Seccion, "resumen" | "usuarios">,
    record: EntidadAdmin,
  ) => {
    if (!window.confirm(`¿Eliminar "${recordValue(record, "nombre")}"? Esta acción no se puede deshacer.`)) return;
    const endpoint: Record<typeof target, string> = {
      sitios: "/sitios",
      categorias: "/categorias",
      planes: "/planes",
      preferencias: "/preferencias",
    };
    setError("");
    setNotice("");
    try {
      await request(`${endpoint[target]}/${recordId(record)}`, { method: "DELETE" });
      setNotice(`${labels[target]} eliminado correctamente.`);
      await loadData();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "No se pudo eliminar el registro.",
      );
    }
  };

  const getSectionRecords = (): EntidadAdmin[] => {
    switch (section) {
      case "sitios":
        return sites;
      case "categorias":
        return categories;
      case "planes":
        return plans;
      case "preferencias":
        return preferences;
      default:
        return [];
    }
  };

  const getRecordSummary = (record: EntidadAdmin): string => {
    if ("idSitio" in record) {
      return `${sites.find((site) => site.id === record.idSitio)?.nombre ?? "Sitio"} · ${Number(record.precio).toLocaleString("es-CO")} COP`;
    }
    if ("ciudad" in record) {
      return `${record.ciudad} · ${record.categoria ?? categories.find((category) => category.id === record.idCategoria)?.nombre ?? "Sin categoría"}`;
    }
    return record.descripcion ?? "Sin descripción";
  };

  const startCreate = () => {
    if (esSeccionEditable(section)) openEditor(section);
  };

  return (
    <section className="admin-layout" aria-label="Panel de administración">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-heading">
          <span>GESTIÓN</span>
          <strong>Centro de control</strong>
        </div>
        <nav aria-label="Secciones administrativas">
          {navigation.map((item) => (
            <button
              className={section === item.id ? "active" : ""}
              key={item.id}
              onClick={() => {
                setSection(item.id);
                setSearch("");
                setError("");
                setNotice("");
              }}
              type="button"
            >
              <span aria-hidden="true">{item.icon}</span>
              {labels[item.id]}
              {item.id === "usuarios" && <small>{users.length}</small>}
            </button>
          ))}
        </nav>
        <div className="admin-sidebar-note">
          <span>✦</span>
          <p>Administra la información que inspira cada viaje.</p>
        </div>
      </aside>

      <div className="admin-content">
        <div className="admin-topline">
          <div>
            <span className="eyebrow">TURISMATCH · ADMINISTRACIÓN</span>
            <h1>{section === "resumen" ? "Panel de control" : labels[section]}</h1>
            <p>
              {section === "resumen"
                ? "Un vistazo a los destinos y contenidos de tu plataforma."
                : section === "usuarios"
                  ? "Consulta las cuentas registradas en TurisMatch."
                  : `Administra ${labels[section].toLocaleLowerCase("es-CO")} y mantenlos al día.`}
            </p>
          </div>
          <button className="admin-refresh" onClick={() => void loadData()} type="button" disabled={loading}>
            ↻ <span>Actualizar</span>
          </button>
        </div>

        {error && <p className="notice error-notice admin-notice" role="alert">{error}</p>}
        {notice && <p className="notice success-notice admin-notice" role="status">{notice}</p>}

        {loading ? (
          <div className="loading-state"><span className="loading-spinner" /> Cargando información administrativa...</div>
        ) : section === "resumen" ? (
          <>
            <div className="admin-stats">
              {[
                { label: "Sitios turísticos", value: sites.length, icon: "⌖", tone: "green" },
                { label: "Categorías", value: categories.length, icon: "◈", tone: "blue" },
                { label: "Planes publicados", value: plans.length, icon: "◇", tone: "gold" },
                { label: "Usuarios registrados", value: users.length, icon: "♙", tone: "purple" },
              ].map((stat) => (
                <article className="admin-stat-card" key={stat.label}>
                  <span className={`admin-stat-icon ${stat.tone}`}>{stat.icon}</span>
                  <div><small>{stat.label}</small><strong>{stat.value}</strong></div>
                </article>
              ))}
            </div>
            <div className="admin-overview-grid">
              <section className="admin-panel-card">
                <div className="admin-card-heading">
                  <div><h2>Destinos recientes</h2><p>Últimos sitios registrados en el catálogo.</p></div>
                  <button className="admin-inline-link" onClick={() => setSection("sitios")} type="button">Ver sitios →</button>
                </div>
                {sites.slice(0, 5).map((site) => (
                  <div className="admin-recent-row" key={site.id}>
                    <span className="admin-recent-icon">⌖</span>
                    <div><strong>{site.nombre}</strong><small>{site.ciudad} · {site.categoria ?? "Sitio turístico"}</small></div>
                    <span className="admin-row-arrow">→</span>
                  </div>
                ))}
                {!sites.length && <p className="admin-empty">Todavía no hay sitios registrados.</p>}
              </section>
              <section className="admin-panel-card admin-quick-actions">
                <div className="admin-card-heading"><div><h2>Accesos rápidos</h2><p>Crea contenido para el catálogo turístico.</p></div></div>
                {(["sitios", "categorias", "planes"] as const).map((target) => (
                  <button key={target} onClick={() => openEditor(target)} type="button">
                    <span>{target === "sitios" ? "⌖" : target === "categorias" ? "◈" : "◇"}</span>
                    <span><strong>Agregar {target === "sitios" ? "sitio turístico" : target === "categorias" ? "categoría" : "plan"}</strong><small>Completa los datos y publícalos</small></span>
                    <b>＋</b>
                  </button>
                ))}
              </section>
            </div>
          </>
        ) : section === "usuarios" ? (
          <section className="admin-panel-card admin-table-panel">
            <div className="admin-card-heading">
              <div><h2>Cuentas registradas</h2><p>{usersTotal} usuarios en total · Consulta de solo lectura</p></div>
              <form className="admin-user-search-form" onSubmit={(event) => void searchUsers(event)}>
                <label className="admin-search">⌕ <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nombre, correo o documento" /></label>
                <button className="admin-user-search-button" disabled={searchingUsers} type="submit">{searchingUsers ? "Buscando..." : "Buscar"}</button>
              </form>
            </div>
            <div className="admin-table-scroll">
              <table className="admin-table">
                <thead><tr><th>Usuario</th><th>Documento</th><th>Correo</th><th>Rol</th><th>Registro</th><th></th></tr></thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.identificacion}>
                      <td><strong>{user.nombres} {user.apellidos}</strong></td>
                      <td>{user.tipoDoc} · {user.identificacion}</td>
                      <td>{user.correo}</td>
                      <td><span className={`admin-role ${user.rol === "administrador" ? "admin" : ""}`}>{user.rol}</span></td>
                      <td>{new Date(user.fechaRegistro).toLocaleDateString("es-CO")}</td>
                      <td><button className="admin-view-user" onClick={() => void viewUser(user.identificacion)} type="button">Consultar</button></td>
                    </tr>
                  ))}
                  {!users.length && <tr><td className="admin-empty" colSpan={6}>No se encontraron usuarios.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
        ) : (
          <section className="admin-panel-card admin-table-panel">
            <div className="admin-card-heading">
              <div><h2>{labels[section]} registrados</h2><p>{getSectionRecords().length} elementos · Los cambios se guardan en la base de datos.</p></div>
              <button className="admin-create-button" onClick={startCreate} type="button">＋ Nuevo {section === "sitios" ? "sitio" : section === "categorias" ? "categoría" : section === "planes" ? "plan" : "preferencia"}</button>
            </div>
            <div className="admin-record-list">
              {getSectionRecords().map((record) => (
                <article className="admin-record-row" key={`${section}-${recordId(record)}`}>
                  <span className="admin-record-symbol">{section === "sitios" ? "⌖" : section === "categorias" ? "◈" : section === "planes" ? "◇" : "✧"}</span>
                  <div className="admin-record-main">
                    <strong>{recordValue(record, "nombre")}</strong>
                    <span>{getRecordSummary(record)}</span>
                  </div>
                  <div className="admin-record-actions">
                    <button onClick={() => openEditor(section, record)} type="button">Editar</button>
                    <button className="delete" onClick={() => void deleteRecord(section, record)} type="button">Eliminar</button>
                  </div>
                </article>
              ))}
              {!getSectionRecords().length && <div className="admin-empty">No hay registros todavía. Crea el primero con el botón superior.</div>}
            </div>
          </section>
        )}
      </div>

      {editor && (
        <div className="modal-backdrop admin-modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !saving) setEditor(null);
        }}>
          <section aria-labelledby="admin-editor-title" aria-modal="true" className="admin-editor" role="dialog">
            <div className="admin-editor-heading">
              <div><span className="eyebrow">GESTIÓN DE CONTENIDO</span><h2 id="admin-editor-title">{editor.record ? "Editar" : "Crear"} {singularLabels[editor.section]}</h2></div>
              <button aria-label="Cerrar formulario" onClick={() => setEditor(null)} type="button">×</button>
            </div>
            <form onSubmit={(event) => void saveRecord(event)}>
              <div className="admin-form-grid">
                {fields[editor.section].map((field) => {
                  const options = field.key === "idCategoria"
                    ? categories.map((category) => ({ value: String(category.id), label: category.nombre }))
                    : field.key === "idSitio"
                      ? sites.map((site) => ({ value: String(site.id), label: `${site.nombre} · ${site.ciudad}` }))
                      : field.options ?? [];
                  return (
                    <label className={`admin-form-field ${field.type === "textarea" ? "wide" : ""}`} key={field.key}>
                      <span>{field.label}{field.required && <b> *</b>}</span>
                      {field.type === "textarea" ? (
                        <textarea value={form[field.key] ?? ""} onChange={(event) => setForm((current) => ({ ...current, [field.key]: event.target.value }))} rows={3} />
                      ) : field.type === "select" ? (
                        <select required={field.required} value={form[field.key] ?? ""} onChange={(event) => setForm((current) => ({ ...current, [field.key]: event.target.value }))}>
                          <option value="">Selecciona una opción</option>
                          {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                        </select>
                      ) : (
                        <input required={field.required} type={field.type ?? "text"} min={field.key === "precio" ? "0" : field.key === "cupo" ? "1" : undefined} step={field.key === "latitud" || field.key === "longitud" ? "any" : undefined} value={form[field.key] ?? ""} onChange={(event) => setForm((current) => ({ ...current, [field.key]: event.target.value }))} />
                      )}
                    </label>
                  );
                })}
              </div>
              <div className="admin-editor-actions">
                <button className="secondary-button" onClick={() => setEditor(null)} type="button" disabled={saving}>Cancelar</button>
                <button className="primary-button" type="submit" disabled={saving}>{saving ? "Guardando..." : "Guardar cambios"}</button>
              </div>
              {error && <p className="notice error-notice admin-editor-error" role="alert">{error}</p>}
            </form>
          </section>
        </div>
      )}
      {selectedUser && (
        <div className="modal-backdrop admin-modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setSelectedUser(null);
        }}>
          <section aria-labelledby="admin-user-title" aria-modal="true" className="admin-editor admin-user-detail" role="dialog">
            <div className="admin-editor-heading">
              <div><span className="eyebrow">DETALLE DE CUENTA</span><h2 id="admin-user-title">{selectedUser.nombres} {selectedUser.apellidos}</h2></div>
              <button aria-label="Cerrar detalle" onClick={() => setSelectedUser(null)} type="button">×</button>
            </div>
            <dl>
              <div><dt>Identificación</dt><dd>{selectedUser.tipoDoc} · {selectedUser.identificacion}</dd></div>
              <div><dt>Correo electrónico</dt><dd>{selectedUser.correo}</dd></div>
              <div><dt>Fecha de nacimiento</dt><dd>{new Date(`${selectedUser.fechaNacimiento}T00:00:00`).toLocaleDateString("es-CO")}</dd></div>
              <div><dt>Rol</dt><dd><span className={`admin-role ${selectedUser.rol === "administrador" ? "admin" : ""}`}>{selectedUser.rol}</span></dd></div>
              <div><dt>Fecha de registro</dt><dd>{new Date(selectedUser.fechaRegistro).toLocaleDateString("es-CO")}</dd></div>
            </dl>
            <p>La información personal y el rol se muestran en modo de consulta; esta API no permite modificarlos desde el panel.</p>
            <div className="admin-editor-actions"><button className="primary-button" onClick={() => setSelectedUser(null)} type="button">Cerrar</button></div>
          </section>
        </div>
      )}
    </section>
  );
}

export default AdminDashboard;
