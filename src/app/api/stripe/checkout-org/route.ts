import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { headers } from 'next/headers'

export async function POST(req: Request) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const { orgId, quantity = 1 } = await req.json()

        if (!orgId) {
            return new NextResponse('Organization ID is required', { status: 400 })
        }

        // Verify user is admin of this org or platform admin
        const { data: profile } = await supabase
            .from('profiles')
            .select('org_id, membership_status, role')
            .eq('id', user.id)
            .single()

        const isPlatformAdmin = profile?.role === 'admin';
        if (!isPlatformAdmin && (profile?.org_id !== orgId || profile?.membership_status !== 'org_admin')) {
             return new NextResponse('Unauthorized: Must be Org Admin', { status: 403 })
        }

        // Get Org Details for Customer Creation/Lookup
        const { data: org } = await supabase.from('organizations').select('*').eq('id', orgId).single()
        
        let stripeCustomerId = org?.stripe_customer_id

        if (!stripeCustomerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                name: org?.name,
                metadata: {
                    orgId: orgId,
                    userId: user.id // Admin who created it
                }
            })
            stripeCustomerId = customer.id
            
            // Save stripe customer id to org
            await supabase.from('organizations').update({ stripe_customer_id: stripeCustomerId }).eq('id', orgId)
        }

        const checkoutSession = await stripe.checkout.sessions.create({
            customer: stripeCustomerId,
            line_items: [
                {
                    price: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_ORG_SEAT,
                    quantity: quantity,
                },
            ],
            mode: 'subscription',
            success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing?success=true`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing?canceled=true`,
            metadata: {
                orgId: orgId,
                userId: user.id,
                type: 'org_subscription'
            },
            subscription_data: {
                metadata: {
                    orgId: orgId
                }
            }
        })

        return NextResponse.json({ url: checkoutSession.url })
    } catch (error) {
        console.error('Error creating org checkout session:', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
