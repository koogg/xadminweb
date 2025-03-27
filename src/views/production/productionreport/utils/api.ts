import { BaseApi } from "@/api/base";
import type { BaseResult } from "@/api/types";

class ProductionreportApi extends BaseApi {
  push = (pk: number | string) => {
    return this.request<BaseResult>(
      "post",
      {},
      {},
      `${this.baseApi}/${pk}/push`
    );
  };

  // 添加完成报工接口
  complete = (pk: number | string) => {
    return this.request<BaseResult>(
      "post",
      {},
      {},
      `${this.baseApi}/${pk}/complete`
    );
  };

  // 添加暂停报工接口
  pause = (pk: number | string) => {
    return this.request<BaseResult>(
      "post",
      {},
      {},
      `${this.baseApi}/${pk}/pause`
    );
  };

  // 添加恢复报工接口
  resume = (pk: number | string) => {
    return this.request<BaseResult>(
      "post",
      {},
      {},
      `${this.baseApi}/${pk}/resume`
    );
  };
}

const productionreportApi = new ProductionreportApi(
  "/api/production/production-report"
);
export { productionreportApi };
