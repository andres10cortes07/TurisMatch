import { useCallback, useEffect, useMemo, useState } from "react";
import "./App.css";
import AuthPage from "./components/AuthPage";

export interface Lugar {
  id: number;
  idCategoria?: number;
  nombre: string;
  descripcion: string | null;
  ciudad: string;
  direccion?: string | null;
  ubicacion?: string | null;
  categoria: string | null;
  precio: number | string | null;
  calificacion: number | string | null;
  latitud?: number | string | null;
  longitud?: number | string | null;
  imagen_url?: string | null;
  imagen?: string | null;
  horario?: string | null;
}

interface Categoria {
  id: number;
  nombre: string;
  descripcion: string | null;
}

interface Usuario {
  identificacion: string;
  nombres: string;
  apellidos: string;
  correo: string;
  rol: string;
}

interface Plan {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio: string | number;
  duracion: string;
  cupo: number | null;
  idSitio: number;
}

interface Calificacion {
  id: number;
  puntuacion: number;
  comentario: string | null;
  nombresUsuario?: string;
  apellidosUsuario?: string;
}

interface DetalleLugar extends Lugar {
  planes: Plan[];
  categoriaInfo: Categoria | null;
  calificacionPromedio: number;
  cantidadCalificaciones: number;
}

interface Preferencia {
  id: number;
  nombre: string;
  descripcion: string | null;
  nivelInteres?: number;
}

interface Favorito {
  id: number;
  sitio: Lugar;
}

interface Filtros {
  ciudad: string;
  categoria: string;
  calificacionMinima: string;
  precioMaximo: string;
}

interface RespuestaBusquedaIA {
  consulta: string;
  modo: string;
  lugares: Lugar[];
  filtros?: {
    ciudad?: string | null;
    categoria?: string | null;
    calificacionMinima?: number | string | null;
    precioMaximo?: number | string | null;
  };
}

interface RespuestaSesion {
  usuario: Usuario;
}

class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
const fallbackImage =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 450'%3E%3Cdefs%3E%3ClinearGradient id='g'%3E%3Cstop stop-color='%23006653'/%3E%3Cstop offset='1' stop-color='%23b8d9ca'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='800' height='450' fill='url(%23g)'/%3E%3C/svg%3E";

const categoryImages: Record<string, string> = {
  aventura:
    "https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=900&q=85",
  cultura:
    "https://images.unsplash.com/photo-1561214115-f2f134cc4912?auto=format&fit=crop&w=900&q=85",
  gastronomía:
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=85",
  naturaleza:
    "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=900&q=85",
  museo:
    "https://images.unsplash.com/photo-1561214115-f2f134cc4912?auto=format&fit=crop&w=900&q=85",
  default:
    "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=900&q=85",
};

async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    let message = `La solicitud falló (${response.status}).`;
    try {
      const body = (await response.json()) as {
        message?: string | string[];
      };
      if (Array.isArray(body.message)) message = body.message.join(" ");
      else if (body.message) message = body.message;
    } catch {
      // Mantener el mensaje HTTP cuando el servidor no devuelve JSON.
    }
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

function imageFor(place: Lugar) {
  const suppliedImage = place.imagen_url ?? place.imagen;
  if (suppliedImage) return suppliedImage;
  const category = place.categoria?.toLowerCase() ?? "default";
  return categoryImages[category] ?? categoryImages.default;
}

function formatPrice(value: Lugar["precio"]) {
  const price = Number(value);
  if (!Number.isFinite(price) || price <= 0) return "Precio por confirmar";
  return `$${price.toLocaleString("es-CO")} COP`;
}

