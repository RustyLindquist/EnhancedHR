const { Innertube } = require('youtubei.js');

async function fetchCaptionWithYoutubei(videoId) {
  console.log(`\n=== Fetching captions for ${videoId} ===`);

  try {
    const youtube = await Innertube.create();
    const info = await youtube.getInfo(videoId);

    console.log('Video title:', info.basic_info.title);

    // Get captions
    const transcriptInfo = await info.getTranscript();

    if (!transcriptInfo || !transcriptInfo.transcript) {
      console.log('No transcript available');
      return { success: false, error: 'No transcript' };
    }

    const content = transcriptInfo.transcript.content;
    if (!content || !content.body || !content.body.initial_segments) {
      console.log('No segments in transcript');
      return { success: false, error: 'No segments' };
    }

    const segments = content.body.initial_segments;
    console.log('Found', segments.length, 'segments');

    // Extract text from segments
    const texts = segments.map(seg => {
      if (seg.snippet && seg.snippet.text) {
        return seg.snippet.text;
      }
      return '';
    }).filter(t => t.length > 0);

    const transcript = texts.join(' ');
    console.log('Transcript length:', transcript.length);
    console.log('Sample:', transcript.substring(0, 200) + '...');

    return { success: true, transcript };

  } catch (error) {
    console.log('Error:', error.message);
    return { success: false, error: error.message };
  }
}

async function main() {
  const testVideos = ['XRqRfuBba8U', 'BZvLOAmepA4'];

  for (const videoId of testVideos) {
    await fetchCaptionWithYoutubei(videoId);
  }
}

main();
