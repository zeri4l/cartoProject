var map;
var marker_s, marker_e;
var resultMarkerArr = [];
var resultdrawArr = [];
var chktraffic = [];
var drawInfoArr = [];
var geojsonPolygons = [];

function initTmap() {
  map = new Tmapv2.Map("map_div", {
    center: new Tmapv2.LatLng(37.5232068, 126.9251499),
    width: "100%",
    height: "500px",
    zoom: 13,
  });
}

document
  .getElementById("geojsonUpload")
  .addEventListener("change", function (event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = function (e) {
      const geo = JSON.parse(e.target.result);
      const polygons = geo.features.filter(
        (f) =>
          f.geometry &&
          (f.geometry.type === "Polygon" || f.geometry.type === "MultiPolygon")
      );

      geojsonPolygons = polygons.map((f) => {
        if (f.geometry.type === "Polygon") {
          return turf.polygon(f.geometry.coordinates);
        } else if (f.geometry.type === "MultiPolygon") {
          return turf.multiPolygon(f.geometry.coordinates);
        }
      });

      polygons.slice(0, 50).forEach((feature) => {
        const coords = feature.geometry.coordinates[0].map(
          ([lng, lat]) => new Tmapv2.LatLng(lat, lng)
        );
        new Tmapv2.Polygon({
          paths: coords,
          strokeColor: "#0000FF",
          strokeWeight: 2,
          fillColor: "#0000FF",
          fillOpacity: 0.3,
          map: map,
        });
      });
    };
    reader.readAsText(file);
  });

$("#btn_select").click(function () {
  resettingMap();

  const startX = document.getElementById("startX").value;
  const startY = document.getElementById("startY").value;
  const endX = document.getElementById("endX").value;
  const endY = document.getElementById("endY").value;

  if (marker_s) marker_s.setMap(null);
  if (marker_e) marker_e.setMap(null);

  marker_s = new Tmapv2.Marker({
    position: new Tmapv2.LatLng(startY, startX),
    icon: "쿠옹.png",
    iconSize: new Tmapv2.Size(35, 35),
    map: map,
  });

  marker_e = new Tmapv2.Marker({
    position: new Tmapv2.LatLng(endY, endX),
    icon: "flflfl.png",
    iconSize: new Tmapv2.Size(35, 38),
    map: map,
  });

  const searchOption = $("#selectLevel").val();
  const trafficInfochk = $("#year").val();
  const headers = { appKey: "my3V8AntW6aJFirDGlo8Y2totMYfWsWVa6550hEn" };

  $.ajax({
    type: "POST",
    headers: headers,
    url: "https://apis.openapi.sk.com/tmap/routes?version=1&format=json",
    data: {
      startX: startX,
      startY: startY,
      endX: endX,
      endY: endY,
      reqCoordType: "WGS84GEO",
      resCoordType: "WGS84GEO",
      searchOption: searchOption,
      trafficInfo: trafficInfochk,
    },
    success: function (response) {
      const features = response.features;
      const lineCoords = features
        .filter((f) => f.geometry.type === "LineString")
        .flatMap((f) => f.geometry.coordinates);

      const routeLine = turf.lineString(lineCoords);
      const intersects = geojsonPolygons.some((p) =>
        turf.booleanIntersects(routeLine, p)
      );
      if (intersects) {
        alert("경로가 침수 지역과 겹칩니다. 다른 경로를 시도해보세요.");
        return;
      }

      const path = lineCoords.map(([lng, lat]) => new Tmapv2.LatLng(lat, lng));
      const polyline = new Tmapv2.Polyline({
        path: path,
        strokeColor: "#FF0000",
        strokeWeight: 6,
        map: map,
      });
      resultdrawArr.push(polyline);

      const summary = features.find(
        (f) =>
          f.geometry.type === "Point" &&
          f.properties &&
          typeof f.properties.totalTime !== "undefined"
      );

      if (summary) {
        const totalDistance = summary.properties.totalDistance;
        const totalTime = summary.properties.totalTime;
        const result = `예상 거리: ${(totalDistance / 1000).toFixed(
          2
        )} km, 예상 시간: ${(totalTime / 60).toFixed(1)} 분`;
        document.getElementById("result").innerHTML = result;
      } else {
        document.getElementById("result").innerHTML =
          "거리/시간 정보를 가져오지 못했습니다.";
      }
    },
  });
});

function resettingMap() {
  if (resultMarkerArr.length > 0) {
    resultMarkerArr.forEach((m) => m.setMap(null));
  }
  if (resultdrawArr.length > 0) {
    resultdrawArr.forEach((l) => l.setMap(null));
  }
  resultMarkerArr = [];
  resultdrawArr = [];
  chktraffic = [];
  drawInfoArr = [];
}
