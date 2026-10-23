export interface Place {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  rating: number;
  description: string;
}

export const places: Place[] = [
  {
    id: 1,
    name: "Monserrate",
    latitude: 4.6059,
    longitude: -74.0550,
    rating: 4.8,
    description: "Uno de los principales sitios turísticos de Bogotá.",
  },
  {
    id: 2,
    name: "Museo del Oro",
    latitude: 4.6011,
    longitude: -74.0721,
    rating: 4.7,
    description: "Museo arqueológico ubicado en el centro de Bogotá.",
  },
  {
    id: 3,
    name: "Museo Botero",
    latitude: 4.5964,
    longitude: -74.0695,
    rating: 4.7,
    description: "Museo de arte ubicado en La Candelaria.",
  },
];