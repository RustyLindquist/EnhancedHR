const https = require('https');

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function fetchYouTubeCaptionsDirect(videoId) {
  console.log('Fetching captions for video:', videoId);

  // Step 1: Fetch the watch page to get caption track URLs
  const pageHtml = await httpsGet('https://www.youtube.com/watch?v=' + videoId);

  // Extract captionTracks from the page
  const captionMatch = pageHtml.match(/"captionTracks":(\[.*?\])/);
  if (!captionMatch) {
    return { success: false, error: 'No caption tracks found in page' };
  }

  let tracks;
  try {
    tracks = JSON.parse(captionMatch[1]);
  } catch (e) {
    return { success: false, error: 'Failed to parse caption tracks: ' + e.message };
  }

  console.log('Found', tracks.length, 'caption tracks');

  if (tracks.length === 0) {
    return { success: false, error: 'No caption tracks available' };
  }

  // Step 2: Fetch the actual captions (prefer English or first available)
  const englishTrack = tracks.find(t => t.languageCode === 'en' || (t.languageCode && t.languageCode.startsWith('en'))) || tracks[0];
  console.log('Using track:', englishTrack.languageCode, englishTrack.name?.simpleText || '');

  const captionUrl = englishTrack.baseUrl;

  // Fetch caption XML
  const captionXml = await httpsGet(captionUrl);

  // Parse the XML to extract text
  const textMatches = [...captionXml.matchAll(/<text[^>]*>([^<]*)<\/text>/g)];
  const texts = textMatches.map(match => {
    // Decode HTML entities
    return match[1]
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\\n/g, ' ')
      .trim();
  }).filter(t => t.length > 0);

  const transcript = texts.join(' ').trim();

  return {
    success: true,
    transcript,
    segmentCount: texts.length
  };
}

// Test with course videos
async function main() {
  const testVideos = ['XRqRfuBba8U', 'BZvLOAmepA4', 'dQw4w9WgXcQ'];

  for (const videoId of testVideos) {
    console.log('\n--- Testing', videoId, '---');
    try {
      const result = await fetchYouTubeCaptionsDirect(videoId);
      if (result.success) {
        console.log('SUCCESS!');
        console.log('Segments:', result.segmentCount);
        console.log('Transcript length:', result.transcript.length);
        console.log('Sample:', result.transcript.substring(0, 150) + '...');
      } else {
        console.log('FAILED:', result.error);
      }
    } catch (err) {
      console.log('ERROR:', err.message);
    }
  }
}

main();
