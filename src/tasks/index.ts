import { TasksPayload } from "./jobs.types";

export const setupTasks = async (): Promise<{
	jobs: Record<string, (payload: Record<string, any>) => Promise<void>>;
	crons: {
		task: string;
		match: string;
	}[];
	longRunningJobs: string[];
}> => {

	// jobs here
	const getters: (() => Promise<TasksPayload>)[] = [
	];
	const jobs: Record<string, (payload: Record<string, any>) => Promise<void>> = {};
	const crons: {
		task: string;
		match: string;
	}[] = [];
	const longRunningJobs = [] as string[];

	for (const getter of getters) {
		const { jobs: getterJobs, crons: getterCrons } = await getter();

		// Add the jobs to be executed
		const jobKeys = Object.keys(getterJobs);
		for (const jobKey of jobKeys) {
			if (jobs[jobKey]) {
				throw new Error(`Jobs can't be defined more than once: '${jobKey}'`);
			}
			const job = getterJobs[jobKey]!;

			// Hack: there is a slight conversion between TasksJobs here, to simply action: () => Promise<void>
			jobs[jobKey] = job.action;

			if (job.longRunning) {
				longRunningJobs.push(jobKey);
			}
		}

		// Add the crons to be scheduled
		for (const cron of getterCrons) {
			if (!jobs[cron.task]) {
				throw new Error('Crons need to have a job associated to them.');
			}

			crons.push(cron);
		}
	}
	return { jobs, crons, longRunningJobs };

};