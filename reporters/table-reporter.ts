import type { Reporter, TestCase, TestResult, FullResult } from '@playwright/test/reporter';

type Row = {
  Project: string;
  Test: string;
  Status: string;
  'Duration (ms)': number;
};

export default class TableReporter implements Reporter {
  private rows: Row[] = [];

  onTestEnd(test: TestCase, result: TestResult) {
    this.rows.push({
      Project: test.parent.project()?.name ?? '',
      Test: `${test.parent.title} › ${test.title}`,
      Status: result.status,
      'Duration (ms)': result.duration,
    });
  }

  onEnd(result: FullResult) {
    console.log('\nTest Results');
    console.table(this.rows);

    const passed = this.rows.filter((r) => r.Status === 'passed').length;
    const failed = this.rows.filter((r) => r.Status === 'failed' || r.Status === 'timedOut').length;
    const skipped = this.rows.filter((r) => r.Status === 'skipped').length;

    console.log(
      `Total: ${this.rows.length}  Passed: ${passed}  Failed: ${failed}  Skipped: ${skipped}  (overall: ${result.status})\n`,
    );
  }
}
