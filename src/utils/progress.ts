export const calculateProgress = (completed: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
};

export const getProgressColor = (percentage: number): string => {
  if (percentage >= 80) return 'bg-green-500';
  if (percentage >= 50) return 'bg-blue-500';
  if (percentage >= 25) return 'bg-yellow-500';
  return 'bg-red-500';
};

export const calculateWeeklyStudyTime = (sessions: { duration_minutes: number }[]): number => {
  return sessions.reduce((total, session) => total + session.duration_minutes, 0);
};

export const calculateAverageScore = (quizzes: { total_score: number; max_score: number }[]): number => {
  if (quizzes.length === 0) return 0;

  const totalPercentage = quizzes.reduce((sum, quiz) => {
    return sum + (quiz.max_score > 0 ? (quiz.total_score / quiz.max_score) * 100 : 0);
  }, 0);

  return Math.round(totalPercentage / quizzes.length);
};

export const getTaskStatusCount = (tasks: { status: string }[]) => {
  return tasks.reduce((acc, task) => {
    acc[task.status] = (acc[task.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
};

export const getCategoryProgress = (
  completedSections: number,
  totalSections: number
): { percentage: number; remaining: number } => {
  return {
    percentage: calculateProgress(completedSections, totalSections),
    remaining: totalSections - completedSections
  };
};
