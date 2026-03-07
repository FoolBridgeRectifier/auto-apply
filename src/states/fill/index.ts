import type { IGeneralFillResponse } from '../../application-flows/general/interfaces';

let lastFillResult: IGeneralFillResponse | null = null;

export const getLastFillResult = () => lastFillResult;
export const setLastFillResult = (result: IGeneralFillResponse) => {
  lastFillResult = result;
};
