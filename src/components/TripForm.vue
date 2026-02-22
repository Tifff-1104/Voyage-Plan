<template>
  <div class="trip-form">
    <h2>✈️ 智能行程规划</h2>
    <form @submit.prevent="handleSubmit">
      <!-- 1. 目的地选择（核心） -->
      <div class="form-section">
        <h3>📍 目的地 <span class="required">*必填</span></h3>
        
        <!-- 国家/地区选择器 -->
        <div class="form-group">
          <label>国家/地区</label>
          <div class="country-selector">
            <div 
              v-for="country in selectedCountries" 
              :key="country"
              class="country-tag"
            >
              {{ country }}
              <button type="button" @click="removeCountry(country)" class="remove-tag">×</button>
            </div>
            <input 
              type="text" 
              v-model="countryInput"
              @keydown.enter.prevent="addCountry"
              @keydown. comma.prevent="addCountry"
              @blur="addCountry"
              placeholder="输入国家后按回车或逗号添加"
              class="country-input"
            />
          </div>
          <small class="hint">支持多个国家，例如：法国 意大利 西班牙</small>
        </div>

        <!-- 城市/地区（选填） -->
        <div class="form-group">
          <label>城市/地区 <span class="optional">(选填)</span></label>
          <div class="city-selector">
            <div 
              v-for="city in selectedCities" 
              :key="city"
              class="city-tag"
            >
              {{ city }}
              <button type="button" @click="removeCity(city)" class="remove-tag">×</button>
            </div>
            <input 
              type="text" 
              v-model="cityInput"
              @keydown.enter.prevent="addCity"
              @keydown. comma.prevent="addCity"
              @blur="addCity"
              placeholder="输入城市后按回车或逗号添加（可选）"
              class="city-input"
            />
          </div>
          <small class="hint">不填则默认探索整个国家</small>
        </div>

        <!-- 目的地类型提示 -->
        <div class="destination-type">
          <span class="type-badge" :class="{ active: destinationScope === 'multiple-countries' }">
            {{ destinationScope === 'multiple-countries' ? '🌍 多国旅行' : '🏞️ 单一地区' }}
          </span>
        </div>
      </div>

      <!-- 2. 行程基础设置 -->
      <div class="form-section">
        <h3>⚙️ 行程设置</h3>
        
        <!-- 旅行天数 -->
        <div class="form-group">
          <label>📅 旅行天数 <span class="required">*必填</span></label>
          <div class="number-input">
            <button type="button" @click="decreaseDays" class="number-btn">−</button>
            <input 
              type="number" 
              v-model.number="formData.days" 
              min="1" 
              max="90"
              required
            />
            <button type="button" @click="increaseDays" class="number-btn">+</button>
          </div>
          <small class="hint">1-90天</small>
        </div>

        <!-- 季节标签 -->
        <div class="form-group">
          <label>🌸 季节偏好</label>
          <div class="season-selector">
            <button 
              type="button"
              v-for="season in seasons" 
              :key="season.value"
              class="season-btn"
              :class="{ active: formData.season === season.value }"
              @click="formData.season = season.value"
            >
              {{ season.icon }} {{ season.label }}
            </button>
          </div>
        </div>
      </div>

      <!-- 3. 交通偏好（根据目的地动态变化） -->
      <div class="form-section">
        <h3>🚗 交通偏好</h3>
        <div class="transport-options">
          <label 
            v-for="option in transportOptions" 
            :key="option.value"
            class="transport-card"
            :class="{ 
              active: formData.transport === option.value,
              disabled: option.disabled
            }"
          >
            <input 
              type="radio" 
              v-model="formData.transport" 
              :value="option.value"
              :disabled="option.disabled"
              class="hidden-radio"
            />
            <span class="transport-icon">{{ option.icon }}</span>
            <span class="transport-label">{{ option.label }}</span>
            <span v-if="option.disabled" class="transport-note">不可用</span>
          </label>
        </div>
        <small class="hint" v-if="destinationScope === 'single-city'">
          ✓ 在同一城市内，可选择步行
        </small>
        <small class="hint" v-else>
          ⚠️ 跨城市旅行，仅支持公共交通或自驾
        </small>
      </div>

      <!-- 4. 景点偏好（多选） -->
      <div class="form-section">
        <h3>🏞️ 景点偏好 <span class="optional">(可多选)</span></h3>
        <div class="preference-grid">
          <label 
            v-for="pref in preferences" 
            :key="pref.value"
            class="preference-card"
            :class="{ active: formData.preferences.includes(pref.value) }"
          >
            <input 
              type="checkbox" 
              :value="pref.value"
              v-model="formData.preferences"
              class="hidden-checkbox"
            />
            <span class="pref-icon">{{ pref.icon }}</span>
            <span class="pref-label">{{ pref.label }}</span>
          </label>
        </div>
        <small class="hint">不选则自动混合推荐</small>
      </div>

      <!-- 5. 想去的景点（选填） -->
      <div class="form-section">
        <h3>📌 指定景点 <span class="optional">(选填)</span></h3>
        <div class="form-group">
          <div class="attraction-input-area">
            <textarea 
              v-model="formData.attractions" 
              placeholder="例如：埃菲尔铁塔, 卢浮宫, 罗马斗兽场..."
              rows="3"
            ></textarea>
          </div>
          <div class="attraction-tips" v-if="formData.attractions">
            <div class="tip">✨ 已输入 {{ attractionCount }} 个景点</div>
          </div>
          <small class="hint">用逗号分隔多个景点，不填则AI智能推荐</small>
        </div>
      </div>

      <!-- 6. 行程总结 -->
      <div class="form-summary" v-if="hasValidDestination">
        <h4>📋 行程概要</h4>
        <div class="summary-items">
          <div class="summary-item">
            <span class="summary-label">目的地：</span>
            <span class="summary-value">{{ destinationSummary }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">行程天数：</span>
            <span class="summary-value">{{ formData.days }} 天</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">交通方式：</span>
            <span class="summary-value">{{ selectedTransportLabel }}</span>
          </div>
          <div class="summary-item" v-if="formData.preferences.length">
            <span class="summary-label">偏好：</span>
            <span class="summary-value">{{ preferencesSummary }}</span>
          </div>
        </div>
      </div>

      <!-- 提交按钮 -->
      <button 
        type="submit" 
        class="submit-btn" 
        :disabled="loading || !hasValidDestination"
      >
        <span v-if="!loading">✨ 智能生成行程</span>
        <span v-else class="loading">
          <span class="spinner"></span>
          规划中...
        </span>
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const emit = defineEmits(['generate']);

// ============ 数据定义 ============
const seasons = [
  { value: 'spring', label: '春季', icon: '🌸' },
  { value: 'summer', label: '夏季', icon: '☀️' },
  { value: 'autumn', label: '秋季', icon: '🍂' },
  { value: 'winter', label: '冬季', icon: '❄️' },
  { value: 'any', label: '任意', icon: '🌟' }
];

const preferences = [
  { value: 'nature', label: '自然风光', icon: '🏔️' },
  { value: 'city', label: '城市景观', icon: '🌆' },
  { value: 'culture', label: '历史文化', icon: '🏛️' },
  { value: 'food', label: '美食体验', icon: '🍜' },
  { value: 'shopping', label: '购物休闲', icon: '🛍️' },
  { value: 'adventure', label: '户外探险', icon: '🧗' }
];

// ============ 响应式数据 ============
const loading = ref(false);

// 国家/地区选择
const selectedCountries = ref([]);
const countryInput = ref('');
const selectedCities = ref([]);
const cityInput = ref('');

// 表单数据
const formData = ref({
  days: 5,
  season: 'any',
  transport: 'public',  // 默认公共交通
  preferences: [],
  attractions: ''
});

// ============ 计算属性 ============
// 目的地范围判断
const destinationScope = computed(() => {
  if (selectedCountries.value.length > 1) {
    return 'multiple-countries';
  }
  if (selectedCities.value.length > 0) {
    // 检查是否所有城市都在同一个国家（简化版，实际需要地理数据）
    return 'single-city';
  }
  return 'single-country';
});

// 交通选项（动态）
const transportOptions = computed(() => {
  const isSingleCity = destinationScope.value === 'single-city';
  
  return [
    { 
      value: 'walk', 
      label: '步行优先', 
      icon: '🚶',
      disabled: !isSingleCity  // 只有同城才可选步行
    },
    { 
      value: 'public', 
      label: '公共交通', 
      icon: '🚌',
      disabled: false 
    },
    { 
      value: 'car', 
      label: '自驾/包车', 
      icon: '🚗',
      disabled: false 
    }
  ];
});

// 是否有有效目的地
const hasValidDestination = computed(() => {
  return selectedCountries.value.length > 0;
});

// 目的地总结文本
const destinationSummary = computed(() => {
  const parts = [];
  
  if (selectedCountries.value.length) {
    parts.push(selectedCountries.value.join('、'));
  }
  
  if (selectedCities.value.length) {
    parts.push(selectedCities.value.join('、'));
  }
  
  return parts.join(' - ') || '未选择';
});

// 景点数量
const attractionCount = computed(() => {
  if (!formData.value.attractions) return 0;
  return formData.value.attractions.split(',').filter(s => s.trim()).length;
});

// 选中的交通方式标签
const selectedTransportLabel = computed(() => {
  const option = transportOptions.value.find(opt => opt.value === formData.value.transport);
  return option ? `${option.icon} ${option.label}` : '未选择';
});

// 偏好总结
const preferencesSummary = computed(() => {
  const selected = preferences
    .filter(p => formData.value.preferences.includes(p.value))
    .map(p => p.label);
  
  if (selected.length > 2) {
    return selected.slice(0, 2).join('、') + ` 等${selected.length}项`;
  }
  return selected.join('、');
});

// ============ 方法 ============
// 添加国家
const addCountry = () => {
  const countries = countryInput.value
    .split(/[,，\s]+/)
    .map(s => s.trim())
    .filter(s => s && !selectedCountries.value.includes(s));
  
  if (countries.length) {
    selectedCountries.value.push(...countries);
    countryInput.value = '';
  }
};

const removeCountry = (country) => {
  selectedCountries.value = selectedCountries.value.filter(c => c !== country);
};

// 添加城市
const addCity = () => {
  const cities = cityInput.value
    .split(/[,，\s]+/)
    .map(s => s.trim())
    .filter(s => s && !selectedCities.value.includes(s));
  
  if (cities.length) {
    selectedCities.value.push(...cities);
    cityInput.value = '';
  }
};

const removeCity = (city) => {
  selectedCities.value = selectedCities.value.filter(c => c !== city);
};

// 天数调整
const increaseDays = () => {
  if (formData.value.days < 90) formData.value.days++;
};

const decreaseDays = () => {
  if (formData.value.days > 1) formData.value.days--;
};


const handleSubmit = () => {
  if (!hasValidDestination.value) {
    alert('请至少选择一个国家/地区');
    return;
  }
  
  loading.value = true;
  
  // 构建提交数据（这部分不变）
  const submitData = {
    countries: selectedCountries.value,
    cities: selectedCities.value,
    days: formData.value.days,
    season: formData.value.season,
    transport: formData.value.transport,
    preferences: formData.value.preferences,
    attractions: formData.value.attractions
      .split(',')
      .map(s => s.trim())
      .filter(s => s),
    destinationScope: destinationScope.value
  };
  
  // ⚠️ 修改这里：不再用 setTimeout，直接 emit
  // 让父组件处理 loading 状态
  emit('generate', submitData);
  
  // ⚠️ 注意：loading 状态由父组件控制更合理
  // 这里先简单处理：1.5秒后关闭 loading
  setTimeout(() => {
    loading.value = false;
  }, 1500);
};

// 监听目的地变化，自动调整交通方式
watch(destinationScope, (newScope) => {
  if (newScope !== 'single-city' && formData.value.transport === 'walk') {
    formData.value.transport = 'public';  // 自动切换到公共交通
  }
}, { immediate: true });
</script>

<style scoped>
.trip-form {
  background: white;
  border-radius: 20px;
  padding: 28px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.08);
}

