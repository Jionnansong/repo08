<template>
  <div class="space-y-8 max-w-4xl">
    <div class="glass-panel p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100/80">
      <div class="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
        <div>
          <h3 class="font-bold text-slate-800 text-sm tracking-tight">系统运行设置</h3>
          <p class="text-xs text-slate-400 font-medium mt-1">全局核心配置，包括最大文件限制、文件格式白名单等约束</p>
        </div>
        <span 
          :class="['text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider', 
            isAdmin ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
          ]"
        >
          {{ isAdmin ? '系统超级管理员' : '只读模式' }}
        </span>
      </div>

      <el-form :model="settingsForm" label-position="top" v-loading="loading" class="custom-form">
        <el-form-item label="系统名称 (System Name)" class="form-item">
          <template #label>
            <span class="text-slate-600 font-bold text-xs sm:text-sm">系统名称 (System Name)</span>
          </template>
          <el-input 
            v-model="settingsForm.systemName" 
            placeholder="例如: VibeFile Cloud" 
            :disabled="!isAdmin"
            prefix-icon="Monitor"
            size="large"
          />
        </el-form-item>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <el-form-item label="单文件上传限制 (Max File Size)" class="form-item">
            <template #label>
              <span class="text-slate-600 font-bold text-xs sm:text-sm">单文件上传限制 (Max File Size)</span>
            </template>
            <el-input-number 
              v-model="settingsForm.maxFileSize" 
              :min="1" 
              :max="10240"
              :disabled="!isAdmin"
              class="!w-full custom-input-number"
              size="large"
            />
            <p class="text-[11px] text-slate-400 mt-2 font-medium">配置允许上传的最大文件尺寸上限（最高可设置 10 GB）</p>
          </el-form-item>

          <el-form-item label="新用户自助注册 (Registration Enabled)" class="form-item">
            <template #label>
              <span class="text-slate-600 font-bold text-xs sm:text-sm">新用户自助注册 (Registration Enabled)</span>
            </template>
            <div class="h-[40px] flex items-center">
              <el-switch 
                v-model="settingsForm.registrationEnabled" 
                active-text="允许注册"
                inactive-text="禁止注册"
                :disabled="!isAdmin"
                class="custom-switch"
              />
            </div>
            <p class="text-[11px] text-slate-400 mt-2 font-medium">关闭后，只能由管理员在账号管理页面创建新账户</p>
          </el-form-item>
        </div>

        <el-form-item label="允许上传的文件后缀名 (Allowed File Extensions)" class="form-item">
          <template #label>
            <span class="text-slate-600 font-bold text-xs sm:text-sm">允许上传的文件后缀名 (Allowed File Extensions)</span>
          </template>
          <el-input 
            v-model="settingsForm.allowedExtensions" 
            placeholder="以英文逗号分隔，例如: .jpg,.png,.pdf" 
            :disabled="!isAdmin"
            type="textarea"
            :rows="3"
            class="custom-textarea"
          />
          <p class="text-[11px] text-slate-400 mt-2 font-medium">请注意包含前缀点(.)，并以半角逗号分隔。例：.jpg,.png,.zip,.pdf,.docx</p>
        </el-form-item>

        <div v-if="isAdmin" class="mt-8 pt-6 border-t border-slate-100 flex justify-end">
          <el-button 
            type="primary" 
            size="large" 
            icon="Check"
            class="!rounded-xl px-7 shadow-lg shadow-indigo-600/10"
            :loading="saveLoading" 
            @click="handleSave"
          >
            保存配置
          </el-button>
        </div>
      </el-form>
    </div>

    <!-- Info info card -->
    <div class="glass-panel p-6 rounded-3xl bg-gradient-to-tr from-indigo-50/50 via-slate-50 to-purple-50/30 border border-slate-100/80 flex items-start gap-4">
      <div class="p-3 bg-white text-indigo-500 rounded-2xl shadow-sm border border-slate-100/50">
        <InfoFilled class="w-6 h-6" style="width: 1.5rem; height: 1.5rem;" />
      </div>
      <div>
        <h4 class="font-extrabold text-slate-800 text-sm">关于 VibeFile Cloud 技术栈</h4>
        <p class="text-slate-500 text-xs mt-1.5 leading-relaxed font-medium">
          本系统由高标准全栈容器架构驱动，前端基于 Vue 3 + Vite 搭建，通过 Axios 与 Node.js + Express API 链路互通。
          系统设置参数存储于 SQLite 单体数据库中，并与上传端点及鉴权验证层形成实时联动，兼备极致性能与优雅美学。
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'

const loading = ref(true)
const saveLoading = ref(false)
const userRole = ref('')

const settingsForm = ref({
  systemName: '',
  maxFileSize: 100,
  registrationEnabled: true,
  allowedExtensions: ''
})

const isAdmin = computed(() => userRole.value === 'admin')

const fetchSettings = async () => {
  loading.value = true
  try {
    const response = await axios.get('/api/settings')
    const data = response.data
    
    settingsForm.value = {
      systemName: data.systemName || 'VibeFile Cloud',
      maxFileSize: parseInt(data.maxFileSize) || 100,
      registrationEnabled: data.registrationEnabled === 'true',
      allowedExtensions: data.allowedExtensions || ''
    }
  } catch (err) {
    console.error(err)
    ElMessage.error('获取系统设置失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  const userStr = localStorage.getItem('user')
  if (userStr) {
    userRole.value = JSON.parse(userStr).role
  }
  fetchSettings()
})

const handleSave = async () => {
  saveLoading.value = true
  try {
    const payload = {
      systemName: settingsForm.value.systemName,
      maxFileSize: settingsForm.value.maxFileSize,
      registrationEnabled: settingsForm.value.registrationEnabled ? 'true' : 'false',
      allowedExtensions: settingsForm.value.allowedExtensions
    }
    
    const response = await axios.put('/api/settings', payload)
    ElMessage.success(response.data.message || '系统设置更新成功')
    
    if (payload.systemName) {
      document.title = payload.systemName
    }
  } catch (err) {
    console.error(err)
    const errMsg = err.response?.data?.error || '更新配置失败'
    ElMessage.error(errMsg)
  } finally {
    saveLoading.value = false
  }
}
</script>

<style scoped>
.form-item {
  margin-bottom: 24px !important;
}
.custom-textarea :deep(.el-textarea__inner) {
  border-radius: 14px !important;
  background-color: #f8fafc !important;
  box-shadow: 0 0 0 1px #e2e8f0 inset !important;
  padding: 12px !important;
  transition: all 0.2s ease !important;
}
.custom-textarea :deep(.el-textarea__inner:focus) {
  box-shadow: 0 0 0 1px #6366f1 inset, 0 0 0 3px rgba(99, 102, 241, 0.1) !important;
  background-color: #ffffff !important;
}
.custom-input-number :deep(.el-input__wrapper) {
  background-color: #f8fafc !important;
}
</style>
