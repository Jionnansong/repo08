<template>
  <div class="space-y-8">
    <div class="glass-panel p-6 rounded-3xl shadow-sm border border-slate-100/80">
      <div class="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
        <div>
          <h3 class="font-bold text-slate-800 text-sm tracking-tight">系统账户管理</h3>
          <p class="text-xs text-slate-400 font-medium mt-1">管理员专属功能，支持账户密码重置与角色控制</p>
        </div>
        <el-button type="primary" icon="Plus" class="!rounded-xl shadow-lg shadow-indigo-600/10" @click="openAddDialog">
          新增账户
        </el-button>
      </div>

      <!-- Users Table -->
      <el-table :data="users" v-loading="loading" style="width: 100%" empty-text="当前系统无其他用户账号">
        <el-table-column prop="username" label="用户名" min-width="150">
          <template #default="scope">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-100 to-slate-200 text-slate-700 font-bold flex items-center justify-center shadow-inner">
                {{ scope.row.username.substring(0, 2).toUpperCase() }}
              </div>
              <span class="font-extrabold text-slate-700 text-sm">{{ scope.row.username }}</span>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="role" label="系统角色" width="160">
          <template #default="scope">
            <span 
              :class="['text-[10px] font-black px-2.5 py-1 rounded-full uppercase w-max inline-block tracking-wider', 
                scope.row.role === 'admin' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-slate-100 text-slate-600 border border-slate-200/50'
              ]"
            >
              {{ scope.row.role === 'admin' ? '系统管理员' : '普通用户' }}
            </span>
          </template>
        </el-table-column>

        <el-table-column prop="_count.files" label="已用上传量" width="140" align="center">
          <template #default="scope">
            <span class="font-bold text-slate-500 text-xs bg-indigo-50/50 text-indigo-600 border border-indigo-100/50 px-2 py-0.5 rounded-md">
              {{ scope.row._count?.files || 0 }} 个文件
            </span>
          </template>
        </el-table-column>

        <el-table-column prop="createdAt" label="注册时间" width="200">
          <template #default="scope">
            <span class="text-slate-400 font-medium text-xs">{{ formatDate(scope.row.createdAt) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="180" align="right" fixed="right">
          <template #default="scope">
            <div class="flex items-center justify-end gap-2.5">
              <el-button type="primary" size="small" link class="!font-bold !text-xs" @click="openEditDialog(scope.row)">
                编辑
              </el-button>
              <el-button 
                type="danger" 
                size="small" 
                link 
                class="!font-bold !text-xs !text-rose-600 hover:!text-rose-700"
                :disabled="scope.row.id === currentUserId"
                @click="handleDelete(scope.row)"
              >
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- User Add/Edit Dialog -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="isEditMode ? '修改账号信息' : '创建新账号'" 
      width="440px"
      class="custom-modern-dialog"
      align-center
    >
      <el-form :model="userForm" :rules="userRules" ref="userFormRef" label-position="top">
        <el-form-item label="用户名" prop="username" class="dialog-form-item">
          <template #label>
            <span class="text-slate-600 font-bold text-xs">用户名</span>
          </template>
          <el-input 
            v-model="userForm.username" 
            placeholder="请输入用户名" 
            :disabled="isEditMode"
            prefix-icon="User"
            size="large"
          />
        </el-form-item>
        
        <el-form-item :label="isEditMode ? '新密码 (留空则不修改)' : '登录密码'" prop="password" class="dialog-form-item">
          <template #label>
            <span class="text-slate-600 font-bold text-xs">{{ isEditMode ? '新密码 (留空则不修改)' : '登录密码' }}</span>
          </template>
          <el-input 
            v-model="userForm.password" 
            type="password" 
            placeholder="请输入密码" 
            show-password
            prefix-icon="Lock"
            size="large"
          />
        </el-form-item>

        <el-form-item label="系统角色" prop="role" class="dialog-form-item">
          <template #label>
            <span class="text-slate-600 font-bold text-xs">系统角色</span>
          </template>
          <el-radio-group v-model="userForm.role" class="custom-radio-group">
            <el-radio-button label="user">普通用户</el-radio-button>
            <el-radio-button label="admin">管理员</el-radio-button>
          </el-radio-group>
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="flex items-center justify-end gap-3 pt-3">
          <el-button class="cancel-dialog-btn" @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" class="!rounded-xl shadow-lg shadow-indigo-600/10" :loading="submitLoading" @click="submitUserForm">确定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import axios from 'axios'

const users = ref([])
const loading = ref(true)
const dialogVisible = ref(false)
const isEditMode = ref(false)
const submitLoading = ref(false)
const userFormRef = ref(null)

const currentUserId = computed(() => {
  const userStr = localStorage.getItem('user')
  return userStr ? JSON.parse(userStr).id : null
})

const userForm = reactive({
  id: null,
  username: '',
  password: '',
  role: 'user'
})

const userRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, message: '用户名长度至少为 3 位', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少为 6 位', trigger: 'blur' }
  ]
}

