export {
  calculateFireNumber,
  calculateYearsToFire,
  calculateCoastFire,
  realReturn,
  projectGrowth,
  fireProgress,
} from "./calculators";

export type {
  FireInput,
  YearsToFireInput,
  CoastFireInput,
  ProjectionInput,
  ProjectionYear,
} from "./calculators";

export {
  projectMultiAccount,
  getTaxTreatmentLabel,
} from "./projections";

export type {
  AccountProjectionInput,
  MultiAccountProjectionInput,
  ProjectionByYear,
} from "./projections";
