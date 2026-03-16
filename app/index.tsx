import {
  Camera,
  CameraRef,
  FillLayer,
  HeatmapLayer,
  LineLayer,
  MapView,
  MarkerView,
  ShapeSource,
} from "@maplibre/maplibre-react-native";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";

import React, { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

interface DeliveryZone {
  zone_id: string;
  zone_name: string;
  center: [number, number];
  delivery_count: number;
  points: Array<{ lng: number; lat: number; count: number }>;
}

const DELIVERY_ZONES: DeliveryZone[] = [
  {
    zone_id: "zone_001",
    zone_name: "Store Core Zone",
    center: [83.4651, 27.6919],
    delivery_count: 342,
    points: [
      { lng: 83.4651, lat: 27.6919, count: 98 },
      { lng: 83.4653, lat: 27.6922, count: 92 },
      { lng: 83.4649, lat: 27.6916, count: 87 },
      { lng: 83.4655, lat: 27.6918, count: 85 },
      { lng: 83.4648, lat: 27.6921, count: 80 },
      { lng: 83.4654, lat: 27.6924, count: 76 },
      { lng: 83.4646, lat: 27.6917, count: 72 },
      { lng: 83.4658, lat: 27.692, count: 68 },
    ],
  },
  {
    zone_id: "zone_002",
    zone_name: "Residential North",
    center: [83.4642, 27.6942],
    delivery_count: 187,
    points: [
      { lng: 83.464, lat: 27.6925, count: 55 },
      { lng: 83.4638, lat: 27.693, count: 52 },
      { lng: 83.4635, lat: 27.6935, count: 46 },
      { lng: 83.4642, lat: 27.6942, count: 44 },
      { lng: 83.4628, lat: 27.695, count: 38 },
      { lng: 83.4622, lat: 27.6958, count: 30 },
      { lng: 83.4615, lat: 27.6965, count: 22 },
    ],
  },
  {
    zone_id: "zone_003",
    zone_name: "Commercial South",
    center: [83.4665, 27.6895],
    delivery_count: 210,
    points: [
      { lng: 83.466, lat: 27.6905, count: 62 },
      { lng: 83.4662, lat: 27.691, count: 58 },
      { lng: 83.4665, lat: 27.69, count: 54 },
      { lng: 83.4668, lat: 27.6895, count: 50 },
      { lng: 83.467, lat: 27.688, count: 38 },
      { lng: 83.4675, lat: 27.6875, count: 32 },
      { lng: 83.4678, lat: 27.6865, count: 24 },
      { lng: 83.4682, lat: 27.6855, count: 18 },
    ],
  },
  {
    zone_id: "zone_004",
    zone_name: "Market East",
    center: [83.4685, 27.694],
    delivery_count: 145,
    points: [
      { lng: 83.468, lat: 27.694, count: 48 },
      { lng: 83.4685, lat: 27.6945, count: 44 },
      { lng: 83.469, lat: 27.695, count: 36 },
      { lng: 83.4695, lat: 27.6955, count: 28 },
      { lng: 83.47, lat: 27.696, count: 20 },
      { lng: 83.4705, lat: 27.6965, count: 14 },
    ],
  },
  {
    zone_id: "zone_005",
    zone_name: "Outskirts West",
    center: [83.461, 27.6895],
    delivery_count: 72,
    points: [
      { lng: 83.4625, lat: 27.6895, count: 22 },
      { lng: 83.462, lat: 27.689, count: 18 },
      { lng: 83.461, lat: 27.688, count: 14 },
      { lng: 83.46, lat: 27.687, count: 10 },
      { lng: 83.4595, lat: 27.686, count: 8 },
    ],
  },
  {
    zone_id: "zone_006",
    zone_name: "Far North Suburbs",
    center: [83.463, 27.6975],
    delivery_count: 38,
    points: [
      { lng: 83.463, lat: 27.697, count: 12 },
      { lng: 83.4618, lat: 27.6978, count: 10 },
      { lng: 83.4605, lat: 27.6985, count: 8 },
      { lng: 83.4595, lat: 27.699, count: 6 },
      { lng: 83.458, lat: 27.6995, count: 5 },
      { lng: 83.4565, lat: 27.7, count: 4 },
    ],
  },
  {
    zone_id: "zone_007",
    zone_name: "Industrial Far East",
    center: [83.472, 27.692],
    delivery_count: 25,
    points: [
      { lng: 83.471, lat: 27.685, count: 8 },
      { lng: 83.4715, lat: 27.687, count: 7 },
      { lng: 83.472, lat: 27.692, count: 6 },
      { lng: 83.473, lat: 27.699, count: 5 },
      { lng: 83.474, lat: 27.684, count: 4 },
      { lng: 83.4555, lat: 27.685, count: 3 },
    ],
  },
];

const MAX_COUNT = Math.max(
  ...DELIVERY_ZONES.flatMap((z) => z.points.map((p) => p.count)),
);

const HEATMAP_GEOJSON: GeoJSON.FeatureCollection<GeoJSON.Point> = {
  type: "FeatureCollection",
  features: DELIVERY_ZONES.flatMap((zone) =>
    zone.points.map((point) => ({
      type: "Feature" as const,
      geometry: { type: "Point" as const, coordinates: [point.lng, point.lat] },
      properties: {
        weight: point.count / MAX_COUNT,
        zone_id: zone.zone_id,
        zone_name: zone.zone_name,
        raw_count: point.count,
      },
    })),
  ),
};

const STORE_LOCATION: [number, number] = [83.465146, 27.691899];
// const DESTINATION: [number, number] = [83.465058, 27.68584];
const DESTINATION: [number, number] = [83.4653, 27.6983];
// const DESTINATION: [number, number] = [85.3222, 27.7103];
const GEOFENCE_RADIUS = 500;
const GEOFENCE_TASK = "GEOFENCING_TASK";

function buildCircleGeoJSON(
  center: [number, number],
  radiusMeters: number,
  steps = 64,
): GeoJSON.Feature<GeoJSON.Polygon> {
  const [lng, lat] = center;
  const coords: [number, number][] = [];

  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * 2 * Math.PI;
    const dLat = (radiusMeters * Math.cos(angle)) / 111320;
    const dLng =
      (radiusMeters * Math.sin(angle)) /
      (111320 * Math.cos((lat * Math.PI) / 180));
    coords.push([lng + dLng, lat + dLat]);
  }

  return {
    type: "Feature",
    geometry: { type: "Polygon", coordinates: [coords] },
    properties: {},
  };
}

