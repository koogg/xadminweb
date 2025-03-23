import { BaseApi } from "@/api/base";
import type { BaseResult } from "@/api/types";

class ProductionReport extends BaseApi {
  push = (pk: number | string) => {
    return this.request<BaseResult>(
      "post",
      {},
      {},
      `${this.baseApi}/${pk}/push`
    );
  };
}

const productionreportApi = new ProductionReport(
  "/api/production/production-report"
);
export { productionreportApi };
