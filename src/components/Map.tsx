
import {
  APIProvider,
  Map as GoogleMap,
  AdvancedMarker,
  InfoWindow,
} from "@vis.gl/react-google-maps";

import { useState } from "react";
import type { Lugar } from "../App";

interface MapProps {
  lugares: Lugar[];
}

function Map({ lugares }: MapProps) {
  const [lugarSeleccionado, setLugarSeleccionado] =
    useState<Lugar | null>(null);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const centro = { lat: 4.6097, lng: -74.0817 };

  return (
    <div style={{ width: "100%", height: "600px" }}>
      <APIProvider apiKey={apiKey}>
        <GoogleMap
          defaultCenter={centro}
          defaultZoom={12}
          mapId="DEMO_MAP_ID"
          style={{ width: "100%", height: "100%" }}
        >
          {lugares.map((lugar) => {
            if (
              lugar.latitud == null ||
              lugar.longitud == null
            ) {
              return null;
            }

            const position = {
              lat: Number(lugar.latitud),
              lng: Number(lugar.longitud),
            };

            if (
              !Number.isFinite(position.lat) ||
              !Number.isFinite(position.lng)
            ) {
              return null;
            }

            return (
              <AdvancedMarker
                key={lugar.id}
                position={position}
                title={lugar.nombre}
                onClick={() => setLugarSeleccionado(lugar)}
              />
            );
          })}

          {lugarSeleccionado &&
            lugarSeleccionado.latitud != null &&
            lugarSeleccionado.longitud != null && (
              <InfoWindow
                position={{
                  lat: Number(lugarSeleccionado.latitud),
                  lng: Number(lugarSeleccionado.longitud),
                }}
                onCloseClick={() => setLugarSeleccionado(null)}
              >
                <div>
                  <h3>{lugarSeleccionado.nombre}</h3>

                  <p>
                    {lugarSeleccionado.descripcion ??
                      "Sin descripción disponible."}
                  </p>

                  <p>
                    Calificación:{" "}
                    {Number(
                      lugarSeleccionado.calificacion
                    ).toFixed(1)}
                  </p>

                  <p>
                    Precio: $
                    {Number(
                      lugarSeleccionado.precio
                    ).toLocaleString("es-CO")}{" "}
                    COP
                  </p>
                </div>
              </InfoWindow>
            )}
        </GoogleMap>
      </APIProvider>
    </div>
  );
}

export default Map;
