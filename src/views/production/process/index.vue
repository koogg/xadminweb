<script lang="ts" setup>
import { RePlusPage } from "@/components/RePlusPage";
import { useProcess } from "./utils/hook";
import { ref } from "vue";

defineOptions({
  name: "工艺管理" // 必须定义，用于菜单自动匹配组件
});
const tableRef = ref();
const { api, auth } = useProcess(tableRef);
</script>
<template>
  <RePlusPage ref="tableRef" :api="api" :auth="auth" locale-name="Process" />
</template>
