import React from 'react';
import UniversalCard from '@/components/cards/prototype/UniversalCard';

export default function CardPrototypesPage() {
    return (
        <div className="min-h-screen bg-[#050B14] p-20">
            <h1 className="text-3xl font-light text-white mb-10">New Card Design Prototypes</h1>

            <div className="grid gap-8" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(370px, 1fr))' }}>

                {/* 1. Course Card */}
                <UniversalCard
                    type="COURSE"
                    title="This is the title of the course"
                    subtitle="Course Author"
                    description="This is the description of the course, it will describe what the course is about and make the user want to learn more about it."
                    meta="1 hr 45 min"
                    actionLabel="LAUNCH"
                    imageUrl="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop"
                    categories={['Leadership', 'Management', 'HR']}
                    rating={4.8}
                    credits={{ shrm: 2.5, hrci: 2.5 }}
                />

                {/* 2. Module Card */}
                <UniversalCard
                    type="MODULE"
                    title="This is the title of the module"
                    subtitle="Course Author"
                    description="This is the title of the course the module comes from"
                    meta="20 min"
                    actionLabel="LAUNCH"
                    imageUrl="https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=800&auto=format&fit=crop"
                />

                {/* 3. Lesson Card */}
                <UniversalCard
                    type="LESSON"
                    title="This is the title of the lesson"
                    subtitle="Course Author"
                    description="This is the title of the course the module comes from"
                    meta="5 min"
                    actionLabel="LAUNCH"
                    imageUrl="https://images.unsplash.com/photo-1507413245164-6160d8298b31?q=80&w=800&auto=format&fit=crop"
                />

                {/* 4. Course Resource Card */}
                <UniversalCard
                    type="RESOURCE"
                    title="File_Name.pdf"
                    subtitle="Course Author"
                    description="This is the title of the course the module comes from"
                    meta="( 2.5 MB )"
                // actionLabel="DOWNLOAD" // Resource layout in image has download icon instead
                />

                {/* 5. Conversation Card */}
                <UniversalCard
                    type="CONVERSATION"
                    title="This is the title of the conversation"
                    description="This is text is where you load the beginning of the first exchange in the conversation. Just the first few sentences of the original prompt, which will be con..."
                    meta="20 min"
                    actionLabel="RESUME"
                />

                {/* 6. Custom Context Card */}
                <UniversalCard
                    type="CONTEXT"
                    title="This is the title of the context"
                    description="This will load just the first few sentences of whatever the user entered in their custom context. If it's longer than the space allows, it will just concatenate, like th..."
                    meta="AUG 24, 2025"
                    actionLabel="EDIT"
                />

            </div>
        </div>
    );
}
