import {
  Camera,
  CameraRef,
  MapView,
  MarkerView,
} from "@maplibre/maplibre-react-native";
import * as Location from "expo-location";

import React, { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, View } from "react-native";

const STORE_LOCATION: [number, number] = [83.465146, 27.691899];
const DESTINATION: [number, number] = [83.465058, 27.68584];
// const DESTINATION: [number, number] = [83.4653, 27.6983];
const GEOFENCE_RADIUS = 100;
const GEOFENCE_TASK = "GEOFENCING_TASK";

const HomeScreen = () => {
  const [err, setErr] = useState("");
  const [userLocation, setUserLocation] =
    useState<Location.LocationObject | null>(null);
  const cameraRef = useRef<CameraRef>(null);

  const [initialCenter, setInitialCenter] = useState<[number, number] | null>(
    null,
  );

  const animatedLatitude = useRef(new Animated.Value(0)).current;
  const animatedLongitude = useRef(new Animated.Value(0)).current;
  const [displayCoordinate, setDisplayCoordinate] = useState<[number, number]>([
    0, 0,
  ]);

  console.log("userLocation", userLocation);

  useEffect(() => {
    let subscription: Location.LocationSubscription;
    let listenerId: string;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        setErr("Location permission denied");
        return;
      }

      const initialLoc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const initialCoords: [number, number] = [
        initialLoc.coords.longitude,
        initialLoc.coords.latitude,
      ];
      setUserLocation(initialLoc);

      setInitialCenter([
        initialLoc.coords.longitude,
        initialLoc.coords.latitude,
      ]);

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
            zoomLevel: 16,
            centerCoordinate: [longitude, latitude],
            animationDuration: 500,
          });
        },
      );
    })();

    return () => {
      subscription?.remove();
      if (listenerId) {
        animatedLongitude.removeListener(listenerId);
      }
    };
  }, []);

  return (
    <MapView
      style={{ flex: 1 }}
      mapStyle="https://tiles.openfreemap.org/styles/liberty"
    >
      <Camera ref={cameraRef} centerCoordinate={initialCenter ?? DESTINATION} />

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
  );
};

const styles = StyleSheet.create({
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
    backgroundColor: "#ffe600",
    borderWidth: 2,
    borderColor: "white",
  },
});

export default HomeScreen;
