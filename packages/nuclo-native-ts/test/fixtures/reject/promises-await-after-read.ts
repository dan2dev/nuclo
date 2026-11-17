// expect: `await` after a value of the template it reads first
// code: NUCLO6002
interface Job {
  name: string;
  result: Promise<number>;
}
export async function show(job: Job): Promise<string> {
  return `${job.name} ${await job.result}`;
}