h2 {
  font-size: 24px;
  margin-bottom: 24px;
  color: #1f2937;
  font-weight: 600;
  border-bottom: 2px solid #f3f4f6;
  padding-bottom: 16px;
}

.form-section {
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid #f0f0f0;
}

.form-section h3 {
  font-size: 18px;
  margin-bottom: 16px;
  color: #374151;
  display: flex;
  align-items: center;
  gap: 8px;
}

.required {
  font-size: 12px;
  color: #ef4444;
  font-weight: normal;
  margin-left: 8px;
}

.optional {
  font-size: 12px;
  color: #9ca3af;
  font-weight: normal;
  margin-left: 8px;
}

/* 国家/城市选择器 */
.country-selector, .city-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 12px;
  background: #f9fafb;
  min-height: 50px;
}

.country-tag, .city-tag {
  background: #3b82f6;
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.city-tag {
  background: #10b981;
}

.remove-tag {
  background: none;
  border: none;
  color: white;
  font-size: 18px;
  cursor: pointer;
  padding: 0 4px;
  line-height: 1;
  opacity: 0.8;
}

.remove-tag:hover {
  opacity: 1;
}

.country-input, .city-input {
  border: none;
  background: transparent;
  padding: 4px 8px;
  flex: 1;
  min-width: 150px;
  font-size: 14px;
}

.country-input:focus, .city-input:focus {
  outline: none;
}

/* 目的地类型标签 */
.destination-type {
  margin-top: 8px;
}

.type-badge {
  display: inline-block;
  padding: 6px 16px;
  background: #f3f4f6;
  border-radius: 30px;
  font-size: 13px;
  color: #6b7280;
}

.type-badge.active {
  background: #e0f2fe;
  color: #0369a1;
}

/* 季节选择器 */
.season-selector {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.season-btn {
  padding: 8px 16px;
  border: 1px solid #e5e7eb;
  background: white;
  border-radius: 30px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.season-btn:hover {
  border-color: #3b82f6;
  background: #eff6ff;
}

.season-btn.active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

/* 交通选项 */
.transport-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
}

.transport-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  border: 2px solid #e5e7eb;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.transport-card.active {
  border-color: #3b82f6;
  background: #eff6ff;
}

.transport-card.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #f3f4f6;
}

