const https = require('https');

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ data, status: res.statusCode }));
    }).on('error', reject);
  });
}

async function fetchYouTubeCaption(videoId) {
  console.log(`\n=== Fetching captions for ${videoId} ===`);

  // Step 1: Get watch page
  const { data: page } = await fetch(`https://www.youtube.com/watch?v=${videoId}`);

  // Step 2: Extract caption tracks JSON
  const match = page.match(/"captionTracks":(\[[^\]]+\])/);
  if (!match) {
    console.log('No captionTracks found in page');
    return { success: false, error: 'No caption tracks' };
  }

  // Parse the JSON (need to handle escapes)
  const tracksJson = match[1].replace(/\\u0026/g, '&');
  let tracks;
  try {
    tracks = JSON.parse(tracksJson);
  } catch (e) {
    console.log('Failed to parse tracks:', e.message);
    return { success: false, error: 'Parse error' };
  }

  console.log('Found', tracks.length, 'caption tracks');

  // Find English track
  const englishTrack = tracks.find(t => t.languageCode === 'en') || tracks[0];
  if (!englishTrack) {
    return { success: false, error: 'No tracks available' };
  }

  console.log('Using track:', englishTrack.languageCode, englishTrack.name?.simpleText || '');

  const captionUrl = englishTrack.baseUrl;
  console.log('Caption URL:', captionUrl.substring(0, 80) + '...');

  // Step 3: Fetch captions
  const { data: captions, status } = await fetch(captionUrl);
  console.log('HTTP Status:', status);
  console.log('Response length:', captions.length);

  if (captions.length === 0) {
    console.log('Empty response - trying with &fmt=srv3');
    const { data: captions2 } = await fetch(captionUrl + '&fmt=srv3');
    console.log('With fmt=srv3 length:', captions2.length);
    if (captions2.length > 0) {
      return parseCaption(captions2);
    }
  }

  return parseCaption(captions);
}

function parseCaption(xml) {
  if (!xml || xml.length === 0) {
    return { success: false, error: 'Empty caption data' };
  }

  // Parse XML - try different formats
  let textMatches = [...xml.matchAll(/<text[^>]*>([^<]*)<\/text>/g)];

  if (textMatches.length === 0) {
    // Try alternative format
    textMatches = [...xml.matchAll(/<p[^>]*>([^<]*)<\/p>/g)];
  }

  console.log('Found', textMatches.length, 'text segments');

  if (textMatches.length === 0) {
    console.log('Raw XML (first 500):', xml.substring(0, 500));
    return { success: false, error: 'Could not parse caption XML' };
  }

  const transcript = textMatches.map(m => m[1]
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\n/g, ' ')
    .trim()
  ).filter(t => t.length > 0).join(' ');

  console.log('\nTranscript sample (first 200 chars):');
  console.log(transcript.substring(0, 200) + '...');
  console.log('\nTotal transcript length:', transcript.length);

  return { success: true, transcript, length: transcript.length };
}

async function main() {
  // Test with course videos
  const testVideos = ['XRqRfuBba8U', 'BZvLOAmepA4'];

  for (const videoId of testVideos) {
    try {
      const result = await fetchYouTubeCaption(videoId);
      console.log('\nResult:', result.success ? 'SUCCESS' : 'FAILED -', result.error || '');
    } catch (err) {
      console.log('Error:', err.message);
    }
  }
}

main();
