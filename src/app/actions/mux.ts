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
    } catch (error) {
        console.error('Error creating Mux upload:', error);
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
