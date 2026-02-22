<template>
  <div class="map-container">
    <div ref="mapElement" class="map"></div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// 修复图标路径
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const mapElement = ref(null);
// 新增：存储地图实例和图层
let map = null;
const markers = ref([]);
const polylines = ref([]);

// 暴露方法给父组件
defineExpose({
  displayAttractions,
  drawRoute,
  flyToBounds
});

onMounted(() => {
  // 修复默认图标
  L.Marker.prototype.options.icon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
  });

  // 初始化地图
  map = L.map(mapElement.value).setView([39.907, 116.397], 4);

  // 添加地图图层
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);

  // ⚠️ 删除原来的测试标记（第20行附近的那行 L.marker）
});

// 新增：显示景点列表
function displayAttractions(attractions) {
  if (!map) return;
  
  // 1. 删除旧的标记
  markers.value.forEach(marker => map.removeLayer(marker));
  markers.value = [];
  
  // 2. 添加新标记
  attractions.forEach(attraction => {
    const marker = L.marker([attraction.lat, attraction.lng])
      .bindPopup(`
        <b>${attraction.name}</b><br>
        ⏰ 建议游览: ${attraction.duration}分钟<br>
        ${attraction.tips || ''}
      `)
      .addTo(map);
    markers.value.push(marker);
  });
  
  // 3. 自动调整地图视野
  flyToBounds(attractions);
}

// 新增：绘制路线
function drawRoute(routePoints, color = 'blue') {
  if (!map || !routePoints || routePoints.length < 2) return;
  
  const polyline = L.polyline(routePoints, { 
    color: color, 
    weight: 4,
    opacity: 0.7
  }).addTo(map);
  
  polylines.value.push(polyline);
}

// 新增：让地图飞到一个区域
function flyToBounds(points) {
  if (!map || !points || points.length === 0) return;
  
  const bounds = L.latLngBounds(points.map(p => [p.lat, p.lng]));
  map.flyToBounds(bounds, { 
    padding: [50, 50],
    maxZoom: 15
  });
}
</script>

<style scoped>
.map-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.map {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #e9e9e9;
}
</style>