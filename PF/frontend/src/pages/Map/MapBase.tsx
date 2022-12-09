import mapboxgl, { GeoJSONSource, LngLat, Marker, Map } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import "./styles.css";
import axios from "../../utils/axios";
import React, { useEffect, useRef, useState } from "react";
import GeoJSON from "geojson";
import { useMantineTheme } from "@mantine/core";
import distance from "@turf/distance";

mapboxgl.accessToken =
  "pk.eyJ1IjoiMWl6YXJkbyIsImEiOiJjbGFoOHFtZ2owNzV6M3ZuNTkyamVkeWozIn0.2LLzH1LNQYbi-O1upIKLGQ";

function MapBase({
  curLocation,
  curFeature,
  studios,
  setStudios,
}: {
  curLocation: LngLat | null;
  curFeature: GeoJSON.Feature | null;
  studios: GeoJSON.FeatureCollection;
  setStudios: (studios: GeoJSON.FeatureCollection) => void;
}) {
  const theme = useMantineTheme();
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<Map | null>(null);
  const [mapLocation, setMapLocation] = useState<LngLat>(
    new LngLat(-79.3871, 43.6426)
  );
  const [droppin] = useState(
    new Marker({
      color: theme.primaryColor,
      scale: 0.85,
    })
  );

  const getStudios = () => {
    let features: GeoJSON.Feature[] = [];
    axios
      .get("/studios/nearby", {
        params: {
          lat: mapLocation.lat.toFixed(6),
          long: mapLocation.lng.toFixed(6),
          limit: "20",
        },
      })
      .then((res) => {
        for (const studio of res.data.results) {
          features.push({
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: [studio.long, studio.lat],
            },
            properties: {
              id: studio.id,
              name: studio.name,
              address: studio.address,
              postal_code: studio.postal_code,
              directions: studio.directions,
              distance: (
                Math.round(
                  distance(
                    [mapLocation.lng, mapLocation.lat],
                    [studio.long, studio.lat],
                    {
                      units: "kilometers",
                    }
                  ) * 10
                ) / 10
              ).toFixed(1),
            },
          });
        }
        setStudios({ type: "FeatureCollection", features: features });
      })
      .catch((err) => {
        console.log(err);
      });
  };

  // Create map and add data
  useEffect(() => {
    if (map.current) return;
    map.current = new Map({
      container: mapContainer.current as HTMLDivElement,
      style: "mapbox://styles/mapbox/streets-v11",
      center: mapLocation,
      zoom: 13,
    });

    map.current.on("load", () => {
      map.current?.setPadding({
        left: 0,
        right: (
          document.querySelector(
            ".map-results-area .mantine-Paper-root"
          ) as HTMLElement
        )?.offsetWidth,
        top: 0,
        bottom: 0,
      });
      map.current?.addSource("studios", { type: "geojson", data: studios });
      getStudios();
      map.current?.addLayer({
        id: "studios",
        type: "circle",
        source: "studios",
        paint: {
          "circle-radius": 6,
          "circle-color": theme.primaryColor,
          "circle-stroke-width": 2,
          "circle-stroke-color":
            theme.colorScheme === "dark" ? theme.colors.dark[7] : theme.white,
        },
      });
      if (map.current) droppin.addTo(map.current);
      map.current?.on("click", (e) => {
        setMapLocation(e.lngLat);
      });
    });
  });

  // Update map location when we get a new current location
  useEffect(() => {
    if (curLocation) {
      setMapLocation(curLocation);
    }
  }, [curLocation]);

  // Zoom to feature when we get a new feature
  useEffect(() => {
    if (curFeature)
      map.current?.flyTo({
        center: (curFeature.geometry as GeoJSON.Point).coordinates as [
          number,
          number
        ],
        zoom: 17,
      });
  }, [curFeature]);

  // Update layer when studio data changes
  useEffect(() => {
    let source = map.current?.getSource("studios") as GeoJSONSource;
    if (source) {
      source.setData(studios);
    }
  }, [studios]);

  // Update map center and nearby studios any time lng/lat changes
  useEffect(() => {
    if (map.current) {
      map.current.flyTo({ center: mapLocation, zoom: 13 });
      droppin.remove();
      droppin.setLngLat(mapLocation);
      droppin.addTo(map.current);
    }
    getStudios();
  }, [mapLocation, droppin]);

  return <div ref={mapContainer} className="map-base-container" />;
}

export default MapBase;