function App() {
  const [places, setPlaces] = useState<Lugar[]>([]);
  const [categories, setCategories] = useState<Categoria[]>([]);
  const [filters, setFilters] = useState<Filtros>({
    ciudad: "",
    categoria: "",
    calificacionMinima: "",
    precioMaximo: "",
  });
  const [query, setQuery] = useState("");
  const [aiResults, setAiResults] = useState(false);
  const [aiSearch, setAiSearch] = useState<RespuestaBusquedaIA | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState<Usuario | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "register" | null>(null);
  const [page, setPage] = useState<
    "explore" | "recommended" | "favorites" | "preferences"
  >("explore");
  const [favorites, setFavorites] = useState<Favorito[]>([]);
  const [preferences, setPreferences] = useState<Preferencia[]>([]);
  const [preferenceCatalog, setPreferenceCatalog] = useState<Preferencia[]>([]);
  const [detail, setDetail] = useState<DetalleLugar | null>(null);
  const [reviews, setReviews] = useState<Calificacion[]>([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [notice, setNotice] = useState("");

  const loadPlaces = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filters.ciudad.trim()) params.set("ciudad", filters.ciudad.trim());
      if (filters.categoria) params.set("categoria", filters.categoria);
      if (filters.calificacionMinima) {
        params.set("calificacionMinima", filters.calificacionMinima);
      }
      if (filters.precioMaximo) params.set("precioMaximo", filters.precioMaximo);
      const suffix = params.size ? `/filtrar?${params.toString()}` : "";
      const data = await apiRequest<Lugar[]>(`/sitios${suffix}`);
      setPlaces(data);
      setError("");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "No se pudieron cargar las experiencias.",
      );
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    let active = true;
    const sessionRequest = apiRequest<RespuestaSesion>("/auth/sesion")
      .then((session) => session.usuario)
      .catch((requestError: unknown) => {
        if (requestError instanceof ApiError && requestError.status === 401) {
          return null;
        }
        throw requestError;
      });
    Promise.all([apiRequest<Categoria[]>("/categorias"), sessionRequest])
      .then(([categoryList, currentUser]) => {
        if (active) {
          setCategories(categoryList);
          setUser(currentUser);
          if (currentUser) {
            Promise.all([
              apiRequest<Favorito[]>("/favoritos"),
              apiRequest<Preferencia[]>("/preferencias/me"),
              apiRequest<Preferencia[]>("/preferencias"),
            ])
              .then(([favoriteList, preferenceList, catalog]) => {
                if (active) {
                  setFavorites(favoriteList);
                  setPreferences(preferenceList);
                  setPreferenceCatalog(catalog);
                }
              })
              .catch((requestError: unknown) => {
                if (active) {
                  setError(
                    requestError instanceof Error
                      ? requestError.message
                      : "No se pudieron cargar tus datos personales.",
                  );
                }
              });
          }
        }
      })
      .catch((requestError: unknown) => {
        if (active) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "No se pudo conectar con Turismo IA.",
          );
        }
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (aiResults) return;
    let active = true;
    const params = new URLSearchParams();
    if (filters.ciudad.trim()) params.set("ciudad", filters.ciudad.trim());
    if (filters.categoria) params.set("categoria", filters.categoria);
    if (filters.calificacionMinima) {
      params.set("calificacionMinima", filters.calificacionMinima);
    }
    if (filters.precioMaximo) params.set("precioMaximo", filters.precioMaximo);
    const suffix = params.size ? `/filtrar?${params.toString()}` : "";
    apiRequest<Lugar[]>(`/sitios${suffix}`)
      .then((data) => {
        if (active) {
          setPlaces(data);
          setError("");
        }
      })
      .catch((requestError: unknown) => {
        if (active) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "No se pudieron cargar las experiencias.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [aiResults, filters]);

  const loadPersonalData = useCallback(async () => {
    try {
      const [favoriteList, preferenceList, catalog] = await Promise.all([
        apiRequest<Favorito[]>("/favoritos"),
        apiRequest<Preferencia[]>("/preferencias/me"),
        apiRequest<Preferencia[]>("/preferencias"),
      ]);
      setFavorites(favoriteList);
      setPreferences(preferenceList);
      setPreferenceCatalog(catalog);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "No se pudieron cargar tus datos personales.",
      );
    }
  }, []);

  const preferenceLevels = useMemo(() => {
    const levels = new Map<string, number>();
    for (const preference of preferences) {
      const catalogItem = preferenceCatalog.find(
        (item) => item.id === preference.id,
      );
      if (catalogItem && (preference.nivelInteres ?? 0) > 0) {
        levels.set(
          catalogItem.nombre.toLocaleLowerCase("es-CO"),
          preference.nivelInteres ?? 0,
        );
      }
    }
    return levels;
  }, [preferenceCatalog, preferences]);

  const getPreferenceLevel = useCallback(
    (place: Lugar) =>
      preferenceLevels.get(
        place.categoria?.toLocaleLowerCase("es-CO") ?? "",
      ) ?? 0,
    [preferenceLevels],
  );

  const recommendedPlaces = useMemo(
    () =>
      places
        .filter((place) => getPreferenceLevel(place) > 0)
        .sort(
          (left, right) =>
            getPreferenceLevel(right) - getPreferenceLevel(left) ||
            Number(right.calificacion ?? 0) - Number(left.calificacion ?? 0),
        ),
    [getPreferenceLevel, places],
  );

  const shownPlaces = useMemo(() => {
    if (page === "favorites") {
      return favorites.map(
        (favorite) =>
          places.find((place) => place.id === favorite.sitio.id) ??
          favorite.sitio,
      );
    }
    if (page === "recommended") return recommendedPlaces;
    return places;
  }, [favorites, page, places, recommendedPlaces]);
  const featuredPlace = places[0];

  const handleSearch = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    setAiResults(true);
    setAiSearch(null);
    try {
      const result = await apiRequest<RespuestaBusquedaIA>("/ai/search", {
        method: "POST",
        body: JSON.stringify({
          query: query.trim(),
          filtros: {
            ciudad: filters.ciudad,
            categoria: filters.categoria,
            calificacionMinima: filters.calificacionMinima
              ? Number(filters.calificacionMinima)
              : undefined,
            precioMaximo: filters.precioMaximo
              ? Number(filters.precioMaximo)
              : undefined,
          },
        }),
      });
      setPlaces(Array.isArray(result.lugares) ? result.lugares : []);
      setAiSearch(result);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "No se pudo completar la búsqueda.",
      );
    } finally {
      setLoading(false);
    }
  };

  const selectCategory = (category: string) => {
    setPage("explore");
    setQuery("");
    setLoading(true);
    setFilters((current) => ({ ...current, categoria: category }));
    setAiResults(false);
    document.getElementById("experiencias")?.scrollIntoView({ behavior: "smooth" });
  };

  const showExplore = () => {
    setPage("explore");
    setQuery("");
    setFilters({
      ciudad: "",
      categoria: "",
      calificacionMinima: "",
      precioMaximo: "",
    });
    setAiResults(false);
    setLoading(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const showRecommendations = () => {
    setPage("recommended");
    setQuery("");
    setFilters({
      ciudad: "",
      categoria: "",
      calificacionMinima: "",
      precioMaximo: "",
    });
    setAiResults(false);
    setLoading(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleFavorite = async (place: Lugar) => {
    if (!user) {
      setAuthMode("login");
      return;
    }
    const isFavorite = favorites.some(
      (favorite) => favorite.sitio.id === place.id,
    );
    try {
      if (isFavorite) {
        await apiRequest(`/favoritos/${place.id}`, { method: "DELETE" });
        setNotice("Se quitó de tus favoritos.");
      } else {
        await apiRequest(`/favoritos/${place.id}`, { method: "POST" });
        setNotice("Guardado en tus favoritos.");
      }
      await loadPersonalData();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "No se pudo actualizar favoritos.",
      );
    }
  };

  const openDetail = async (place: Lugar) => {
    setError("");
    setNotice("");
    try {
      const [placeDetail, placeReviews] = await Promise.all([
        apiRequest<DetalleLugar>(`/sitios/${place.id}`),
        apiRequest<Calificacion[]>(`/sitios/${place.id}/calificaciones`),
      ]);
      setDetail(placeDetail);
      setReviews(placeReviews);
      setRating(5);
      setComment("");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "No se pudo abrir el detalle.",
      );
    }
  };

  const submitRating = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!detail) return;
    if (!user) {
      setAuthMode("login");
      return;
    }
    try {
      await apiRequest(`/sitios/${detail.id}/calificaciones`, {
        method: "POST",
        body: JSON.stringify({ puntuacion: rating, comentario: comment }),
      });
      const [updatedDetail, updatedReviews] = await Promise.all([
        apiRequest<DetalleLugar>(`/sitios/${detail.id}`),
        apiRequest<Calificacion[]>(`/sitios/${detail.id}/calificaciones`),
      ]);
      setDetail(updatedDetail);
      setReviews(updatedReviews);
      setComment("");
      setNotice("Gracias por compartir tu opinión.");
      if (!aiResults) await loadPlaces();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "No se pudo guardar tu calificación.",
      );
    }
  };

  const updatePreference = async (preferenceId: number, level: number) => {
    if (!user) {
      setAuthMode("login");
      return;
    }
    try {
      await apiRequest(`/preferencias/me/${preferenceId}`, {
        method: "POST",
        body: JSON.stringify({ nivelInteres: level }),
      });
      await loadPersonalData();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "No se pudo guardar tu preferencia.",
      );
    }
  };

  const removePreference = async (preferenceId: number) => {
    try {
      await apiRequest(`/preferencias/me/${preferenceId}`, {
        method: "DELETE",
      });
      await loadPersonalData();
      setNotice("Interés eliminado de tus preferencias.");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "No se pudo eliminar el interés.",
      );
    }
  };

  const handleAuth = async (nextUser: Usuario) => {
    setUser(nextUser);
    setAuthMode(null);
    setNotice(`¡Qué bueno verte, ${nextUser.nombres}!`);
    await loadPersonalData();
  };

  const signOut = async () => {
    try {
      await apiRequest("/auth/logout", { method: "POST" });
      setUser(null);
      setFavorites([]);
      setPreferences([]);
      setPreferenceCatalog([]);
      setPage("explore");
      setNotice("Sesión cerrada correctamente.");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "No se pudo cerrar la sesión.",
      );
    }
  };

  if (authMode) {
    return (
      <AuthPage
        mode={authMode}
        onModeChange={setAuthMode}
        onComplete={handleAuth}
        onBack={() => setAuthMode(null)}
      />
    );
  }

  const isFavorite = (placeId: number) =>
    favorites.some((favorite) => favorite.sitio.id === placeId);

  return (
    <div className="app-shell">
      <header className="site-header">
        <button
          className="brand"
          type="button"
          onClick={() => {
            setPage("explore");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          aria-label="TurisMatch, ir al inicio"
        >
          <span className="brand-mark">✦</span>
          <span>Turis<span>Match</span></span>
        </button>

        <nav className="main-nav" aria-label="Navegación principal">
          <button
            className={page === "explore" ? "active" : ""}
            onClick={showExplore}
            type="button"
            title="Ver todos los sitios y aplicar filtros"
            aria-pressed={page === "explore"}
          >
            Explorar
          </button>
          <button
            className={page === "recommended" ? "active" : ""}
            onClick={showRecommendations}
            type="button"
            title="Ver sitios según tus preferencias guardadas"
            aria-pressed={page === "recommended"}
          >
            Para ti
          </button>
          <button
            className={page === "favorites" ? "active" : ""}
            onClick={() => setPage("favorites")}
            type="button"
          >
            Favoritos <span className="nav-count">{favorites.length || ""}</span>
          </button>
        </nav>

        <div className="header-actions">
          <button
            className={`preference-button ${page === "preferences" ? "selected" : ""}`}
            onClick={() => setPage("preferences")}
            type="button"
          >
            ✧ Mis preferencias
          </button>
          {user ? (
            <div className="account-menu">
              <span className="account-avatar" aria-hidden="true">
                {user.nombres.slice(0, 1).toUpperCase()}
              </span>
              <span className="account-name">{user.nombres}</span>
              <button className="logout-button" type="button" onClick={() => void signOut()}>
                <span aria-hidden="true">↪</span> Cerrar sesión
              </button>
            </div>
          ) : (
            <button
              className="login-link"
              onClick={() => setAuthMode("login")}
              type="button"
            >
              Iniciar sesión
            </button>
          )}
        </div>
      </header>

      <main>
        {page === "recommended" && (
          <section className="personal-page recommendation-page">
            <span className="eyebrow">RECOMENDACIONES PERSONALIZADAS</span>
            <h1>Experiencias para ti</h1>
            <p className="personal-intro">
              Mostramos sitios de las categorías que elegiste en tus
              preferencias. Primero aparecen los que más te interesan.
            </p>
            {user ? (
              <>
                {error && <p className="notice error-notice" role="alert">{error}</p>}
                {notice && <p className="notice success-notice" role="status">{notice}</p>}
                <div className="recommendation-interests">
                  <strong>Tus intereses activos</strong>
                  {preferenceLevels.size ? (
                    <div className="interest-chips">
                      {[...preferenceLevels.entries()]
                        .sort((left, right) => right[1] - left[1])
                        .map(([name, level]) => (
                          <span className="interest-chip" key={name}>
                            {name} <b>{level}/5</b>
                          </span>
                        ))}
                    </div>
                  ) : (
                    <p>
                      Aún no has seleccionado intereses. Elige categorías y
                      califícalas en{" "}
                      <button
                        className="inline-link"
                        type="button"
                        onClick={() => setPage("preferences")}
                      >
                        Mis preferencias
                      </button>{" "}
                      para recibir recomendaciones.
                    </p>
                  )}
                </div>
                {preferenceLevels.size > 0 && (
                  <div className="recommendation-summary">
                    {recommendedPlaces.length
                      ? `${recommendedPlaces.length} sitios coinciden con tus intereses`
                      : "Todavía no hay sitios en las categorías que elegiste."}
                  </div>
                )}
              </>
            ) : (
              <div className="empty-state">
                <span>✧</span>
                <h3>Inicia sesión para ver recomendaciones a tu medida</h3>
                <p>
                  Tus intereses guardados nos ayudan a elegir qué sitios
                  mostrarte primero.
                </p>
                <button
                  className="primary-button"
                  type="button"
                  onClick={() => setAuthMode("login")}
                >
                  Iniciar sesión
                </button>
              </div>
            )}
          </section>
        )}

        {(page === "explore" || page === "recommended") && (
          <>
            {page === "explore" && (
              <>
                <section className="hero-section">
              <div className="hero-content">
                <span className="eyebrow"><span /> DESCUBRE TURISMO A TU MANERA</span>
                <h1>
                  Encuentra experiencias
                  <br />
                  que hacen <em>match</em> con tu
                  <br />
                  forma de viajar
                </h1>
                <p className="hero-description">
                  Descubre sitios, consulta sus planes y encuentra ideas para tu
                  próximo viaje. Filtra por ciudad, categoría y presupuesto;
                  guarda tus favoritos y comparte tu experiencia.
                </p>
                <div className="trust-points">
                  <span><b>◎</b> Explora a tu ritmo <small>Encuentra nuevos destinos</small></span>
                  <span><b className="coral">♡</b> Tus planes favoritos <small>Guárdalos en tu perfil</small></span>
                </div>
              </div>

              <div className="hero-feature">
                <img
                  src={featuredPlace ? imageFor(featuredPlace) : categoryImages.default}
                  onError={(event) => {
                    event.currentTarget.src = fallbackImage;
                  }}
                  alt={featuredPlace?.nombre ?? "Paisaje para descubrir"}
                />
                <div className="feature-card">
                  <span className="match-label">✦ &nbsp;Un destino por descubrir <small>· {featuredPlace?.ciudad ?? "Colombia"}</small></span>
                  <strong>{featuredPlace?.nombre ?? "Encuentra tu próxima experiencia"}</strong>
                  <span className="feature-arrow">→</span>
                </div>
                <span className="feature-spark">✦</span>
              </div>
                </section>

                <form className="search-panel" onSubmit={handleSearch}>
              <label className="search-field query-field">
                <span className="field-icon">♧</span>
                <span>
                  <small>CUÉNTANOS QUÉ PLAN BUSCAS</small>
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Ej. Quiero viajar con mi pareja a conocer Tunja"
                    aria-label="Describe la experiencia que buscas"
                  />
                  <span className="search-hint">
                    Describe el destino o plan; los filtros de abajo se combinan con tu frase.
                  </span>
                </span>
              </label>
              <label className="search-field">
                <span className="field-icon">⌖</span>
                <span>
                  <small>UBICACIÓN / CIUDAD</small>
                  <input
                    value={filters.ciudad}
                    onChange={(event) => {
                      setLoading(true);
                      setFilters((current) => ({ ...current, ciudad: event.target.value }));
                      setAiResults(false);
                    }}
                    placeholder="¿A dónde o cerca de ti?"
                    aria-label="Ciudad"
                  />
                </span>
              </label>
              <label className="search-field">
                <span className="field-icon">✧</span>
                <span>
                  <small>CATEGORÍA</small>
                  <select
                    value={filters.categoria}
                    onChange={(event) => {
                      setLoading(true);
                      setFilters((current) => ({
                        ...current,
                        categoria: event.target.value,
                      }));
                      setAiResults(false);
                    }}
                    aria-label="Categoría"
                  >
                    <option value="">Cualquier categoría</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.nombre}>
                        {category.nombre}
                      </option>
                    ))}
                  </select>
                </span>
              </label>
              <label className="search-field">
                <span className="field-icon">◈</span>
                <span>
                  <small>PRESUPUESTO</small>
                  <select
                    value={filters.precioMaximo}
                    onChange={(event) => {
                      setLoading(true);
                      setFilters((current) => ({ ...current, precioMaximo: event.target.value }));
                      setAiResults(false);
                    }}
                    aria-label="Presupuesto máximo"
                  >
                    <option value="">Cualquier presupuesto</option>
                    <option value="20000">Hasta $20.000</option>
                    <option value="50000">Hasta $50.000</option>
                    <option value="100000">Hasta $100.000</option>
                  </select>
                </span>
              </label>
              <label className="search-field rating-field">
                <span className="field-icon">★</span>
                <span>
                  <small>CALIFICACIÓN</small>
                  <select
                    value={filters.calificacionMinima}
                    onChange={(event) => {
                      setLoading(true);
                      setFilters((current) => ({
                        ...current,
                        calificacionMinima: event.target.value,
                      }));
                      setAiResults(false);
                    }}
                    aria-label="Calificación mínima"
                  >
                    <option value="">Cualquier calificación</option>
                    <option value="3">3 estrellas o más</option>
                    <option value="4">4 estrellas o más</option>
                    <option value="4.5">4.5 estrellas o más</option>
                  </select>
                </span>
              </label>
              <button className="search-submit" type="submit" disabled={!query.trim() || loading}>
                <span>⌕</span> Buscar con IA
              </button>
                </form>

                {error && <p className="notice error-notice" role="alert">{error}</p>}
                {notice && <p className="notice success-notice" role="status">{notice}</p>}
                {aiResults && aiSearch && (
                  <div className="ai-search-summary" role="status">
                    <div>
                      <strong>Así entendimos tu búsqueda</strong>
                      <span>
                        {aiSearch.modo === "gemini"
                          ? "Interpretada con IA"
                          : "Interpretada con el buscador inteligente"}
                      </span>
                    </div>
                    <div className="ai-search-filters">
                      {aiSearch.filtros?.ciudad && (
                        <span>⌖ {aiSearch.filtros.ciudad}</span>
                      )}
                      {aiSearch.filtros?.categoria && (
                        <span>✧ {aiSearch.filtros.categoria}</span>
                      )}
                      {aiSearch.filtros?.precioMaximo != null && (
                        <span>
                          Hasta ${Number(aiSearch.filtros.precioMaximo).toLocaleString("es-CO")}
                        </span>
                      )}
                      {aiSearch.filtros?.calificacionMinima != null && (
                        <span>★ Desde {aiSearch.filtros.calificacionMinima}</span>
                      )}
                      {!aiSearch.filtros?.ciudad &&
                        !aiSearch.filtros?.categoria &&
                        aiSearch.filtros?.precioMaximo == null &&
                        aiSearch.filtros?.calificacionMinima == null && (
                          <span>Sin filtros específicos: mostramos las experiencias disponibles.</span>
                        )}
                    </div>
                  </div>
                )}

                <section
                  className={
                    aiResults && aiSearch
                      ? "category-section search-collapsed"
                      : "category-section"
                  }
                >
              <div className="section-heading">
                <div>
                  <span className="eyebrow">INSPIRACIÓN POR ESTILO</span>
                  <h2>Explora por Categoría</h2>
                </div>
                <p>Elige la atmósfera que más sintoniza hoy y déjanos filtrar el resto.</p>
              </div>
              <div className="category-grid">
                {categories.map((category, index) => {
                  const key = category.nombre.toLowerCase();
                  const image = categoryImages[key] ?? categoryImages.default;
                  return (
                    <button
                      className="category-tile"
                      key={category.id}
                      type="button"
                      style={{ backgroundImage: `url("${image}")` }}
                      onClick={() => selectCategory(category.nombre)}
                    >
                      <span className="category-symbol">{["⌖", "✧", "♧", "◈", "↗"][index % 5]}</span>
                      <strong>{category.nombre}</strong>
                      <span className="tile-arrow">↗</span>
                    </button>
                  );
                })}
              </div>
                </section>
              </>
            )}

            <section className="experience-section" id="experiencias">
              <div className="section-heading experience-heading">
                <div>
                <h2>
                  {page === "recommended"
                    ? "Elegidas según tus intereses"
                    : filters.categoria
                      ? `Experiencias de ${filters.categoria}`
                      : "Experiencias para descubrir"}
                </h2>
                <p>
                  {page === "recommended"
                    ? "Las categorías con mayor nivel de interés aparecen primero."
                    : "Explora sitios turísticos y consulta sus planes, precios y calificaciones."}
                </p>
              </div>
              {page === "explore" && <button
                className="text-link"
                type="button"
                  onClick={() => {
                    setLoading(true);
                    setQuery("");
                    setFilters({ ciudad: "", categoria: "", calificacionMinima: "", precioMaximo: "" });
                    setAiSearch(null);
                    setAiResults(false);
                  }}
                >
                  Limpiar filtros <span>×</span>
                </button>}
              </div>
              {loading ? (
                <div className="loading-state"><span className="loading-spinner" /> Buscando experiencias para ti...</div>
              ) : page === "recommended" &&
                (!user || !preferenceLevels.size) ? null : shownPlaces.length ? (
                <div className="place-grid">
                  {shownPlaces.map((place) => (
                    <article className="place-card" key={place.id}>
                      <div className="place-image-wrap">
                        <img src={imageFor(place)} onError={(event) => {
                          event.currentTarget.src = fallbackImage;
                        }} alt="" className="place-image" loading="lazy" />
                        <span className="affinity-badge">✦ {page === "recommended" ? `Interés ${getPreferenceLevel(place)}/5` : place.nombre.startsWith("DEMO - ") ? "Experiencia de muestra" : Number(place.calificacion) > 0 ? "Calificado por viajeros" : "Nuevo destino"}</span>
                        <button
                          className={`favorite-toggle ${isFavorite(place.id) ? "is-favorite" : ""}`}
                          type="button"
                          onClick={() => void toggleFavorite(place)}
                          aria-label={isFavorite(place.id) ? "Quitar de favoritos" : "Guardar en favoritos"}
                        >
                          {isFavorite(place.id) ? "♥" : "♡"}
                        </button>
                        <span className="place-category">{place.categoria ?? "Experiencia"}</span>
                      </div>
                      <div className="place-body">
                        <div className="place-location"><span>⌖</span> {place.ciudad || "Colombia"}</div>
                        <h3>{place.nombre}</h3>
                        <p className="place-description">{place.descripcion || "Una experiencia por descubrir en tu próximo viaje."}</p>
                        <div className="place-meta">
                          <span>★ {Number(place.calificacion) > 0 ? Number(place.calificacion).toFixed(1) : "Nuevo"}</span>
                          <span>{formatPrice(place.precio)}</span>
                        </div>
                        <div className="place-actions">
                          <button className="secondary-button" type="button" onClick={() => void toggleFavorite(place)}>
                            {isFavorite(place.id) ? "Guardado" : "Guardar"}
                          </button>
                          <button className="primary-button" type="button" onClick={() => void openDetail(place)}>
                            Ver detalle
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <span>⌖</span>
                  <h3>Aún no hay experiencias para mostrar</h3>
                  <p>Prueba otra categoría o cambia los filtros de búsqueda.</p>
                  <button className="primary-button" type="button" onClick={() => {
                    setPage("explore");
                      setLoading(true);
                      setFilters({ ciudad: "", categoria: "", calificacionMinima: "", precioMaximo: "" });
                    setAiResults(false);
                  }}>Ver todas las experiencias</button>
                </div>
              )}
            </section>
          </>
        )}

        {page === "favorites" && (
          <section className="personal-page">
            <span className="eyebrow">TU COLECCIÓN DE VIAJE</span>
            <h1>Experiencias guardadas</h1>
            <p className="personal-intro">Los planes que guardas para volver a ellos cuando quieras.</p>
            {!user ? (
              <div className="empty-state">
                <span>♡</span><h3>Inicia sesión para ver tus favoritos</h3>
                <button className="primary-button" type="button" onClick={() => setAuthMode("login")}>Iniciar sesión</button>
              </div>
            ) : shownPlaces.length ? (
              <div className="place-grid">
                {shownPlaces.map((place) => (
                  <article className="place-card" key={place.id}>
                    <div className="place-image-wrap"><img src={imageFor(place)} onError={(event) => {
                      event.currentTarget.src = fallbackImage;
                    }} alt="" className="place-image" /><span className="place-category">{place.categoria}</span></div>
                    <div className="place-body"><div className="place-location">⌖ {place.ciudad}</div><h3>{place.nombre}</h3><p className="place-description">{place.descripcion}</p><div className="place-meta"><span>★ {Number(place.calificacion).toFixed(1)}</span><span>{formatPrice(place.precio)}</span></div><div className="place-actions"><button className="secondary-button" type="button" onClick={() => void toggleFavorite(place)}>Quitar</button><button className="primary-button" type="button" onClick={() => void openDetail(place)}>Ver detalle</button></div></div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-state"><span>♡</span><h3>Tu lista está esperando su primer plan</h3><p>Guarda las experiencias que te llamen la atención.</p><button className="primary-button" type="button" onClick={() => setPage("explore")}>Explorar experiencias</button></div>
            )}
          </section>
        )}

        {page === "preferences" && (
          <section className="personal-page">
            <span className="eyebrow">HECHO A TU MEDIDA</span>
            <h1>¿Qué te mueve a viajar?</h1>
            <p className="personal-intro">Cuéntanos cuánto te interesa cada estilo y afinaremos tus recomendaciones.</p>
            {error && <p className="notice error-notice" role="alert">{error}</p>}
            {notice && <p className="notice success-notice" role="status">{notice}</p>}
            {!user ? (
              <div className="empty-state"><span>✧</span><h3>Inicia sesión para personalizar tus preferencias</h3><button className="primary-button" type="button" onClick={() => setAuthMode("login")}>Iniciar sesión</button></div>
            ) : (
              <div className="preference-grid">
                {categories.map((category) => {
                  const catalogPreference = preferenceCatalog.find(
                    (item) =>
                      item.nombre.toLocaleLowerCase() ===
                      category.nombre.toLocaleLowerCase(),
                  );
                  const userPreference = preferences.find(
                    (item) => item.id === catalogPreference?.id,
                  );
                  const level = userPreference?.nivelInteres ?? 0;
                  return (
                    <article className="preference-card" key={category.id}>
                      <span className="preference-icon">✧</span><div><h3>{category.nombre}</h3><p>{category.descripcion || "Experiencias para descubrir a tu ritmo."}</p></div>
                      <div className="interest-control" aria-label={`Nivel de interés en ${category.nombre}`}>
                        {[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" className={value <= level ? "filled" : ""} disabled={!catalogPreference} onClick={() => catalogPreference && void updatePreference(catalogPreference.id, value)} aria-label={`${value} de 5`}>★</button>)}
                        <span>{level ? `${level}/5` : "Elige tu nivel"}</span>
                      </div>
                      {level > 0 && catalogPreference && (
                        <button
                          className="remove-interest-button"
                          type="button"
                          onClick={() => void removePreference(catalogPreference.id)}
                        >
                          Quitar interés
                        </button>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </main>

      <footer className="site-footer">
        <button className="brand footer-brand" type="button" onClick={() => setPage("explore")}><span className="brand-mark">✦</span><span>Turis<span>Match</span></span></button>
        <p>Viaja a tu manera. Encuentra tu próximo match.</p>
        <span>© 2026 TurisMatch</span>
      </footer>

      {detail && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setDetail(null);
        }}>
          <section className="detail-modal" role="dialog" aria-modal="true" aria-labelledby="detail-title">
            <button className="modal-close" type="button" onClick={() => setDetail(null)} aria-label="Cerrar">×</button>
            <img className="detail-cover" src={imageFor(detail)} onError={(event) => {
              event.currentTarget.src = fallbackImage;
            }} alt="" />
            <div className="detail-content">
              <span className="eyebrow">{detail.categoriaInfo?.nombre ?? detail.categoria} · {detail.ciudad}</span>
              <h2 id="detail-title">{detail.nombre}</h2>
              <p>{detail.descripcion || "Una experiencia que espera ser descubierta."}</p>
              <div className="detail-facts"><span>★ {detail.calificacionPromedio.toFixed(1)} ({detail.cantidadCalificaciones} opiniones)</span><span>◷ {detail.horario || "Horario por confirmar"}</span></div>
              <h3>Planes disponibles</h3>
              {detail.planes.length ? <div className="detail-plans">{detail.planes.map((plan) => <div className="detail-plan" key={plan.id}><div><strong>{plan.nombre}</strong><p>{plan.descripcion || plan.duracion}</p></div><b>{formatPrice(plan.precio)}</b></div>)}</div> : <p className="muted-copy">Aún no hay planes publicados para este sitio.</p>}
              <h3>Opiniones de viajeros</h3>
              <div className="reviews-list">{reviews.length ? reviews.map((review) => <article className="review-item" key={review.id}><strong>{review.nombresUsuario || "Viajero"} · ★ {review.puntuacion}</strong><p>{review.comentario || "Sin comentario."}</p></article>) : <p className="muted-copy">Sé la primera persona en compartir su experiencia.</p>}</div>
              <form className="review-form" onSubmit={(event) => void submitRating(event)}>
                <label>Tu calificación<select value={rating} onChange={(event) => setRating(Number(event.target.value))}><option value={5}>5 estrellas - Me encantó</option><option value={4}>4 estrellas - Muy bueno</option><option value={3}>3 estrellas - Está bien</option><option value={2}>2 estrellas - Podría mejorar</option><option value={1}>1 estrella - No fue para mí</option></select></label>
                <label>Cuéntanos cómo te fue<textarea value={comment} onChange={(event) => setComment(event.target.value)} maxLength={5000} placeholder="Tu opinión ayuda a otros viajeros..." /></label>
                <button className="primary-button" type="submit">Compartir opinión</button>
              </form>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default App;
