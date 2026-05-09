-- Add response column to test_results to store candidate's actual task submission
ALTER TABLE public.test_results ADD COLUMN response TEXT;

-- Add task_prompt column to store what the task/question was
ALTER TABLE public.test_results ADD COLUMN task_prompt TEXT;