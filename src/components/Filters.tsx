import { useState } from "react";

export interface Filtros {
  ciudad: string;
  categoria: string;
  calificacionMinima: string;
  precioMaximo: string;
}

interface FiltersProps {
  onFilter: (filtros: Filtros) => void;
}

function Filters({ onFilter }: FiltersProps) {
  const [ciudad, setCiudad] = useState("");
  const [categoria, setCategoria] = useState("");
  const [calificacionMinima, setCalificacionMinima] = useState("");
  const [precioMaximo, setPrecioMaximo] = useState("");

  const aplicarFiltros = () => {
    onFilter({
      ciudad,
      categoria,
      calificacionMinima,
      precioMaximo,
    });
  };

  const limpiarFiltros = () => {
    setCiudad("");
    setCategoria("");
    setCalificacionMinima("");
    setPrecioMaximo("");

    onFilter({
      ciudad: "",
      categoria: "",
      calificacionMinima: "",
      precioMaximo: "",
    });
  };

  return (
    <section className="filters">
      <h2>Filtrar lugares</h2>

      <div>
        <label htmlFor="ciudad">Ciudad</label>
        <input
          id="ciudad"
          type="text"
          placeholder="Ej. Bogotá"
          value={ciudad}
          onChange={(e) => setCiudad(e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="categoria">Categoría</label>
        <select
          id="categoria"
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
        >
          <option value="">Todas las categorías</option>
          <option value="Museo">Museos</option>
          <option value="Naturaleza">Naturaleza</option>
          <option value="Cultura">Cultura</option>
          <option value="Gastronomía">Gastronomía</option>
          <option value="Aventura">Aventura</option>
        </select>
      </div>

      <div>
        <label htmlFor="calificacion">Calificación mínima</label>
        <select
          id="calificacion"
          value={calificacionMinima}
          onChange={(e) => setCalificacionMinima(e.target.value)}
        >
          <option value="">Cualquier calificación</option>
          <option value="3">3 estrellas o más</option>
          <option value="4">4 estrellas o más</option>
          <option value="4.5">4.5 estrellas o más</option>
          <option value="5">5 estrellas</option>
        </select>
      </div>

      <div>
        <label htmlFor="precio">Precio máximo (COP)</label>
        <input
          id="precio"
          type="number"
          min="0"
          placeholder="Ej. 10000"
          value={precioMaximo}
          onChange={(e) => setPrecioMaximo(e.target.value)}
        />
      </div>

      <div className="filter-buttons">
        <button type="button" onClick={aplicarFiltros}>
          Aplicar filtros
        </button>

        <button type="button" onClick={limpiarFiltros}>
          Limpiar
        </button>
      </div>
    </section>
  );
}

export default Filters;