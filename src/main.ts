import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import {
  // create naive ui
  create,
  // component
  NButton,
  NCard,
  NDataTable,
  NInput,
  NLayout,
  NLayoutHeader,
  NLayoutSider,
  NLayoutContent,
  NMenu,
  NModal,
  NPagination,
  NDropdown,
  NPopconfirm,
  NMessageProvider,
  NLoadingBarProvider,
  NDialogProvider,
  NConfigProvider,
  NSpace,
  NIcon,
  NTag,
  NEmpty,
  NSpin,
  NGrid,
  NGridItem,
  NScrollbar,
  NTooltip,
  NSwitch,
  NSelect,
  NDatePicker,
  NSlider,
  NCheckbox,
  NRadio,
  NRadioGroup,
  NInputNumber,
  NForm,
  NFormItem,
  NDrawer,
  NDrawerContent,
  NTabs,
  NTabPane,
  NBreadcrumb,
  NBreadcrumbItem,
  NAvatar,
  NBadge,
  NProgress,
  NDivider,
  NAlert,
  NResult,
  NBackTop,
  NAffix
} from 'naive-ui'

import App from './App.vue'
import router from './router'

const naive = create({
  components: [
    NButton,
    NCard,
    NDataTable,
    NInput,
    NLayout,
    NLayoutHeader,
    NLayoutSider,
    NLayoutContent,
    NMenu,
    NModal,
    NPagination,
    NDropdown,
    NPopconfirm,
    NMessageProvider,
    NLoadingBarProvider,
    NDialogProvider,
    NConfigProvider,
    NSpace,
    NIcon,
    NTag,
    NEmpty,
    NSpin,
    NGrid,
    NGridItem,
    NScrollbar,
    NTooltip,
    NSwitch,
    NSelect,
    NDatePicker,
    NSlider,
    NCheckbox,
    NRadio,
    NRadioGroup,
    NInputNumber,
    NForm,
    NFormItem,
    NDrawer,
    NDrawerContent,
    NTabs,
    NTabPane,
    NBreadcrumb,
    NBreadcrumbItem,
    NAvatar,
    NBadge,
    NProgress,
    NDivider,
    NAlert,
    NResult,
    NBackTop,
    NAffix
  ]
})

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(naive)

app.mount('#app')
