import React from 'react';
import {
  Dialog,
  DialogContent,
  IconButton,
  Paper,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const MediaPreview = ({ open, mediaUrl, onClose }) => {
  if (!mediaUrl) return null;

  const getMediaType = (url) => {
    const extension = url.split('.').pop().toLowerCase();
    const videoExtensions = ['mp4', 'webm', 'ogg', 'mov', 'avi'];
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];

    if (videoExtensions.includes(extension)) {
      return 'video';
    }
    if (imageExtensions.includes(extension)) {
      return 'image';
    }
    return 'unknown';
  };

  const mediaType = getMediaType(mediaUrl);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        style: {
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          boxShadow: 'none',
        },
      }}
    >
      <IconButton
        onClick={onClose}
        style={{
          position: 'absolute',
          right: 8,
          top: 8,
          color: 'white',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1,
        }}
      >
        <CloseIcon />
      </IconButton>
      <DialogContent
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 16,
          minHeight: '400px',
        }}
      >
        {mediaType === 'video' && (
          <video
            src={mediaUrl}
            controls
            autoPlay
            style={{
              maxWidth: '100%',
              maxHeight: '80vh',
              outline: 'none',
            }}
          >
            <track kind="captions" />
            <source src={mediaUrl} />
            Your browser does not support the video tag.
          </video>
        )}
        {mediaType === 'image' && (
          <img
            src={mediaUrl}
            alt="Media preview"
            style={{
              maxWidth: '100%',
              maxHeight: '80vh',
              objectFit: 'contain',
            }}
          />
        )}
        {mediaType === 'unknown' && (
          <Paper
            style={{
              padding: 24,
              textAlign: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
            }}
          >
            <p>Unable to preview this media type.</p>
            <a
              href={mediaUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#90caf9' }}
            >
              Open in new tab
            </a>
          </Paper>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MediaPreview;
