'use server';

import { createClient } from '@/lib/supabase/server';
import { generateOpenRouterResponse } from '@/app/actions/ai';
import { Course } from '@/types';
import { fetchCourses } from '@/lib/courses';

export async function getRecommendedCourses(userId: string): Promise<Course[]> {
    const supabase = await createClient();

    // 1. Fetch User Profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (!profile) {
        console.error('Profile not found for recommendations');
        return [];
    }

    // 2. Fetch All Courses
    const allCourses = await fetchCourses();

    // 3. Construct Prompt for Gemini
    const courseList = allCourses.map(c => `- ID: ${c.id}, Title: "${c.title}", Category: ${c.category}, Description: "${c.description}"`).join('\n');
    
    const prompt = `
        You are an expert HR Learning & Development consultant.
        
        USER PROFILE:
        - Role: ${profile.role || 'HR Professional'}
        - Industry: ${profile.industry || 'General'}
        - Interests: ${profile.interests ? profile.interests.join(', ') : 'General HR'}
        - AI Insights (What we know about them): ${profile.ai_insights ? profile.ai_insights.join('; ') : 'None'}

        AVAILABLE COURSES:
        ${courseList}

        TASK:
        Select exactly 4 courses from the list above that are most relevant to this user's profile and learning needs.
        Return ONLY a JSON array of the 4 Course IDs. Do not include any explanation or markdown formatting.
        Example: [1, 5, 12, 3]
    `;

    try {
        // Use a fast model for recommendations
        const response = await generateOpenRouterResponse(
            'google/gemma-2-27b-it:free',
            prompt,
            [],
            { agentType: 'recommendation_engine', userId }
        );

        // Clean response (remove markdown code blocks if present)
        const cleanResponse = response.replace(/```json/g, '').replace(/```/g, '').trim();
        const recommendedIds: number[] = JSON.parse(cleanResponse);

        // Filter courses
        const recommendedCourses = allCourses.filter(c => recommendedIds.includes(c.id));
        
        // Ensure we return exactly 4 (fill with trending/random if AI fails or returns fewer)
        if (recommendedCourses.length < 4) {
             const remaining = allCourses.filter(c => !recommendedIds.includes(c.id)).slice(0, 4 - recommendedCourses.length);
             return [...recommendedCourses, ...remaining];
        }

        return recommendedCourses.slice(0, 4);

    } catch (error) {
        console.error('Error generating recommendations:', error);
        // Fallback: Return first 4 courses
        return allCourses.slice(0, 4);
    }
}
