import { getAgentResponse } from '../src/lib/ai/engine';
import { ContextScope } from '../src/lib/ai/types';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function verifyArchitecture() {
    console.log('🧪 Verifying Object-Oriented Context Engineering...');

    // 1. Test Course Scope
    const courseScope: ContextScope = {
        type: 'COURSE',
        id: '1' // Assuming course ID 1 exists (from seed data)
    };

    console.log('\n--- Testing Course Assistant (Scope: COURSE) ---');
    try {
        const response = await getAgentResponse(
            'course_assistant',
            'What is this course about?',
            courseScope
        );
        console.log('✅ Agent Response:', response.text.substring(0, 100) + '...');
        console.log('✅ Sources Found:', response.sources?.length);
    } catch (error) {
        console.error('❌ Error testing Course Assistant:', error);
    }

    // 2. Test Platform Scope
    const platformScope: ContextScope = {
        type: 'PLATFORM'
    };

    console.log('\n--- Testing Platform Assistant (Scope: PLATFORM) ---');
    try {
        const response = await getAgentResponse(
            'platform_assistant',
            'What is EnhancedHR?',
            platformScope
        );
        console.log('✅ Agent Response:', response.text.substring(0, 100) + '...');
        console.log('✅ Sources Found:', response.sources?.length);
    } catch (error) {
        console.error('❌ Error testing Platform Assistant:', error);
    }
}

verifyArchitecture();
