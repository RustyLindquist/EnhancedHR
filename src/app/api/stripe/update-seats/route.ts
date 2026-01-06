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

        const { orgId, action } = await req.json()

        if (!orgId) {
            return new NextResponse('Org ID Required', { status: 400 })
        }

        // 1. Verify Org Admin or Platform Admin
        const { data: profile } = await supabase
            .from('profiles')
            .select('org_id, membership_status, role')
            .eq('id', user.id)
            .single()

        const isPlatformAdmin = profile?.role === 'admin';
        if (!isPlatformAdmin && (profile?.org_id !== orgId || profile?.membership_status !== 'org_admin')) {
            return new NextResponse('Unauthorized: Admin only', { status: 403 })
        }

        // 2. Get Org Stripe Details
        const { data: org } = await supabase.from('organizations').select('stripe_customer_id').eq('id', orgId).single()
        
        if (!org?.stripe_customer_id) {
            return new NextResponse('Organization has no billing account. Please upgrade first.', { status: 400 })
        }

        // 3. fetch subscription
        const subscriptions = await stripe.subscriptions.list({
            customer: org.stripe_customer_id,
            status: 'active',
            limit: 1
        })

        if (subscriptions.data.length === 0) {
            return new NextResponse('No active subscription found.', { status: 404 })
        }

        const sub = subscriptions.data[0]
        const subscriptionItemId = sub.items.data[0].id
        const currentQuantity = sub.items.data[0].quantity || 1
        const newQuantity = action === 'increment' ? currentQuantity + 1 : currentQuantity - 1

        if (newQuantity < 1) {
             return new NextResponse('Cannot have less than 1 seat', { status: 400 })
        }

        // 4. Update Subscription
        await stripe.subscriptionItems.update(subscriptionItemId, {
            quantity: newQuantity,
            proration_behavior: 'always_invoice' // Charge immediately for add, credit for remove
        })

        return NextResponse.json({ success: true, newQuantity })

    } catch (error) {
        console.error('Update Seats Error:', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