.transport-icon {
  font-size: 28px;
  margin-bottom: 8px;
}

.transport-label {
  font-size: 14px;
  font-weight: 500;
}

.transport-note {
  font-size: 11px;
  color: #ef4444;
  margin-top: 4px;
}

.hidden-radio {
  display: none;
}

/* 偏好网格 */
.preference-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 10px;
}

.preference-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 14px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  background: #fafafa;
}

.preference-card.active {
  border-color: #3b82f6;
  background: #eff6ff;
  transform: scale(1.02);
}

.pref-icon {
  font-size: 24px;
  margin-bottom: 6px;
}

.pref-label {
  font-size: 13px;
  text-align: center;
}

.hidden-checkbox {
  display: none;
}

/* 景点输入 */
.attraction-input-area textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 12px;
  font-size: 14px;
  resize: vertical;
  background: #f9fafb;
}

.attraction-input-area textarea:focus {
  outline: none;
  border-color: #3b82f6;
  background: white;
}

.attraction-tips {
  margin-top: 8px;
}

.tip {
  font-size: 13px;
  color: #10b981;
  background: #d1fae5;
  padding: 4px 12px;
  border-radius: 20px;
  display: inline-block;
}

/* 表单总结 */
.form-summary {
  background: #f8fafc;
  border-radius: 16px;
  padding: 20px;
  margin: 24px 0;
  border: 1px solid #e2e8f0;
}

.form-summary h4 {
  font-size: 16px;
  margin-bottom: 12px;
  color: #334155;
}

.summary-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.summary-item {
  font-size: 14px;
  display: flex;
  align-items: baseline;
}

.summary-label {
  color: #64748b;
  width: 70px;
  flex-shrink: 0;
}

.summary-value {
  color: #0f172a;
  font-weight: 500;
}

/* 提交按钮 */
.submit-btn {
  width: 100%;
  padding: 16px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 16px;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.submit-btn:hover:not(:disabled) {
  background: #2563eb;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(59,130,246,0.3);
}

.submit-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
  opacity: 0.6;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 3px solid #ffffff;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 提示文字 */
.hint {
  display: block;
  font-size: 12px;
  color: #94a3b8;
  margin-top: 6px;
}

/* 数字输入框 */
.number-input {
  display: flex;
  align-items: center;
  gap: 8px;
}

.number-input input {
  text-align: center;
  width: 80px;
  padding: 10px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 16px;
}

.number-btn {
  width: 40px;
  height: 40px;
  border: 1px solid #d1d5db;
  background: #f3f4f6;
  border-radius: 8px;
  font-size: 20px;
  cursor: pointer;
}

.number-btn:hover {
  background: #e5e7eb;
}
</style>