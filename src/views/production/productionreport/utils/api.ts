import { BaseApi } from "@/api/base";
import type { BaseResult } from "@/api/types";

class ProductionReportApi extends BaseApi {
  // 完成报工
  complete = (pk: number | string) => {
    return this.request<BaseResult>(
      "post",
      {},
      {},
      `${this.baseApi}/${pk}/complete`
    );
  };

  // 暂停报工
  pause = (pk: number | string) => {
    return this.request<BaseResult>(
      "post",
      {},
      {},
      `${this.baseApi}/${pk}/pause`
    );
  };

  // 恢复报工
  resume = (pk: number | string) => {
    return this.request<BaseResult>(
      "post",
      {},
      {},
      `${this.baseApi}/${pk}/resume`
    );
  };
}

const productionreportApi = new ProductionReportApi(
  "/api/production/production-report"
);

export { productionreportApi };
