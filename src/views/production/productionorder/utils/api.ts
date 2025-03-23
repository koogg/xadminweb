import { BaseApi } from "@/api/base";
import type { BaseResult } from "@/api/types";

class ProductionOrderApi extends BaseApi {
  push = (pk: number | string) => {
    return this.request<BaseResult>(
      "post",
      {},
      {},
      `${this.baseApi}/${pk}/push`
    );
  };
}

const productionprderApi = new ProductionOrderApi(
  "/api/production/production-order"
);
export { productionprderApi };
