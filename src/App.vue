<template>
  <div class="app">
    <!-- 顶部导航栏 -->
    <nav class="navbar">
      <div class="logo">🌍 旅行规划器 Voyage Plan</div>
      <div class="nav-links">
        <a href="#" class="active">规划行程</a>
        <a href="#">我的行程</a>
        <a href="#">收藏夹</a>
      </div>
      <div class="user-avatar">
        <span>👤 用户名</span>
      </div>
    </nav>

    <!-- 主要内容区：左右分栏 -->
    <div class="main-content">
      <!-- 左侧面板 -->
      <aside class="left-panel">
        <!-- 输入表单组件 -->
        <TripForm @generate="handleGenerate" />
        
        <!-- 行程概览 -->
        <div class="trip-summary" v-if="currentTrip">
          <h3>📅 当前行程</h3>
          <div class="trip-days">
            <div 
              v-for="(day, index) in currentTrip.days" 
              :key="index"
              class="day-card"
              @click="focusOnDay(day)"
            >
              <h4>第 {{ index + 1 }} 天</h4>
              <p>{{ day.attractions.length }} 个景点</p>
              <p class="transport-info">🚶 {{ day.totalWalkTime }}分钟</p>
            </div>
          </div>
        </div>

        <!-- 快捷操作 -->
        <div class="quick-actions">
          <button class="btn-save">💾 保存行程</button>
          <button class="btn-share">📤 分享</button>
          <button class="btn-export">📎 导出PDF</button>
        </div>
      </aside>

      <!-- 右侧地图区 -->
      <main class="right-panel">
        <MapView ref="mapView" />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import MapView from './components/MapView.vue';
import TripForm from './components/TripForm.vue';

const mapView = ref(null);
const currentTrip = ref(null);

// 新增：mock 数据生成函数（临时用）
const generateMockAttractions = (formData) => {
  // 根据目的地返回不同的 mock 数据
  const mockDB = {
    '法国': {
      attractions: [
        { name: '埃菲尔铁塔', lat: 48.8584, lng: 2.2945, duration: 90, tips: '建议傍晚去，可以看夜景' },
        { name: '卢浮宫', lat: 48.8606, lng: 2.3376, duration: 180, tips: '周一闭馆，提前预约' },
        { name: '巴黎圣母院', lat: 48.8530, lng: 2.3499, duration: 60, tips: '正在修复，外观可看' },
        { name: '凯旋门', lat: 48.8738, lng: 2.2950, duration: 45, tips: '可以登顶看香榭丽舍' }
      ]
    },
    '日本': {
      attractions: [
        { name: '浅草寺', lat: 35.7147, lng: 139.7966, duration: 90, tips: '早上人少' },
        { name: '东京塔', lat: 35.6586, lng: 139.7454, duration: 60, tips: '夜景很美' },
        { name: '涩谷十字路口', lat: 35.6595, lng: 139.7004, duration: 30, tips: '人最多的时候是傍晚' }
      ]
    },
    '意大利': {
      attractions: [
        { name: '罗马斗兽场', lat: 41.8902, lng: 12.4922, duration: 120, tips: '建议买套票' },
        { name: '威尼斯圣马可广场', lat: 45.4343, lng: 12.3388, duration: 90, tips: '小心鸽子' }
      ]
    }
  };

  // 获取用户输入的第一个国家
  const firstCountry = formData.countries[0];
  
  // 返回对应的 mock 数据，如果没有则返回默认数据
  return mockDB[firstCountry]?.attractions || [
    { name: '天安门', lat: 39.907, lng: 116.397, duration: 60, tips: '看升旗要早起' },
    { name: '故宫', lat: 39.916, lng: 116.397, duration: 180, tips: '从午门进' },
    { name: '颐和园', lat: 39.999, lng: 116.273, duration: 150, tips: '建议租个讲解器' }
  ];
};

// 新增：按天分组
const groupAttractionsByDay = (attractions, totalDays) => {
  const days = [];
  const perDay = Math.ceil(attractions.length / totalDays);
  
  for (let i = 0; i < totalDays; i++) {
    const start = i * perDay;
    const dayAttractions = attractions.slice(start, start + perDay);
    
    if (dayAttractions.length > 0) {
      days.push({
        attractions: dayAttractions,
        totalWalkTime: dayAttractions.reduce((sum, a) => sum + (a.duration || 0), 0)
      });
    }
  }
  
  return days;
};

