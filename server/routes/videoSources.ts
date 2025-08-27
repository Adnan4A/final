import { Router } from 'express';

const router = Router();

// Enhanced video sources API that provides multiple streaming options
router.get('/video-sources/:movieId', async (req, res) => {
  // DISABLED: Backend API was interfering with frontend iframe embedding
  // Frontend DirectVideoPlayer now handles all sources directly without backend interference
  res.status(200).json({ 
    sources: [], 
    message: 'Frontend-only streaming mode - backend API disabled',
    note: 'DirectVideoPlayer handles iframe sources independently'
  });
  return;
  
  try {
    const { movieId } = req.params;
    const { type = 'movie', season = '1', episode = '1' } = req.query;
    
    // In a real implementation, this would:
    // 1. Check your video database/CDN for available sources
    // 2. Validate user access permissions
    // 3. Generate secure streaming URLs with expiration
    // 4. Check source availability and quality
    
    const videoSources = [
      // High-quality HLS streams (preferred)
      {
        id: `hls_premium_${movieId}`,
        movieId: parseInt(movieId),
        mediaType: type,
        provider: 'hls',
        quality: '1080p',
        language: 'en',
        isActive: true,
        priority: 1,
        isDirectVideo: true,
        url: `https://cdn.example.com/streams/${type}/${movieId}/master.m3u8`,
        headers: {
          'Authorization': 'Bearer YOUR_CDN_TOKEN',
          'User-Agent': 'YourApp/1.0'
        },
        metadata: {
          codec: 'h264',
          bitrate: 5000,
          hasSubtitles: true,
          audiTracks: ['en', 'es', 'fr']
        }
      },
      
      // MP4 Direct streams (fallback)
      {
        id: `mp4_${movieId}`,
        movieId: parseInt(movieId),
        mediaType: type,
        provider: 'direct',
        quality: '720p',
        language: 'en',
        isActive: true,
        priority: 2,
        isDirectVideo: true,
        url: `https://cdn.example.com/videos/${type}/${movieId}/720p.mp4`,
        headers: {
          'Range': 'bytes=0-',
          'User-Agent': 'YourApp/1.0'
        }
      },
      
      // DASH streams for adaptive quality
      {
        id: `dash_${movieId}`,
        movieId: parseInt(movieId),
        mediaType: type,
        provider: 'dash',
        quality: 'auto',
        language: 'en',
        isActive: true,
        priority: 3,
        isDirectVideo: true,
        url: `https://cdn.example.com/streams/${type}/${movieId}/manifest.mpd`,
        headers: {
          'User-Agent': 'YourApp/1.0'
        }
      }
    ];
    
    // For demo purposes, return sample sources with working test streams
    const demoSources = [
      {
        id: `demo_hls_${movieId}`,
        movieId: parseInt(movieId),
        mediaType: type,
        provider: 'hls',
        quality: '1080p',
        language: 'en',
        isActive: true,
        priority: 1,
        isDirectVideo: true,
        url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', // Working HLS test stream
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; VideoPlayer/1.0)'
        }
      },
      {
        id: `demo_mp4_${movieId}`,
        movieId: parseInt(movieId),
        mediaType: type,
        provider: 'direct',
        quality: '720p',
        language: 'en',
        isActive: true,
        priority: 2,
        isDirectVideo: true,
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; VideoPlayer/1.0)'
        }
      }
    ];
    
    res.json(demoSources);
    
  } catch (error) {
    console.error('Error fetching video sources:', error);
    res.status(500).json({ 
      error: 'Failed to fetch video sources',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Health check endpoint for video sources
router.get('/video-sources/:movieId/check', async (req, res) => {
  // DISABLED: Health check was interfering with iframe embedding
  res.status(200).json({ 
    available: true, 
    message: 'Frontend-only mode - no backend health checks',
    note: 'DirectVideoPlayer handles source availability independently'
  });
  return;
  
  try {
    const { movieId } = req.params;
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }
    
    // Simple availability check (in production, use a more sophisticated method)
    try {
      const response = await fetch(url as string, { 
        method: 'HEAD'
      });
      
      res.json({
        available: response.ok,
        status: response.status,
        contentType: response.headers.get('content-type'),
        contentLength: response.headers.get('content-length')
      });
    } catch (fetchError) {
      res.json({
        available: false,
        error: fetchError instanceof Error ? fetchError.message : 'Unknown error'
      });
    }
    
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to check video source',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;