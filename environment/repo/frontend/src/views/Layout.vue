<template>
  <el-container class="min-h-screen bg-slate-50">
    <!-- Sidebar -->
    <el-aside 
      :width="isCollapsed ? '72px' : '280px'" 
      class="bg-white/80 backdrop-blur-md shadow-[4px_0_30px_rgba(0,0,0,0.02)] border-r border-slate-100/80 transition-all duration-300 ease-in-out flex flex-col h-screen sticky top-0 z-20"
    >
      <!-- Brand Logo -->
      <div class="p-6 border-b border-slate-100/80 flex items-center gap-3.5 overflow-hidden h-[80px]">
        <div class="flex items-center justify-center p-2.5 bg-indigo-600 text-white rounded-2xl min-w-[42px] min-h-[42px] shadow-[0_4px_12px_rgba(99,102,241,0.3)]">
          <FolderOpened class="w-5.5 h-5.5" style="width: 1.4rem; height: 1.4rem;" />
        </div>
        <span v-if="!isCollapsed" class="font-black text-lg bg-gradient-to-r from-slate-900 to-indigo-950 bg-clip-text text-transparent tracking-tight truncate">
          VibeFile Cloud
        </span>
      </div>

      <!-- Main Navigation Menu -->
      <el-menu
        :default-active="activeRoute"
        class="flex-1 mt-6 border-none bg-transparent"
        :collapse="isCollapsed"
        router
      >
        <el-menu-item index="/">
          <el-icon><Odometer /></el-icon>
          <template #title>数据面板</template>
        </el-menu-item>
        
        <el-menu-item index="/files">
          <el-icon><Files /></el-icon>
          <template #title>文件管理</template>
        </el-menu-item>

        <el-menu-item v-if="isAdmin" index="/users">
          <el-icon><User /></el-icon>
          <template #title>账号管理</template>
        </el-menu-item>

        <el-menu-item index="/settings">
          <el-icon><Setting /></el-icon>
          <template #title>系统设置</template>
        </el-menu-item>
      </el-menu>

      <!-- Sidebar footer / toggle -->
      <div class="p-5 border-t border-slate-100 flex flex-col gap-4">
        <div v-if="!isCollapsed" class="flex items-center gap-3 p-2 bg-slate-50 rounded-2xl border border-slate-100">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 text-white font-bold flex items-center justify-center shadow-md">
            {{ userInitials }}
          </div>
          <div class="flex flex-col truncate">
            <span class="text-xs font-bold text-slate-800 truncate">{{ username }}</span>
            <span class="text-[9px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-full uppercase font-black w-max mt-0.5">
              {{ userRole === 'admin' ? '管理员' : '普通用户' }}
            </span>
          </div>
        </div>
        <button 
          @click="isCollapsed = !isCollapsed" 
          class="p-2.5 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-all cursor-pointer flex items-center justify-center border border-slate-50 bg-slate-50/50"
        >
          <el-icon v-if="isCollapsed"><DArrowRight /></el-icon>
          <el-icon v-else><DArrowLeft /></el-icon>
        </button>
      </div>
    </el-aside>

    <el-container class="flex flex-col min-w-0">
      <!-- Header -->
      <el-header class="bg-white/85 backdrop-blur-md border-b border-slate-100/80 px-8 flex items-center justify-between h-[80px] sticky top-0 z-10 shadow-[0_2px_20px_rgba(0,0,0,0.01)]">
        <div class="flex items-center gap-3">
          <span class="w-1.5 h-6 bg-indigo-600 rounded-full"></span>
          <h2 class="text-xl font-black text-slate-800 tracking-tight">{{ pageTitle }}</h2>
        </div>

        <div class="flex items-center gap-6">
          <span class="text-xs text-slate-400 font-medium hidden sm:inline-flex items-center gap-2">
            <span class="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            云端引擎：已连接
          </span>

          <el-divider direction="vertical" class="hidden sm:inline-block !border-slate-200" />

          <!-- User dropdown -->
          <el-dropdown trigger="click">
            <div class="flex items-center gap-2.5 cursor-pointer outline-none hover:opacity-80 transition-all p-1 rounded-xl hover:bg-slate-50">
              <div class="w-10 h-10 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center shadow-[0_4px_12px_rgba(99,102,241,0.2)]">
                {{ userInitials }}
              </div>
              <div class="hidden md:flex flex-col items-start leading-none text-left">
                <span class="text-sm font-bold text-slate-800 leading-tight">{{ username }}</span>
                <span class="text-[10px] text-slate-400 font-medium mt-0.5">{{ userRole === 'admin' ? '系统管理员' : '普通用户' }}</span>
              </div>
              <el-icon class="text-slate-400 ml-1"><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu class="custom-dropdown-menu">
                <el-dropdown-item divided @click="handleLogout" class="text-rose-600 !font-bold">
                  <el-icon class="text-rose-600"><SwitchButton /></el-icon>安全退出
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- Main Body -->
      <el-main class="p-8 max-w-[1600px] w-full mx-auto">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import axios from 'axios'

const router = useRouter()
const route = useRoute()

const isCollapsed = ref(false)
const username = ref('')
const userRole = ref('')

onMounted(() => {
  const token = localStorage.getItem('token')
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
  }

  const userStr = localStorage.getItem('user')
  if (userStr) {
    const user = JSON.parse(userStr)
    username.value = user.username
    userRole.value = user.role
  }
})

const isAdmin = computed(() => userRole.value === 'admin')
const activeRoute = computed(() => route.path)

const userInitials = computed(() => {
  return username.value ? username.value.substring(0, 2).toUpperCase() : 'U'
})

const pageTitle = computed(() => {
  switch (route.path) {
    case '/': return '控制台数据面板'
    case '/files': return '云端文件存储'
    case '/users': return '系统账户管理'
    case '/settings': return '全局系统设置'
    default: return '文件管理系统'
  }
})

const handleLogout = () => {
  ElMessageBox.confirm(
    '确定要退出当前登录的账号吗？',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    delete axios.defaults.headers.common['Authorization']
    ElMessage.success('已安全退出登录')
    router.push('/login')
  }).catch(() => {})
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

.custom-dropdown-menu {
  border-radius: 12px !important;
  border: 1px solid #f1f5f9 !important;
  padding: 6px !important;
  box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05) !important;
}
</style>
