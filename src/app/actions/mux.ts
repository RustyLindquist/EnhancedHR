'use server';

import Mux from '@mux/mux-node';

const mux = new Mux({
    tokenId: process.env.MUX_TOKEN_ID,
    tokenSecret: process.env.MUX_TOKEN_SECRET,
});

export async function getMuxUploadUrl() {
    try {
        const upload = await mux.video.uploads.create({
            new_asset_settings: {
                playback_policy: ['public'],
                encoding_tier: 'smart',
            },
            cors_origin: '*', // In production, restrict this to your domain
        });

        return {
            uploadUrl: upload.url,
            uploadId: upload.id,
        };
    } catch (error: any) {
        console.error('Error creating Mux upload:', error);

        // Extract user-friendly error message from Mux API response
        const muxMessage = error?.error?.messages?.[0] || error?.message;
        if (muxMessage?.includes('Free plan is limited')) {
            throw new Error('Mux video limit reached. Please delete unused videos or upgrade your Mux plan.');
        }

        throw new Error('Failed to create upload URL');
    }
}

export async function getMuxAssetId(uploadId: string) {
    try {
        const upload = await mux.video.uploads.retrieve(uploadId);
        return upload.asset_id;
    } catch (error) {
        console.error('Error retrieving Mux upload:', error);
        return null;
    }
}

export async function createMuxAssetFromUrl(url: string, passthrough?: string) {
    try {
        const asset = await mux.video.assets.create({
            input: [{ url }],
            playback_policy: ['public'],
            encoding_tier: 'smart',
            passthrough, // We can store our internal ID here
        } as any);
        return asset;
    } catch (error) {
        console.error("Mux Creation Error:", error);
        throw error;
    }
}

export async function getMuxAssetDetails(assetId: string) {
    try {
        const asset = await mux.video.assets.retrieve(assetId);
        return {
            duration: asset.duration,
            playbackId: asset.playback_ids?.[0]?.id,
            status: asset.status,
        };
    } catch (error) {
        console.error('Error retrieving Mux asset:', error);
        return null;
    }
}

export async function waitForMuxAssetReady(assetId: string, maxAttempts: number = 60): Promise<{ ready: boolean; playbackId?: string; duration?: number }> {
    for (let i = 0; i < maxAttempts; i++) {
        const details = await getMuxAssetDetails(assetId);
        if (details?.status === 'ready' && details.playbackId) {
            return {
                ready: true,
                playbackId: details.playbackId,
                duration: details.duration,
            };
        }
        if (details?.status === 'errored') {
            return { ready: false };
        }
        // Wait 2 seconds between checks
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    return { ready: false };
}

export async function deleteMuxAsset(assetId: string): Promise<boolean> {
    try {
        await mux.video.assets.delete(assetId);
        return true;
    } catch (error) {
        console.error('Error deleting Mux asset:', error);
        return false;
    }
}
