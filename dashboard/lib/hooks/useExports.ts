import { useMutation } from '@tanstack/react-query';

export function useExports(caseStudyId: string) {
  return useMutation({
    mutationFn: async (format: 'csv' | 'parquet') => {
      const response = await fetch(`/api/metrics/${caseStudyId}/exports?format=${format}`);
      if (!response.ok) {
        throw new Error('Failed to export data');
      }

      if (format === 'csv') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `case-study-${caseStudyId}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }

      return response;
    },
  });
}
