import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

export async function POST(req: Request) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const formData = await req.formData()
        const orgId = formData.get('orgId') as string

        if (!orgId) {
            return new NextResponse('Organization ID is required', { status: 400 })
        }

        // 1. Get Organization details
        const { data: org, error: orgError } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', orgId)
            .single()

        if (orgError || !org) {
            return new NextResponse('Organization not found', { status: 404 })
        }

        // 2. Check Seat Limits via Stripe
        let seatLimit = 5; // Default for trial/free
        let activeMembers = 0;

        // Count current members
        const { count, error: countError } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('org_id', orgId)
            .neq('membership_status', 'inactive') // Only active/trial/admin/employee count

        if (countError) {
             console.error('Error counting members:', countError)
             return new NextResponse('Internal Error', { status: 500 })
        }
        activeMembers = count || 0;

        // Retrieve Stripe Subscription if exists
        if (org.stripe_customer_id) {
             const subscriptions = await stripe.subscriptions.list({
                 customer: org.stripe_customer_id,
                 status: 'active',
                 limit: 1
             })

             if (subscriptions.data.length > 0) {
                 const sub = subscriptions.data[0]
                 // Assuming single item subscription for seats
                 seatLimit = sub.items.data[0].quantity || 0
             }
        }

        if (activeMembers >= seatLimit) {
             // Redirect with error
             // We can't return simple text if this is a form submission redirect
             const referer = req.headers.get('referer') || '/'
             const url = new URL(referer)
             url.searchParams.set('error', 'Organization is full. Please contact administrator.')
             return NextResponse.redirect(url)
        }

        // 3. Link User to Org
        // Using Admin client to bypass any potential RLS on update if needed, 
        // though usually users can update their own profile? 
        // Actually, updating `org_id` might be restricted. 
        // Safer to use service role if logic is server-side authoritative.
        // For now using `supabase` context which is the user. 
        // IF RLS blocks this, we need `createAdminClient`.
        
        // Let's rely on standard client first, assuming RLS allows update if you accept invite (which is this flow).
        // BUT strict RLS might prevent setting `membership_status` to `employee`.
        // I will use `supabase` for now. If it fails I'll switch to admin.
        
        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                org_id: orgId,
                membership_status: 'employee',
                role: 'user'
            })
            .eq('id', user.id)

        if (updateError) {
            console.error('Error linking user:', updateError)
            return new NextResponse('Failed to join organization', { status: 500 })
        }

        return NextResponse.redirect(new URL('/dashboard', req.url))

    } catch (error) {
        console.error('Join Org Error:', error)
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}
