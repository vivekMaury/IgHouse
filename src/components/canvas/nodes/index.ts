export { TriggerNode } from './TriggerNode';
export { MessageNode } from './MessageNode';
export { ConditionNode } from './ConditionNode';
export { DelayNode } from './DelayNode';

import { TriggerNode } from './TriggerNode';
import { MessageNode } from './MessageNode';
import { ConditionNode } from './ConditionNode';
import { DelayNode } from './DelayNode';

export const nodeTypes = {
  trigger: TriggerNode,
  message: MessageNode,
  condition: ConditionNode,
  delay: DelayNode,
};
