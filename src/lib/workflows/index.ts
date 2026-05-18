import { quickWorkflow } from './quick';
import { singleWorkflow } from './single';
import { multiWorkflow } from './multi';
import type { WorkflowContext, WorkflowResult } from './types';

export async function runWorkflow(ctx: WorkflowContext): Promise<WorkflowResult> {
  switch (ctx.settings.mode) {
    case 'quick':
      return quickWorkflow(ctx);
    case 'single':
      return singleWorkflow(ctx);
    case 'multi':
      return multiWorkflow(ctx);
  }
}

export type { WorkflowContext, WorkflowResult, WorkflowProgressEvent, WorkflowStage } from './types';
