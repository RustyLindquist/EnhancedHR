const { getSubtitles } = require('youtube-captions-scraper');

async function testCaptionScraper(videoId) {
  console.log(`\n=== Testing ${videoId} ===`);

  try {
    const captions = await getSubtitles({
      videoID: videoId,
      lang: 'en'
    });

    if (captions && captions.length > 0) {
      console.log('SUCCESS! Got', captions.length, 'segments');
      const transcript = captions.map(c => c.text).join(' ');
      console.log('Transcript length:', transcript.length);
      console.log('Sample:', transcript.substring(0, 200) + '...');
      return { success: true, transcript };
    } else {
      console.log('No captions returned');
      return { success: false, error: 'No captions' };
    }
  } catch (err) {
    console.log('ERROR:', err.message);
    return { success: false, error: err.message };
  }
}

async function main() {
  // Test with course videos
  const testVideos = ['XRqRfuBba8U', 'BZvLOAmepA4', 'dQw4w9WgXcQ'];

  for (const videoId of testVideos) {
    await testCaptionScraper(videoId);
  }
}

main();
