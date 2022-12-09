import { showNotification } from "@mantine/notifications";
import { IconAlertTriangle, IconX } from "@tabler/icons";
import mapboxgl from "mapbox-gl";
import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import axios from "../../utils/axios";
import MapBase from "./MapBase";
import MapUI from "./MapUI";

function Map() {
  const [setActive]: [setActive: (active: string) => void] = useOutletContext();
  useEffect(() => {
    setActive("Browse");
  });

  const [curLocation, setCurLocation] = useState<mapboxgl.LngLat | null>(null);
  const [curFeature, setCurFeature] = useState<GeoJSON.Feature | null>(null);
  const [studios, setStudios] = useState<GeoJSON.FeatureCollection>({
    type: "FeatureCollection",
    features: [],
  });

  const fetchLocation = async () => {
    if (navigator.geolocation) {
      let result = await navigator.permissions.query({ name: "geolocation" });
      if (result.state !== "denied") {
        navigator.geolocation.getCurrentPosition((position) => {
          setCurLocation(
            new mapboxgl.LngLat(
              position.coords.longitude,
              position.coords.latitude
            )
          );
        });
      } else {
        showNotification({
          title: "Can't get current location",
          message:
            "We can't get your location unless you give this website permission.",
          icon: <IconAlertTriangle stroke="2px" size="18px" />,
          radius: "lg",
          autoClose: false,
        });
      }
    }
  };

  const geocode = async (query: string) => {
    axios
      .get(
        encodeURI(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?country=CA&limit=1&access_token=pk.eyJ1IjoiMWl6YXJkbyIsImEiOiJjbGFoOHFtZ2owNzV6M3ZuNTkyamVkeWozIn0.2LLzH1LNQYbi-O1upIKLGQ`
        ),
        {
          withCredentials: false,
        }
      )
      .then((res) => {
        if (res.data.features.length === 0) {
          showNotification({
            title: "No matching locations found",
            message: `Your search "${query}" returned 0 results`,
            icon: <IconX />,
            color: "red",
            radius: "md",
          });
        } else {
          const coords = res.data.features[0].geometry.coordinates;
          setCurLocation(new mapboxgl.LngLat(coords[0], coords[1]));
        }
      })
      .catch((err) => {
        showNotification({
          title: "Could not get location",
          message: err.message,
          icon: <IconX />,
          color: "red",
          radius: "md",
        });
      });
  };

  return (
    <div className="map-page-container">
      <MapBase
        curLocation={curLocation}
        curFeature={curFeature}
        studios={studios}
        setStudios={setStudios}
      />
      <MapUI
        fetchLocation={fetchLocation}
        geocode={geocode}
        curFeature={curFeature}
        setCurFeature={setCurFeature}
        studios={studios}
      />
    </div>
  );
}

export default Map;
