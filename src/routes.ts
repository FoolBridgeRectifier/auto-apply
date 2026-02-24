import { hirebridgeFlow, workdayFlow } from './application-flows';
import { greenhouseFlow } from './application-flows/greenhouse';
import { APPLICATION_FLOWS } from './enums';

export const routes = {
  [APPLICATION_FLOWS.WORKDAY]: {
    url: 'workday',
    flow: workdayFlow,
  },
  [APPLICATION_FLOWS.GREENHOUSE]: {
    url: 'greenhouse',
    flow: greenhouseFlow,
  },
  [APPLICATION_FLOWS.HIREBRIDGE]: {
    url: 'hirebridge',
    flow: hirebridgeFlow,
  },
};
