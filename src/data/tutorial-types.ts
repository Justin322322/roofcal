export interface RoofTypeDetails {
  name: string;
  description: string;
  bestFor: string;
  costRange: string;
  complexity: string;
}

export interface KeyFeature {
  title: string;
  description: string;
}

export interface RoofTypeCard {
  type: string;
  name: string;
  description: string;
}

export interface MaterialInfo {
  name: string;
  cost: string;
  lifespan: string;
  pros: string;
  cons: string;
  bestFor: string;
}

export interface SelectionGuide {
  factor: string;
  description: string;
}

export interface WorkflowStep {
  step: string;
  description: string;
  details?: string[];
}

export interface ProTip {
  tip: string;
  description: string;
}

export interface AdvancedFeature {
  feature: string;
  description: string;
}

export interface ManualEntryOption {
  option: string;
  description: string;
}

export interface BusinessFeature {
  [key: string]: string[];
}

export interface Benefit {
  benefit: string;
  description: string;
}

export interface Integration {
  [key: string]: string[];
}

export interface Consideration {
  consideration: string;
  description: string;
}

export interface ProjectWorkflow {
  step: string;
  description: string;
}

export interface TabContent {
  title: string;
  description: string;
  keyFeatures?: KeyFeature[];
  gettingStarted?: string;
  commonRoofs?: RoofTypeCard[];
  complexRoofs?: RoofTypeCard[];
  selectionTips?: string[];
  materialList?: MaterialInfo[];
  selectionGuide?: SelectionGuide[];
  workflow?: WorkflowStep[];
  proTips?: ProTip[] | string[];
  advancedFeatures?: AdvancedFeature[];
  whenToUse?: string[];
  manualEntryOptions?: ManualEntryOption[];
  bestPractices?: string[];
  features?: BusinessFeature;
  integrations?: Integration;
  benefits?: Benefit[];
  learning?: {
    description: string;
    dataSources: string[];
  };
  gettingMostFromAI?: string[];
  configuration?: BusinessFeature;
  regionalCustomization?: Integration;
  considerations?: Consideration[];
}

export interface TutorialContent {
  roofTypes: {
    [key: string]: RoofTypeDetails;
  };
  tabs: {
    [key: string]: TabContent;
  };
}

export interface RoofTypeImages {
  [key: string]: string;
}