// ⚠️ 替换原来的 handleGenerate
const handleGenerate = (formData) => {
  console.log('表单数据：', formData);
  
  // 1. 生成 mock 景点数据（代替 AI）
  const attractions = generateMockAttractions(formData);
  
  // 2. 按天分组
  const days = groupAttractionsByDay(attractions, formData.days);
  
  // 3. 保存到 currentTrip（左侧面板显示）
  currentTrip.value = { days };
  
  // 4. ⚠️ 最重要的改动：在地图上显示
  if (mapView.value) {
    mapView.value.displayAttractions(attractions);
    
    // 如果有路线数据也可以画（这里先不加）
    // mapView.value.drawRoute(someRoutePoints);
  }
  
  // 弹出提示（可选）
  alert(`已生成 ${attractions.length} 个景点，快去地图上看看吧！`);
};

// 新增：聚焦某一天
const focusOnDay = (day) => {
  if (mapView.value && day.attractions.length > 0) {
    mapView.value.flyToBounds(day.attractions);
  }
};
</script>

<style>
/* 所有样式保持不变 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
}

html, body {
  height: 100%;
  width: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

#app {
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
}

.app {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
}

/* 导航栏样式 */
.navbar {
  height: 60px;
  flex-shrink: 0;
  background: white;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.logo {
  font-size: 20px;
  font-weight: 600;
  color: #3b82f6;
}

.nav-links {
  display: flex;
  gap: 32px;
}

.nav-links a {
  text-decoration: none;
  color: #4b5563;
  font-size: 15px;
  font-weight: 500;
  padding: 4px 0;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.nav-links a:hover {
  color: #3b82f6;
}

.nav-links a.active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
}

.user-avatar {
  color: #4b5563;
  font-size: 14px;
}

/* 主内容区：左右分栏 */
.main-content {
  flex: 1;
  display: flex;
  overflow: hidden;
  min-height: 0;
  height: 100%;
}

/* 左侧面板 */
.left-panel {
  width: 500px;
  flex-shrink: 0;
  background: white;
  border-right: 1px solid #e5e7eb;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 100%;
}

/* 右侧地图面板 */
.right-panel {
  flex: 1;
  background: #e9e9e9;
  position: relative;
  height: 100%;
  min-height: 0;
  min-width: 0;
}

/* 行程概览样式 */
.trip-summary {
  background: #f9fafb;
  border-radius: 12px;
  padding: 16px;
  border: 1px solid #e5e7eb;
}

.trip-summary h3 {
  font-size: 16px;
  margin-bottom: 12px;
  color: #1f2937;
}

.trip-days {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.day-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.day-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 2px 8px rgba(59,130,246,0.1);
  transform: translateX(2px);
}

.day-card h4 {
  font-size: 14px;
  color: #1f2937;
  margin-bottom: 4px;
}

.day-card p {
  font-size: 13px;
  color: #6b7280;
}

.day-card .transport-info {
  font-size: 12px;
  color: #10b981;
  margin-top: 4px;
}

/* 快捷操作按钮 */
.quick-actions {
  display: flex;
  gap: 10px;
  margin-top: auto;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
}

.quick-actions button {
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-save {
  background: #3b82f6;
  color: white;
}

.btn-save:hover {
  background: #2563eb;
}

.btn-share {
  background: #e5e7eb;
  color: #4b5563;
}

.btn-share:hover {
  background: #d1d5db;
}

.btn-export {
  background: #f3f4f6;
  color: #4b5563;
  border: 1px solid #d1d5db;
}

.btn-export:hover {
  background: #e5e7eb;
}

/* 滚动条美化 */
.left-panel::-webkit-scrollbar {
  width: 6px;
}

.left-panel::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.left-panel::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.left-panel::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 响应式：屏幕太小时自动调整 */
@media (max-width: 768px) {
  .left-panel {
    min-width: 280px;
    width: 40%;
  }
}
</style>