const fetchUsers = async () => {
  loading.value = true
  try {
    const response = await axios.get('/api/users')
    users.value = response.data
  } catch (err) {
    console.error(err)
    ElMessage.error('获取用户列表失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchUsers()
})

const openAddDialog = () => {
  isEditMode.value = false
  userForm.id = null
  userForm.username = ''
  userForm.password = ''
  userForm.role = 'user'
  
  userRules.password[0].required = true

  dialogVisible.value = true
  if (userFormRef.value) userFormRef.value.clearValidate()
}

const openEditDialog = (row) => {
  isEditMode.value = true
  userForm.id = row.id
  userForm.username = row.username
  userForm.password = ''
  userForm.role = row.role

  userRules.password[0].required = false

  dialogVisible.value = true
  if (userFormRef.value) userFormRef.value.clearValidate()
}

const submitUserForm = async () => {
  if (!userFormRef.value) return
  await userFormRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true
      try {
        if (isEditMode.value) {
          const payload = { role: userForm.role }
          if (userForm.password) {
            payload.password = userForm.password
          }
          await axios.put(`/api/users/${userForm.id}`, payload)
          ElMessage.success('用户更新成功')
        } else {
          await axios.post('/api/users', userForm)
          ElMessage.success('用户创建成功')
        }
        dialogVisible.value = false
        fetchUsers()
      } catch (err) {
        console.error(err)
        const errMsg = err.response?.data?.error || '操作失败'
        ElMessage.error(errMsg)
      } finally {
        submitLoading.value = false
      }
    }
  })
}

const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确定要永久删除用户 "${row.username}" 及其所有关联文件吗？`,
    '高危警告',
    {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'error',
    }
  ).then(async () => {
    try {
      await axios.delete(`/api/users/${row.id}`)
      ElMessage.success('用户已成功删除')
      fetchUsers()
    } catch (err) {
      console.error(err)
      const errMsg = err.response?.data?.error || '删除失败'
      ElMessage.error(errMsg)
    }
  }).catch(() => {})
}

const formatDate = (isoString) => {
  const d = new Date(isoString)
  return d.toLocaleString('zh-CN')
}
</script>

<style>
.custom-modern-dialog {
  border-radius: 24px !important;
  border: 1px solid rgba(241, 245, 249, 0.8) !important;
  box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.08) !important;
  padding: 30px !important;
}

.custom-modern-dialog .el-dialog__header {
  padding-bottom: 12px !important;
  border-bottom: 1px solid #f1f5f9 !important;
  margin-bottom: 20px !important;
}

.custom-modern-dialog .el-dialog__title {
  font-weight: 800 !important;
  color: #0f172a !important;
  font-size: 1.15rem !important;
}

.dialog-form-item {
  margin-bottom: 20px !important;
}

.custom-radio-group .el-radio-button__inner {
  border-radius: 12px !important;
  padding: 10px 20px !important;
  font-weight: 600 !important;
}

.cancel-dialog-btn {
  background-color: #f1f5f9 !important;
  border: 1px solid #e2e8f0 !important;
  color: #64748b !important;
}

.cancel-dialog-btn:hover {
  background-color: #e2e8f0 !important;
  color: #0f172a !important;
}
</style>
