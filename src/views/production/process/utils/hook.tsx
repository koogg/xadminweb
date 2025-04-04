import { processApi } from "@/views/production/process/utils/api";
import { getCurrentInstance, reactive, type Ref } from "vue";
import { getDefaultAuths } from "@/router/utils";
import { useI18n } from "vue-i18n";

export function useProcess(tableRef: Ref) {
  // 权限判断，用于判断是否有该权限
  const api = reactive(processApi);
  const auth = reactive({
    push: false,
    ...getDefaultAuths(getCurrentInstance(), ["push"])
  });
  const { t } = useI18n();

  return {
    api,
    auth
  };
}
