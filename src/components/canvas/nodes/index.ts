export { TriggerNode } from './TriggerNode';
export { MessageNode } from './MessageNode';
export { ConditionNode } from './ConditionNode';
export { DelayNode } from './DelayNode';
export { LeadCaptureNode } from './LeadCaptureNode';

import { TriggerNode } from './TriggerNode';
import { MessageNode } from './MessageNode';
import { ConditionNode } from './ConditionNode';
import { DelayNode } from './DelayNode';
import { LeadCaptureNode } from './LeadCaptureNode';

export const nodeTypes = {
  trigger: TriggerNode,
  message: MessageNode,
  condition: ConditionNode,
  delay: DelayNode,
  lead_capture: LeadCaptureNode,
};
