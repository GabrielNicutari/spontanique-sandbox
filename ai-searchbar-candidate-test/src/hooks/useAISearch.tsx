import { useState } from 'react';
import { AISearchResult } from '@/types/event';
import { analyzeMockPrompt } from '@/lib/mockAI';
import { toast } from 'sonner';

// Configuration - Update these values for your Supabase project
const SUPABASE_URL = 'YOUR_SUPABASE_URL'; // e.g., 'https://xxxxx.supabase.co'
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

// Use mock AI by default for local testing
const USE_MOCK_AI = SUPABASE_URL === 'YOUR_SUPABASE_URL' || !SUPABASE_URL;

export const useAISearch = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzePrompt = async (prompt: string): Promise<AISearchResult | null> => {
    if (!prompt.trim()) return null;

    setIsAnalyzing(true);
    try {
      let result: AISearchResult;

      if (USE_MOCK_AI) {
        // Use mock AI analyzer for local testing
        console.log('Using mock AI analyzer...');
        result = await analyzeMockPrompt(prompt);
      } else {
        // Call the edge function to analyze the prompt with OpenAI
        const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-search`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ prompt }),
        });

        if (!response.ok) {
          throw new Error(`Edge function error: ${response.status}`);
        }

        result = await response.json();
      }

      toast.success('🧠 Smart AI Search', {
        description: result.explanation,
      });

      return result;
    } catch (error) {
      console.error('Error in AI search:', error);
      toast.error('Search Error', {
        description: 'Failed to analyze search. Please try again.',
      });
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  return { analyzePrompt, isAnalyzing };
};