const GEOFENCE_CIRCLE = buildCircleGeoJSON(STORE_LOCATION, GEOFENCE_RADIUS);

TaskManager.defineTask(
  GEOFENCE_TASK,
  async ({
    data: { eventType, region },
    error,
  }: {
    data: {
      eventType: Location.GeofencingEventType;
      region: Location.LocationRegion;
    };
    error: TaskManager.TaskManagerError | null;
  }) => {
    if (error) {
      console.error("Geofence task error:", error);
      return;
    }
    console.log("Geofence event:", eventType, region);
  },
);
const HomeScreen = () => {
  const [err, setErr] = useState("");
  const [userLocation, setUserLocation] =
    useState<Location.LocationObject | null>(null);
  const cameraRef = useRef<CameraRef>(null);

  const [isInsideGeofence, setIsInsideGeofence] = useState<boolean | null>(
    null,
  );

  const [initialCenter, setInitialCenter] = useState<[number, number] | null>(
    null,
  );

  const animatedLatitude = useRef(new Animated.Value(0)).current;
  const animatedLongitude = useRef(new Animated.Value(0)).current;
  const [displayCoordinate, setDisplayCoordinate] = useState<[number, number]>([
    0, 0,
  ]);

  console.log("userLocation", userLocation);

  const getDistanceMeters = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ) => {
    const R = 6371000;
    const toRad = (v: number) => (v * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const checkGeofence = (latitude: number, longitude: number) => {
    const distance = getDistanceMeters(
      latitude,
      longitude,
      STORE_LOCATION[1],
      STORE_LOCATION[0],
    );
    console.log(`Distance to store: ${distance.toFixed(1)}m`);
    setIsInsideGeofence(distance <= GEOFENCE_RADIUS);
  };

  useEffect(() => {
    let subscription: Location.LocationSubscription;
    let listenerId: string;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== "granted") {
          setErr("Location permission denied");
          return;
        }

        const { status: bgStatus } =
          await Location.requestBackgroundPermissionsAsync();
        if (bgStatus !== "granted") {
          console.warn(
            "Background location permission denied — geofencing may not work when app is backgrounded",
          );
        }

        try {
          await Location.startGeofencingAsync(GEOFENCE_TASK, [
            {
              latitude: STORE_LOCATION[1],
              longitude: STORE_LOCATION[0],
              radius: GEOFENCE_RADIUS,
              notifyOnEnter: true,
              notifyOnExit: true,
            },
          ]);
          console.log("Geofencing started");
        } catch (e) {
          console.error("Failed to start geofencing:", e);
        }

        const initialLoc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        const initialCoords: [number, number] = [
          initialLoc.coords.longitude,
          initialLoc.coords.latitude,
        ];
        setUserLocation(initialLoc);

        setInitialCenter(initialCoords);

        checkGeofence(initialLoc.coords.latitude, initialLoc.coords.longitude);

        animatedLongitude.setValue(initialCoords[0]);
        animatedLatitude.setValue(initialCoords[1]);

        listenerId = animatedLongitude.addListener(({ value }) => {
          const latValue = (animatedLatitude as any)._value;
          setDisplayCoordinate([value, latValue]);
        });

        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 5000,
            distanceInterval: 1,
          },
          (loc) => {
            checkGeofence(loc.coords.latitude, loc.coords.longitude);

            setUserLocation(loc);
            console.log(
              "location updated at:",
              new Date().toLocaleTimeString(),
              loc.coords,
            );

            const { longitude, latitude } = loc.coords;

            Animated.parallel([
              Animated.timing(animatedLongitude, {
                toValue: longitude,
                duration: 1000,
                useNativeDriver: false,
              }),
              Animated.timing(animatedLatitude, {
                toValue: latitude,
                duration: 1000,
                useNativeDriver: false,
              }),
            ]).start();

            cameraRef.current?.setCamera({
              zoomLevel: 1,
              centerCoordinate: [longitude, latitude],
              animationDuration: 500,
            });
          },
        );
      } catch (error) {
        console.error("Location setup error:", err);
      }
    })();

    return () => {
      subscription?.remove();
      if (listenerId) {
        animatedLongitude.removeListener(listenerId);
      }
      Location.stopGeofencingAsync(GEOFENCE_TASK).catch(() => {});
    };
  }, []);

  console.log("isInsideGeofence", isInsideGeofence);

  const fillColor = isInsideGeofence
    ? "rgba(46, 125, 50, 0.15)"
    : "rgba(198, 40, 40, 0.12)";
  const strokeColor = isInsideGeofence ? "#2E7D32" : "#C62828";

  return (
    <View style={{ flex: 1 }}>
      <MapView
        style={{ flex: 1 }}
        mapStyle="https://tiles.openfreemap.org/styles/liberty"
      >
        <Camera
          ref={cameraRef}
          centerCoordinate={initialCenter ?? DESTINATION}
        />
        <ShapeSource id="heatmap-source" shape={HEATMAP_GEOJSON}>
          <HeatmapLayer
            id="delivery-heatmap"
            style={{
              heatmapWeight: ["get", "weight"],
              heatmapIntensity: [
                "interpolate",
                ["linear"],
                ["zoom"],
                10,
                0.8,
                15,
                1.5,
              ],
              heatmapRadius: [
                "interpolate",
                ["linear"],
                ["zoom"],
                10,
                20,
                15,
                45,
              ],
              heatmapOpacity: 0.85,
              heatmapColor: [
                "interpolate",
                ["linear"],
                ["heatmap-density"],
                0,
                "rgba(0,0,255,0)",
                0.15,
                "rgba(65,105,225,0.6)",
                0.35,
                "rgba(0,200,100,0.7)",
                0.55,
                "rgba(255,220,0,0.8)",
                0.75,
                "rgba(255,140,0,0.9)",
                1.0,
                "rgba(220,30,30,1)",
              ],
            }}
          />
        </ShapeSource>

        <ShapeSource id="geofence-source" shape={GEOFENCE_CIRCLE}>
          <FillLayer id="geofence-fill" style={{ fillColor, fillOpacity: 1 }} />
          <LineLayer
            id="geofence-border"
            style={{
              lineColor: strokeColor,
              lineWidth: 2,
              lineDasharray: [4, 3],
            }}
          />
        </ShapeSource>

        {userLocation && (
          <MarkerView coordinate={displayCoordinate}>
            <View style={styles.userMarker}>
              <View style={styles.userDot} />
            </View>
          </MarkerView>
        )}

        <MarkerView coordinate={DESTINATION}>
          <View style={styles.marker}>
            <View style={styles.markerDot} />
          </View>
        </MarkerView>

        <MarkerView coordinate={STORE_LOCATION}>
          <View style={styles.storeMarker}>
            <View style={styles.storeMarkerDot} />
          </View>
        </MarkerView>
      </MapView>

      {isInsideGeofence !== null && (
        <View style={styles.bannerWrapper}>
          <View
            style={[
              styles.banner,
              isInsideGeofence
                ? styles.bannerAvailable
                : styles.bannerUnavailable,
            ]}
          >
            <View>
              <Text style={styles.bannerTitle}>
                {isInsideGeofence
                  ? "Service Available"
                  : "Service Not Available"}
              </Text>
              <Text style={styles.bannerSubtitle}>
                {isInsideGeofence
                  ? "You are within the service area"
                  : "You are outside the service area"}
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  bannerWrapper: {
    position: "absolute",
    bottom: 40,
    left: 16,
    right: 16,
    alignItems: "center",
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 16,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  bannerAvailable: {
    backgroundColor: "#E8F5E9",
  },
  bannerUnavailable: {
    backgroundColor: "#FFEBEE",
  },

  bannerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#212121",
  },
  bannerSubtitle: {
    fontSize: 12,
    color: "#616161",
    marginTop: 2,
  },
  userMarker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(0,122,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  userDot: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: "#007AFF",
    borderWidth: 2,
    borderColor: "white",
  },
  marker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(255, 59, 48, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  markerDot: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: "#FF3B30",
    borderWidth: 2,
    borderColor: "white",
  },
  storeMarker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(151, 154, 1, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  storeMarkerDot: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: "#00ff00",
    borderWidth: 2,
    borderColor: "white",
  },
});

export default HomeScreen;
