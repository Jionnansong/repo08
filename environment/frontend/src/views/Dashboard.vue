<template>
  <div class="space-y-8">
    <!-- Skeleton/Loading view -->
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div v-for="i in 3" :key="i" class="h-32 bg-slate-200/50 rounded-3xl animate-pulse"></div>
    </div>

    <!-- Cards Stats Container -->
    <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <!-- Stat Card 1 -->
      <div class="glass-card-interactive p-6 rounded-3xl flex items-center justify-between relative overflow-hidden group">
        <div class="absolute inset-0 bg-gradient-to-tr from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div>
          <p class="text-xs font-black text-slate-400 uppercase tracking-widest">文件总量</p>
          <h3 class="text-4xl font-black text-slate-800 tracking-tight mt-2.5">
            {{ stats.totalFiles }} <span class="text-sm font-bold text-slate-400">个</span>
          </h3>
          <span class="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded-full mt-2 inline-block">系统存储统计</span>
        </div>
        <div class="p-4 bg-blue-50 text-blue-500 rounded-2xl group-hover:bg-blue-500 group-hover:text-white transition-all duration-300 shadow-sm">
          <Document class="w-6 h-6" style="width: 1.6rem; height: 1.6rem;" />
        </div>
      </div>

      <!-- Stat Card 2 -->
      <div class="glass-card-interactive p-6 rounded-3xl flex items-center justify-between relative overflow-hidden group">
        <div class="absolute inset-0 bg-gradient-to-tr from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div>
          <p class="text-xs font-black text-slate-400 uppercase tracking-widest">存储空间</p>
          <h3 class="text-4xl font-black text-slate-800 tracking-tight mt-2.5">
            {{ formattedStorage.value }} <span class="text-sm font-bold text-slate-400">{{ formattedStorage.unit }}</span>
          </h3>
          <span class="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-1 rounded-full mt-2 inline-block">已用磁盘大小</span>
        </div>
        <div class="p-4 bg-indigo-50 text-indigo-500 rounded-2xl group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300 shadow-sm">
          <Cpu class="w-6 h-6" style="width: 1.6rem; height: 1.6rem;" />
        </div>
      </div>

      <!-- Stat Card 3 -->
      <div class="glass-card-interactive p-6 rounded-3xl flex items-center justify-between relative overflow-hidden group">
        <div class="absolute inset-0 bg-gradient-to-tr from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div>
          <p class="text-xs font-black text-slate-400 uppercase tracking-widest">用户总量</p>
          <h3 class="text-4xl font-black text-slate-800 tracking-tight mt-2.5">
            {{ stats.totalUsers }} <span class="text-sm font-bold text-slate-400">人</span>
          </h3>
          <span class="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded-full mt-2 inline-block">已授权系统用户</span>
        </div>
        <div class="p-4 bg-emerald-50 text-emerald-500 rounded-2xl group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300 shadow-sm">
          <User class="w-6 h-6" style="width: 1.6rem; height: 1.6rem;" />
        </div>
      </div>
    </div>

    <!-- Analytics Section -->
    <div v-if="!loading" class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- File Types Breakdown -->
      <div class="glass-panel p-6 rounded-3xl lg:col-span-1 shadow-sm border border-slate-100/80">
        <div class="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <h3 class="font-bold text-slate-800 text-sm tracking-tight">文件类型占比</h3>
          <span class="text-[10px] uppercase font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">类别分布</span>
        </div>
        <div class="space-y-5 py-2">
          <div v-for="type in stats.typeDistribution" :key="type.name" class="p-3.5 bg-slate-50/50 rounded-2xl border border-slate-100/50 hover:bg-slate-50 transition-all">
            <div class="flex justify-between items-center text-xs mb-2">
              <span class="font-bold text-slate-600 flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full" :style="{ backgroundColor: getTypeColor(type.name) }"></span>
                {{ type.name }}
              </span>
              <span class="text-slate-800 font-black">{{ type.value }} 个 ({{ getTypePercentage(type.value) }}%)</span>
            </div>
            <el-progress 
              :percentage="parseFloat(getTypePercentage(type.value))" 
              :color="getTypeColor(type.name)"
              :show-text="false"
              stroke-width="6"
              class="custom-progress"
            />
          </div>
        </div>
      </div>

      <!-- Storage Statistics & Upload Trends -->
      <div class="glass-panel p-6 rounded-3xl lg:col-span-2 shadow-sm border border-slate-100/80">
        <div class="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <h3 class="font-bold text-slate-800 text-sm tracking-tight">近 7 天上传活跃度</h3>
          <span class="text-xs text-slate-400 font-medium">每日上传数量统计</span>
        </div>
        <!-- Simple, Elegant CSS Bar Chart representation -->
        <div class="h-68 flex items-end justify-between px-4 pt-8 pb-4 relative bg-slate-50/50 rounded-2xl border border-slate-100/50">
          <div v-for="day in stats.trend" :key="day.date" class="flex flex-col items-center flex-1 group relative z-10">
            <!-- Tooltip -->
            <span class="opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100 bg-slate-900 text-white text-[10px] font-bold rounded-lg px-2.5 py-1.5 mb-2.5 transition-all duration-200 shadow-xl absolute transform -translate-y-12 z-20">
              {{ day.uploads }} 个文件
            </span>
            <!-- Bar -->
            <div 
              class="w-10 bg-gradient-to-t from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 rounded-t-xl transition-all duration-300 ease-out cursor-pointer shadow-[0_4px_12px_rgba(99,102,241,0.15)] hover:shadow-[0_8px_20px_rgba(99,102,241,0.3)]" 
              :style="{ height: getTrendHeight(day.uploads) }"
            ></div>
            <!-- X Axis Label -->
            <span class="text-[11px] text-slate-400 mt-3 font-bold">{{ day.date }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Uploads Table -->
    <div v-if="!loading" class="glass-panel p-6 rounded-3xl shadow-sm border border-slate-100/80">
      <div class="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
        <h3 class="font-bold text-slate-800 text-sm tracking-tight">最近上传文件</h3>
        <el-button type="primary" size="small" link @click="router.push('/files')">
          查看全部 <el-icon class="el-icon--right"><ArrowRight /></el-icon>
        </el-button>
      </div>

      <el-table :data="stats.recentUploads" style="width: 100%" empty-text="暂无近期文件上传记录">
        <el-table-column prop="filename" label="文件名" min-width="180">
          <template #default="scope">
            <div class="flex items-center gap-3">
              <div class="p-2 bg-indigo-50 text-indigo-500 rounded-lg">
                <Document class="w-4 h-4" />
              </div>
              <span class="font-bold text-slate-700 truncate text-sm">{{ scope.row.filename }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="uploader" label="上传者" width="140">
          <template #default="scope">
            <span class="text-slate-600 font-semibold text-xs bg-slate-100 px-2.5 py-1 rounded-full">{{ scope.row.uploader }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="size" label="大小" width="140">
          <template #default="scope">
            <span class="text-slate-500 font-bold text-xs">{{ formatBytes(scope.row.size) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="上传时间" width="200">
          <template #default="scope">
            <span class="text-slate-400 font-medium text-xs">{{ formatDate(scope.row.createdAt) }}</span>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import axios from 'axios'

const router = useRouter()
const loading = ref(true)

const stats = ref({
  totalFiles: 0,
  totalUsers: 0,
  totalStorage: 0,
  typeDistribution: [],
  recentUploads: [],
  trend: []
})

const fetchDashboardStats = async () => {
  try {
    const response = await axios.get('/api/dashboard/stats')
    stats.value = response.data
  } catch (err) {
    console.error(err)
    ElMessage.error('无法加载仪表盘统计信息')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchDashboardStats()
})

const formattedStorage = computed(() => {
  const bytes = stats.value.totalStorage
  if (bytes === 0) return { value: '0', unit: 'B' }
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return {
    value: parseFloat((bytes / Math.pow(k, i)).toFixed(2)),
    unit: sizes[i]
  }
})

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatDate = (isoString) => {
  const date = new Date(isoString)
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getTypePercentage = (val) => {
  if (stats.value.totalFiles === 0) return '0.0'
  return ((val / stats.value.totalFiles) * 100).toFixed(1)
}

const getTypeColor = (name) => {
  switch (name) {
    case 'Image': return '#f59e0b'
    case 'Document': return '#3b82f6'
    case 'Archive': return '#8b5cf6'
    case 'Media': return '#ec4899'
    default: return '#64748b'
  }
}

const getTrendHeight = (uploads) => {
  if (uploads === 0) return '8px'
  const maxUploads = Math.max(...stats.value.trend.map(d => d.uploads), 1)
  const percentage = (uploads / maxUploads) * 90 // Max height is 90%
  return `${Math.max(percentage, 12)}%`
}
</script>

<style scoped>
.custom-progress :deep(.el-progress-bar__outer) {
  background-color: #f1f5f9 !important;
}
</style>
