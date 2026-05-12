<template>
  <div class="login-container min-h-screen relative flex items-center justify-center overflow-hidden bg-slate-900 p-4">
    <!-- Fluid background gradients -->
    <div class="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,#312e81_0%,transparent_40%),radial-gradient(circle_at_70%_60%,#1e1b4b_0%,transparent_50%)]"></div>
    
    <!-- Floating color blobs -->
    <div class="absolute top-1/4 left-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px] animate-[float_8s_ease-in-out_infinite]"></div>
    <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] animate-[float_11s_ease-in-out_infinite_1s]"></div>

    <!-- Core Glassmorphism Card -->
    <div class="glass-panel w-full max-w-md p-8 sm:p-10 rounded-3xl shadow-[0_30px_100px_rgba(0,0,0,0.5)] border border-slate-700/50 bg-slate-950/40 backdrop-blur-3xl transform transition-all duration-300 hover:scale-[1.01] relative z-10">
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center p-4 bg-gradient-to-tr from-indigo-500 to-indigo-600 text-white rounded-2xl mb-4 shadow-[0_8px_20px_rgba(99,102,241,0.3)]">
          <FolderOpened class="w-8 h-8" style="width: 2rem; height: 2rem;" />
        </div>
        <h1 class="text-3xl font-extrabold text-white tracking-tight bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent">VibeFile Cloud</h1>
        <p class="text-slate-400 mt-2 text-sm font-medium">极简、美观、安全的文件管理系统</p>
      </div>

      <!-- Switch Tabs -->
      <div class="flex bg-slate-900/60 p-1.5 rounded-2xl mb-8 border border-slate-800">
        <button 
          @click="isLoginMode = true" 
          :class="['flex-1 py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-300 cursor-pointer', isLoginMode ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:text-slate-200']"
        >
          立即登录
        </button>
        <button 
          @click="isLoginMode = false" 
          :class="['flex-1 py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-300 cursor-pointer', !isLoginMode ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:text-slate-200']"
        >
          免费注册
        </button>
      </div>

      <!-- Login Form -->
      <el-form 
        v-if="isLoginMode" 
        :model="loginForm" 
        :rules="loginRules" 
        ref="loginFormRef" 
        label-position="top"
        @keyup.enter="handleLogin"
        class="dark-form"
      >
        <el-form-item label="用户名" prop="username">
          <template #label>
            <span class="text-slate-300 font-semibold text-xs sm:text-sm">用户名</span>
          </template>
          <el-input 
            v-model="loginForm.username" 
            placeholder="请输入用户名" 
            prefix-icon="User"
            size="large"
            class="custom-dark-input"
          />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <template #label>
            <span class="text-slate-300 font-semibold text-xs sm:text-sm">密码</span>
          </template>
          <el-input 
            v-model="loginForm.password" 
            type="password" 
            placeholder="请输入密码" 
            prefix-icon="Lock" 
            show-password
            size="large"
            class="custom-dark-input"
          />
        </el-form-item>
        <div class="mt-8">
          <el-button 
            type="primary" 
            class="w-full !rounded-xl !h-12 !font-bold tracking-wider" 
            size="large" 
            :loading="loading" 
            @click="handleLogin"
          >
            登 录
          </el-button>
        </div>
      </el-form>

      <!-- Register Form -->
      <el-form 
        v-else 
        :model="registerForm" 
        :rules="registerRules" 
        ref="registerFormRef" 
        label-position="top"
        @keyup.enter="handleRegister"
        class="dark-form"
      >
        <el-form-item label="创建用户名" prop="username">
          <template #label>
            <span class="text-slate-300 font-semibold text-xs sm:text-sm">创建用户名</span>
          </template>
          <el-input 
            v-model="registerForm.username" 
            placeholder="仅限字母或数字" 
            prefix-icon="User"
            size="large"
            class="custom-dark-input"
          />
        </el-form-item>
        <el-form-item label="创建密码" prop="password">
          <template #label>
            <span class="text-slate-300 font-semibold text-xs sm:text-sm">创建密码</span>
          </template>
          <el-input 
            v-model="registerForm.password" 
            type="password" 
            placeholder="至少 6 位字符" 
            prefix-icon="Lock" 
            show-password
            size="large"
            class="custom-dark-input"
          />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <template #label>
            <span class="text-slate-300 font-semibold text-xs sm:text-sm">确认密码</span>
          </template>
          <el-input 
            v-model="registerForm.confirmPassword" 
            type="password" 
            placeholder="请再次输入密码" 
            prefix-icon="CircleCheck" 
            show-password
            size="large"
            class="custom-dark-input"
          />
        </el-form-item>
        <div class="mt-8">
          <el-button 
            type="success" 
            class="w-full !rounded-xl !h-12 !font-bold tracking-wider" 
            size="large" 
            :loading="loading" 
            @click="handleRegister"
          >
            注 册
          </el-button>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import axios from 'axios'

const router = useRouter()
const isLoginMode = ref(true)
const loading = ref(false)

const loginFormRef = ref(null)
const registerFormRef = ref(null)

// Forms State
const loginForm = reactive({
  username: '',
  password: ''
})

const registerForm = reactive({
  username: '',
  password: '',
  confirmPassword: ''
})

// Validation Rules
const loginRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const validateConfirmPassword = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请再次输入密码'))
  } else if (value !== registerForm.password) {
    callback(new Error('两次输入密码不一致!'))
  } else {
    callback()
  }
}

const registerRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码不能少于 6 位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  if (!loginFormRef.value) return
  await loginFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        const response = await axios.post('/api/auth/login', loginForm)
        const { token, user } = response.data
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))
        
        ElMessage({
          message: `欢迎回来，${user.username}！`,
          type: 'success'
        })
        router.push('/')
      } catch (err) {
        console.error(err)
        const errMsg = err.response?.data?.error || '登录失败，请检查网络或账号密码'
        ElMessage.error(errMsg)
      } finally {
        loading.value = false
      }
    }
  })
}

const handleRegister = async () => {
  if (!registerFormRef.value) return
  await registerFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        const response = await axios.post('/api/auth/register', {
          username: registerForm.username,
          password: registerForm.password
        })
        const { token, user } = response.data
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))
        
        ElMessage({
          message: '注册成功，已自动登录！',
          type: 'success'
        })
        router.push('/')
      } catch (err) {
        console.error(err)
        const errMsg = err.response?.data?.error || '注册失败'
        ElMessage.error(errMsg)
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<style>
/* Custom Dark Theme Styles for Form Inputs inside Glass Panel */
.dark-form .el-form-item__label {
  margin-bottom: 6px !important;
}

.custom-dark-input .el-input__wrapper {
  background-color: rgba(15, 23, 42, 0.6) !important;
  border: 1px solid rgba(51, 65, 85, 0.5) !important;
  box-shadow: none !important;
  transition: all 0.3s ease !important;
}

.custom-dark-input .el-input__wrapper.is-focus,
.custom-dark-input .el-input__wrapper:hover {
  background-color: rgba(15, 23, 42, 0.9) !important;
  border-color: rgba(99, 102, 241, 0.6) !important;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2) !important;
}

.custom-dark-input .el-input__inner {
  color: #f8fafc !important;
}

.custom-dark-input .el-input__inner::placeholder {
  color: #64748b !important;
}

.custom-dark-input .el-input__icon {
  color: #64748b !important;
}
</style>
