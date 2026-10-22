import type { Lugar } from "../App";
import PlaceCard from "./PlaceCard";

interface ResultsProps {
  lugares: Lugar[];
}

function Results({ lugares }: ResultsProps) {
  return (
    <div className="results">
      <h2>Resultados ({lugares.length})</h2>

      {lugares.length === 0 ? (
        <p>No se encontraron lugares con esos filtros.</p>
      ) : (
        lugares.map((lugar) => (
          <PlaceCard
            key={lugar.id}
            name={lugar.nombre}
            rating={Number(lugar.calificacion)}
            description={
              lugar.descripcion ?? "Sin descripción disponible."
            }
          />
        ))
      )}
    </div>
  );
}

export default Results;