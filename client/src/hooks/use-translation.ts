import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { type Translation } from '@shared/schema';

interface TranslateRequest {
  text: string;
  from: string;
  to: string;
}

interface TranslateResponse {
  translatedText: string;
  confidence: string;
  translation: Translation;
}

export function useTranslation() {
  const queryClient = useQueryClient();

  const translateMutation = useMutation({
    mutationFn: async (request: TranslateRequest): Promise<TranslateResponse> => {
      console.log('🔍 Translation API request:', request);
      const response = await apiRequest('POST', '/api/translate', request);
      const result = await response.json();
      console.log('🔍 Translation API response:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('🔍 Translation mutation success:', data);
      // Invalidate translations list to refresh recent translations
      queryClient.invalidateQueries({ queryKey: ['/api/translations'] });
    },
    onError: (error) => {
      console.error('🔍 Translation mutation error:', error);
    },
  });

  const {
    data: recentTranslations = [],
    isLoading: isLoadingTranslations,
    error: translationsError,
  } = useQuery<Translation[]>({
    queryKey: ['/api/translations'],
    staleTime: 30000, // Consider data fresh for 30 seconds
  });

  const clearHistoryMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('DELETE', '/api/translations');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/translations'] });
    },
  });

  return {
    translate: translateMutation.mutate,
    isTranslating: translateMutation.isPending,
    translationError: translateMutation.error,
    translationResult: translateMutation.data,
    recentTranslations,
    isLoadingTranslations,
    translationsError,
    clearHistory: clearHistoryMutation.mutate,
    isClearingHistory: clearHistoryMutation.isPending,
  };
}
