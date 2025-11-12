/**
 * JSON reporter for programmatic consumption
 */

import { AnalysisResult, ProjectInfo } from '../types';

export class JSONReporter {
  /**
   * Report analysis results as JSON
   */
  report(result: AnalysisResult, projectInfo?: ProjectInfo): void {
    const output = {
      timestamp: new Date().toISOString(),
      project: projectInfo,
      analysis: result,
    };

    console.log(JSON.stringify(output, null, 2));
  }
}
