/**
 * DevFlow AI Project Planner
 */

import { aiEngine } from './ai.js';

export async function generateProjectBlueprint(projectName, projectDescription = '') {
  try {
    return await aiEngine.callGroq('project_planner', {
      project: projectName,
      description: projectDescription
    });
  } catch (err) {
    console.error('Project planner error:', err);
    return {
      recommended_stack: ['PostgreSQL', 'Node.js', 'Frontend'],
      milestones: ['Architecture', 'Implementation', 'Deployment'],
      initial_tasks: []
    };
  }
}
