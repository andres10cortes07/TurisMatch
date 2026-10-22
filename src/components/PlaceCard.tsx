interface PlaceCardProps {
  name: string;
  rating: number;
  description: string;
}

function PlaceCard({
  name,
  rating,
  description,
}: PlaceCardProps) {
  return (
    <div className="place-card">
      <h3>📍 {name}</h3>

      <p>⭐ {rating}</p>

      <p>{description}</p>

      <button>Ver detalles</button>
    </div>
  );
}

export default PlaceCard;