'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function renameCollection(collectionId: string, newName: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'Unauthorized' };
    }

    const { error } = await supabase
        .from('user_collections')
        .update({ label: newName }) // 'label' is the column name based on lib/collections.ts
        .eq('id', collectionId)
        .eq('user_id', user.id); // Security: ensure ownership

    if (error) {
        console.error('Error renaming collection:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/dashboard');
    return { success: true };
}

export async function deleteCollection(collectionId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'Unauthorized' };
    }

    // Deleting the collection row should cascade delete items if FK is set up correctly.
    // If not, we might need manual cleanup, but usually FKs handle this in Supabase.
    // Assuming 'collection_items' and 'user_context_items' have ON DELETE CASCADE.
    
    // Safety check: Don't delete system collections via this action if they are protected by ID logic, 
    // but here we rely on the UI to only allow calling this for custom ones.
    // We can double check 'is_custom' column if we want to be paranoid.

    const { error } = await supabase
        .from('user_collections')
        .delete()
        .eq('id', collectionId)
        .eq('user_id', user.id);

    if (error) {
        console.error('Error deleting collection:', error);
        return { success: false, error: error.message };
    }
    
    console.log('Successfully deleted collection:', collectionId);

    revalidatePath('/dashboard');
    return { success: true };
}
