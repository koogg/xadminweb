<script lang="ts" setup>
import { RePlusPage } from "@/components/RePlusPage";
import { useProductionReport } from "./utils/hook";
import { ref, computed } from "vue";
import MobileView from "./components/MobileView.vue";
import { useWindowSize } from "@vueuse/core";

defineOptions({
  name: "生产报工"
});

const tableRef = ref();
const { api, auth, operationButtonsProps, listColumnsFormat } =
  useProductionReport(tableRef);

// 判断是否为移动端
const { width } = useWindowSize();
const isMobile = computed(() => width.value < 768);
</script>

<template>
  <component
    :is="isMobile ? MobileView : RePlusPage"
    ref="tableRef"
    :api="api"
    :auth="auth"
    :locale-name="isMobile ? undefined : 'ProductionReport'"
    :operationButtonsProps="isMobile ? undefined : operationButtonsProps"
    :list-columns-format="isMobile ? undefined : listColumnsFormat"
  />
</template>
