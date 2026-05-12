<template>
  <div class="space-y-8">
    <!-- Top Bar Controls & Drag Area -->
    <div class="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-100/80 shadow-sm flex flex-col gap-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <!-- Search bar -->
        <div class="flex-1 max-w-md">
          <el-input
            v-model="searchQuery"
            placeholder="在云端搜索您的文件..."
            prefix-icon="Search"
            clearable
            class="custom-search-input"
          />
        </div>

        <!-- Action / Upload Buttons -->
        <div class="flex items-center gap-3.5 self-end sm:self-auto">
          <!-- Hidden Native File Input -->
          <input 
            type="file" 
            ref="fileInput" 
            class="hidden" 
            @change="handleFileSelect"
          />
          <el-button 
            type="primary" 
            icon="Upload" 
            class="!rounded-xl shadow-lg hover:shadow-indigo-500/20"
            :loading="uploading"
            @click="triggerFileInput"
          >
            {{ uploading ? '上传中...' : '点击上传' }}
          </el-button>
          <el-button icon="Refresh" circle class="refresh-btn" @click="fetchFiles" />
        </div>
      </div>

      <!-- Drag & Drop Area -->
      <div 
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="handleFileDrop"
        :class="['p-8 border-2 border-dashed rounded-2xl text-center transition-all cursor-pointer flex flex-col items-center justify-center', isDragging ? 'border-indigo-500 bg-indigo-50/50 text-indigo-600 scale-[0.99]' : 'border-slate-200/80 bg-slate-50/50 text-slate-500 hover:border-indigo-300 hover:bg-slate-50']"
        @click="triggerFileInput"
      >
        <div class="p-4 bg-white rounded-2xl shadow-sm border border-slate-100/50 mb-3 text-indigo-500">
          <el-icon class="text-3xl"><UploadFilled /></el-icon>
        </div>
        <p class="text-sm font-bold text-slate-700">拖拽文件到此处，或点击本区域上传</p>
        <p class="text-xs text-slate-400 mt-1.5 font-medium">支持主流安全扩展格式（最大支持单个文件: {{ maxUploadSize }} MB）</p>
      </div>
    </div>

    <!-- Upload Progress Bar -->
    <div v-if="uploading" class="glass-panel p-5 rounded-3xl border border-indigo-100/80 bg-indigo-50/30">
      <div class="flex items-center justify-between mb-2.5">
        <span class="text-sm font-bold text-indigo-700 flex items-center gap-2">
          <el-icon class="animate-spin text-lg"><Loading /></el-icon>
          正在向云端上传: <span class="text-slate-800 font-extrabold">{{ currentUploadingName }}</span>
        </span>
        <span class="text-xs font-black text-indigo-600 bg-indigo-100 px-2.5 py-0.5 rounded-full">{{ uploadProgress }}%</span>
      </div>
      <el-progress :percentage="uploadProgress" :show-text="false" color="linear-gradient(90deg, #6366f1, #4f46e5)" stroke-width="8" />
    </div>

    <!-- Files Listing -->
    <div class="glass-panel p-6 rounded-3xl shadow-sm border border-slate-100/80">
      <div class="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
        <h3 class="font-bold text-slate-800 text-sm tracking-tight">所有存储文件</h3>
        <span class="text-xs text-slate-400 font-semibold">共计 {{ filteredFiles.length }} 个记录</span>
      </div>

      <el-table :data="filteredFiles" v-loading="loading" style="width: 100%" empty-text="云端空空如也，快去上传第一个文件吧">
        <el-table-column prop="filename" label="文件名" min-width="250">
          <template #default="scope">
            <div class="flex items-center gap-3.5">
              <div :class="['w-11 h-11 rounded-xl text-white flex items-center justify-center shadow-md shadow-slate-100/80', getFileIconConfig(scope.row.mimeType).bg]">
                <el-icon class="text-xl"><component :is="getFileIconConfig(scope.row.mimeType).icon" /></el-icon>
              </div>
              <div class="flex flex-col truncate">
                <span class="font-extrabold text-slate-700 truncate text-sm" :title="scope.row.filename">{{ scope.row.filename }}</span>
                <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">{{ getFileCategory(scope.row.mimeType) }}</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="size" label="大小" width="140">
          <template #default="scope">
            <span class="font-bold text-slate-500 text-xs">{{ formatBytes(scope.row.size) }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="uploader" label="上传者" width="160">
          <template #default="scope">
            <span class="text-slate-600 font-semibold text-xs bg-slate-100 px-2.5 py-1 rounded-full">{{ scope.row.uploader }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="createdAt" label="上传时间" width="200">
          <template #default="scope">
            <span class="text-slate-400 font-medium text-xs">{{ formatDate(scope.row.createdAt) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="180" align="right" fixed="right">
          <template #default="scope">
            <div class="flex items-center justify-end gap-2.5">
              <el-button type="primary" size="small" link class="!font-bold !text-xs" @click="handleDownload(scope.row)">
                下载
              </el-button>
              <el-button type="danger" size="small" link class="!font-bold !text-xs !text-rose-600 hover:!text-rose-700" @click="handleDelete(scope.row)">
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import axios from 'axios'

const files = ref([])
const loading = ref(true)
const uploading = ref(false)
const isDragging = ref(false)
const searchQuery = ref('')
const fileInput = ref(null)
const uploadProgress = ref(0)
const currentUploadingName = ref('')
const maxUploadSize = ref(100)

const fetchFiles = async () => {
  loading.value = true
  try {
    const response = await axios.get('/api/files')
    files.value = response.data
  } catch (err) {
    console.error(err)
    ElMessage.error('获取文件列表失败')
  } finally {
    loading.value = false
  }
}

const fetchSettings = async () => {
  try {
    const response = await axios.get('/api/settings')
    if (response.data?.maxFileSize) {
      maxUploadSize.value = parseInt(response.data.maxFileSize)
    }
  } catch (err) {
    console.error('Failed to get settings:', err)
  }
}

onMounted(() => {
  fetchFiles()
  fetchSettings()
})

const filteredFiles = computed(() => {
  if (!searchQuery.value) return files.value
  const q = searchQuery.value.toLowerCase()
  return files.value.filter(f => f.filename.toLowerCase().includes(q))
})

const triggerFileInput = () => {
  if (fileInput.value) fileInput.value.click()
}

const handleFileSelect = (e) => {
  const selected = e.target.files[0]
  if (selected) {
    uploadSelectedFile(selected)
  }
}

const handleFileDrop = (e) => {
  isDragging.value = false
  const selected = e.dataTransfer.files[0]
  if (selected) {
    uploadSelectedFile(selected)
  }
}

const uploadSelectedFile = async (file) => {
  const maxBytes = maxUploadSize.value * 1024 * 1024
  if (file.size > maxBytes) {
    ElMessage.error(`文件大小超过系统限制 ${maxUploadSize.value}MB`)
    return
  }

  const formData = new FormData()
  formData.append('file', file)

  uploading.value = true
  uploadProgress.value = 0
  currentUploadingName.value = file.name

  try {
    await axios.post('/api/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        uploadProgress.value = percentCompleted
      }
    })

    ElMessage.success('文件上传成功！')
    fetchFiles()
  } catch (err) {
    console.error(err)
    const errMsg = err.response?.data?.error || '文件上传失败'
    ElMessage.error(errMsg)
  } finally {
    uploading.value = false
    uploadProgress.value = 0
    currentUploadingName.value = ''
    if (fileInput.value) fileInput.value.value = ''
  }
}

const handleDownload = async (row) => {
  try {
    const response = await axios.get(`/api/files/download/${row.id}`, {
      responseType: 'blob'
    })
    
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', row.filename)
    document.body.appendChild(link)
    link.click()
    
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (err) {
    console.error('Download error:', err)
    ElMessage.error('下载文件失败')
  }
}

const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确定要永久删除文件 "${row.filename}" 吗？`,
    '提示',
    {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(async () => {
    try {
      await axios.delete(`/api/files/${row.id}`)
      ElMessage.success('文件删除成功')
      fetchFiles()
    } catch (err) {
      console.error(err)
      const errMsg = err.response?.data?.error || '删除文件失败'
      ElMessage.error(errMsg)
    }
  }).catch(() => {})
}

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatDate = (isoString) => {
  const d = new Date(isoString)
  return d.toLocaleString('zh-CN')
}

const getFileCategory = (mimeType) => {
  if (!mimeType) return '未知'
  const mime = mimeType.toLowerCase()
  if (mime.startsWith('image/')) return '图片文件'
  if (mime.includes('pdf')) return 'PDF 文档'
  if (mime.includes('word') || mime.includes('officedocument') || mime.includes('text')) return '办公文档'
  if (mime.includes('zip') || mime.includes('rar') || mime.includes('7z')) return '压缩归档'
  if (mime.startsWith('video/')) return '视频媒体'
  if (mime.startsWith('audio/')) return '音频媒体'
  return '其他文件'
}

const getFileIconConfig = (mimeType) => {
  if (!mimeType) return { icon: 'Document', bg: 'bg-slate-400' }
  const mime = mimeType.toLowerCase()
  if (mime.startsWith('image/')) return { icon: 'Picture', bg: 'bg-amber-500' }
  if (mime.includes('pdf')) return { icon: 'Document', bg: 'bg-rose-500' }
  if (mime.includes('zip') || mime.includes('rar') || mime.includes('tar') || mime.includes('7z')) return { icon: 'FolderOpened', bg: 'bg-purple-500' }
  if (mime.startsWith('video/') || mime.startsWith('audio/')) return { icon: 'VideoPlay', bg: 'bg-pink-500' }
  return { icon: 'Document', bg: 'bg-indigo-500' }
}
</script>

<style scoped>
.custom-search-input :deep(.el-input__wrapper) {
  padding-left: 14px !important;
  border-radius: 14px !important;
}
.refresh-btn {
  background-color: #f1f5f9 !important;
  border: 1px solid #e2e8f0 !important;
  color: #64748b !important;
  font-weight: normal !important;
}
.refresh-btn:hover {
  background-color: #e2e8f0 !important;
  color: #0f172a !important;
}
</style>
